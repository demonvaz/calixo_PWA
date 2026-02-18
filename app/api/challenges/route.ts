import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDateKey } from '@/lib/challenge-date';

/** PRNG determinístico con semilla (mismo seed = misma secuencia) */
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash;
  }
  return function () {
    hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
    hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
    return ((hash ^ (hash >>> 16)) >>> 0) / 0xffffffff;
  };
}

/** Selecciona 3 retos diarios: 1 corto (≤30min), 1 medio (31-60min), 1 largo (>60min) */
function selectDailyChallenges<T extends { id: number; duration_minutes?: number | null }>(
  challenges: T[],
  seed: string
): T[] {
  const rand = seededRandom(seed);

  const short = challenges.filter((c) => (c.duration_minutes ?? 30) <= 30);
  const medium = challenges.filter((c) => {
    const m = c.duration_minutes ?? 45;
    return m > 30 && m <= 60;
  });
  const long = challenges.filter((c) => (c.duration_minutes ?? 90) > 60);

  const pickOne = (arr: T[]): T | null => {
    if (arr.length === 0) return null;
    return arr[Math.floor(rand() * arr.length)];
  };

  const selected: T[] = [];
  const pickedShort = pickOne(short);
  const pickedMedium = pickOne(medium);
  const pickedLong = pickOne(long);

  if (pickedShort) selected.push(pickedShort);
  if (pickedMedium) selected.push(pickedMedium);
  if (pickedLong) selected.push(pickedLong);

  const remaining = challenges.filter((c) => !selected.includes(c));
  while (selected.length < 3 && remaining.length > 0) {
    const idx = Math.floor(rand() * remaining.length);
    selected.push(remaining.splice(idx, 1)[0]);
  }

  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected;
}

/**
 * GET /api/challenges
 * Retrieve available challenges for the authenticated user
 * Filters by type: daily, focus, social
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'daily' | 'focus' | 'social' | null;

    // Build query for challenges
    let query = supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true);

    if (type) {
      query = query.eq('type', type);
    }

    const { data: availableChallenges, error: challengesError } = await query;

    if (challengesError) {
      console.error('Error fetching challenges from database:', challengesError);
      throw challengesError;
    }

    console.log('Available challenges from DB:', availableChallenges);
    console.log('Type filter:', type);
    console.log('Number of challenges found:', availableChallenges?.length || 0);

    // Try to get user profile (optional for MVP)
    let userProfile = null;
    let maxDailyChallenges = 1;
    let todaysChallengesCount = 0;
    let activeChallengeIds: number[] = [];

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userData) {
        userProfile = userData;
        maxDailyChallenges = userData.is_premium ? 3 : 1;

        // Get today's challenges count (excluding canceled challenges)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data: todaysChallenges } = await supabase
          .from('user_challenges')
          .select('*')
          .eq('user_id', user.id)
          .not('status', 'in', '("canceled","not_claimed")')
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString());

        todaysChallengesCount = todaysChallenges?.length || 0;

        // Get active challenge IDs to exclude from the list
        const { data: activeChallenges } = await supabase
          .from('user_challenges')
          .select('challenge_id')
          .eq('user_id', user.id)
          .eq('status', 'in_progress');

        if (activeChallenges && activeChallenges.length > 0) {
          activeChallengeIds = activeChallenges.map(ac => ac.challenge_id);
        }
      }
    } catch (profileError) {
      // Profile table might not exist yet, use defaults
      console.log('Profile table not available, using defaults');
    }

    // Ensure we have an array
    let challenges = Array.isArray(availableChallenges) ? availableChallenges : [];
    
    // Filter out challenges that are currently active (solo para el tipo solicitado)
    if (type === 'daily' && activeChallengeIds.length > 0) {
      challenges = challenges.filter(challenge => !activeChallengeIds.includes(challenge.id));
      console.log(`Filtered out ${activeChallengeIds.length} active challenge(s) from list`);
    } else if (type !== 'daily' && activeChallengeIds.length > 0) {
      challenges = challenges.filter(challenge => !activeChallengeIds.includes(challenge.id));
    }
    
    console.log('Processing challenges:', challenges.length);

    // Para type=daily: seleccionar 3 retos (1 corto, 1 medio, 1 largo) por usuario y día
    if (type === 'daily' && challenges.length > 0) {
      const dateKey = getDateKey();
      const seed = `${dateKey}-${user.id}`;
      challenges = selectDailyChallenges(challenges, seed);
      console.log('Selected', challenges.length, 'daily challenges for', dateKey);
    }

    // Para type=daily, obtener también el primer reto focus (para el banner Modo Focus)
    let focusChallenge = null;
    if (type === 'daily') {
      const { data: focusChallenges } = await supabase
        .from('challenges')
        .select('id, title, description, type')
        .eq('type', 'focus')
        .eq('is_active', true)
        .limit(1);
      focusChallenge = focusChallenges?.[0] || null;
    }

    // Add metadata to challenges
    const challengesWithMetadata = challenges.map((challenge) => {
      let canStart = true;
      let reason = '';

      if (challenge.type === 'daily' && userProfile) {
        const dailyChallengesCount = todaysChallengesCount;
        if (dailyChallengesCount >= maxDailyChallenges) {
          canStart = false;
          reason = userProfile.is_premium
            ? 'Has alcanzado el límite de retos diarios (3)'
            : 'Has alcanzado el límite de retos diarios gratuitos (1). Actualiza a Premium para más retos.';
        }
      }

      return {
        id: challenge.id,
        type: challenge.type,
        title: challenge.title,
        description: challenge.description,
        reward: challenge.reward,
        durationMinutes: challenge.duration_minutes,
        isActive: challenge.is_active,
        createdAt: challenge.created_at,
        canStart,
        reason,
      };
    });

    const response = {
      challenges: challengesWithMetadata,
      userProfile: {
        isPremium: userProfile?.is_premium || false,
        maxDailyChallenges,
        todaysChallengesCount,
      },
      focusChallenge: type === 'daily' ? focusChallenge : undefined,
    };

    console.log('Sending response with', challengesWithMetadata.length, 'challenges');
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Error al obtener los retos' },
      { status: 500 }
    );
  }
}






