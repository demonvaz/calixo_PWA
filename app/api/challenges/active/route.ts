import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/challenges/active
 * Get the currently active challenge for the authenticated user
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
    if (activeChallenge.session_data && typeof activeChallenge.session_data === 'object') {
      const sessionData = activeChallenge.session_data as any;
      if (sessionData.durationMinutes) {
        durationMinutes = sessionData.durationMinutes;
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
        reward: challenge.reward,
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
