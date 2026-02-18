import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDateKey, getDateKeyForTimestamp } from '@/lib/challenge-date';

/**
 * GET /api/challenges/active
 * Get the currently active challenge for the authenticated user
 * Retos 'finished' no reclamados expiran a las 2:00 AM (Madrid) y pasan a 'not_claimed'
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

    // Get active challenge (in_progress) or finished challenge
    const { data: activeChallenge, error: challengeError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['in_progress', 'finished'])
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (challengeError) {
      // No active or finished challenge found
      if (challengeError.code === 'PGRST116') {
        return NextResponse.json({
          activeChallenge: null,
        });
      }
      throw challengeError;
    }

    if (!activeChallenge) {
      return NextResponse.json({
        activeChallenge: null,
      });
    }

    // Si está 'finished' y es de un día anterior (pasó el cambio de retos a las 2 AM), expirar
    if (activeChallenge.status === 'finished' && activeChallenge.finished_at) {
      const challengeDateKey = getDateKeyForTimestamp(activeChallenge.finished_at);
      const todayDateKey = getDateKey();
      if (challengeDateKey < todayDateKey) {
        await supabase
          .from('user_challenges')
          .update({ status: 'not_claimed' })
          .eq('id', activeChallenge.id)
          .eq('user_id', user.id);
        return NextResponse.json({
          activeChallenge: null,
        });
      }
    }

    // Get challenge details
    const { data: challenge, error: challengeDetailsError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', activeChallenge.challenge_id)
      .single();

    if (challengeDetailsError || !challenge) {
      return NextResponse.json({
        activeChallenge: null,
      });
    }

    // Get duration from session_data if available (for custom focus challenges)
    let durationMinutes = challenge.duration_minutes || 60;
    let reward = challenge.reward;
    if (activeChallenge.session_data && typeof activeChallenge.session_data === 'object') {
      const sessionData = activeChallenge.session_data as { durationMinutes?: number };
      if (sessionData.durationMinutes) {
        durationMinutes = sessionData.durationMinutes;
        // Para focus: 1 moneda por hora
        if (challenge.type === 'focus') {
          reward = Math.floor(durationMinutes / 60);
        }
      }
    }

    return NextResponse.json({
      activeChallenge: {
        id: activeChallenge.id,
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        challengeType: challenge.type,
        status: activeChallenge.status,
        startedAt: activeChallenge.started_at,
        finishedAt: activeChallenge.finished_at,
        durationMinutes,
        reward,
      },
    });
  } catch (error) {
    console.error('Error fetching active challenge:', error);
    return NextResponse.json(
      { error: 'Error al obtener el reto activo' },
      { status: 500 }
    );
  }
}
