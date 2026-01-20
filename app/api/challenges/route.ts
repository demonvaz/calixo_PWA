import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
          .neq('status', 'canceled') // Exclude canceled challenges from the count
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString());

        todaysChallengesCount = todaysChallenges?.length || 0;
      }
    } catch (profileError) {
      // Profile table might not exist yet, use defaults
      console.log('Profile table not available, using defaults');
    }

    // Ensure we have an array
    const challenges = Array.isArray(availableChallenges) ? availableChallenges : [];
    
    console.log('Processing challenges:', challenges.length);

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






