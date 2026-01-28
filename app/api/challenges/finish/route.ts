import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/challenges/finish
 * Marca un reto como finalizado cuando el timer termina (sistema de confianza)
 * Crea una notificación para que el usuario pueda reclamarlo
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userChallengeId, sessionData } = body;

    if (!userChallengeId) {
      return NextResponse.json(
        { error: 'User Challenge ID es requerido' },
        { status: 400 }
      );
    }

    // Get the user challenge
    const { data: userChallenge, error: challengeError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('id', userChallengeId)
      .eq('user_id', user.id)
      .single();

    if (challengeError || !userChallenge) {
      return NextResponse.json(
        { error: 'Reto no encontrado' },
        { status: 404 }
      );
    }

    if (userChallenge.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Este reto no está en progreso' },
        { status: 400 }
      );
    }

    // Get challenge details
    const { data: challenge, error: challengeDetailsError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', userChallenge.challenge_id)
      .single();

    if (challengeDetailsError || !challenge) {
      return NextResponse.json(
        { error: 'Reto no encontrado' },
        { status: 404 }
      );
    }

    // Update user challenge to finished
    const finishedAt = new Date().toISOString();
    const { error: updateChallengeError } = await supabase
      .from('user_challenges')
      .update({
        status: 'finished',
        finished_at: finishedAt,
        session_data: sessionData || userChallenge.session_data,
      })
      .eq('id', userChallengeId);

    if (updateChallengeError) {
      throw updateChallengeError;
    }

    // Ya no creamos notificaciones de retos completados
    // El usuario verá el badge en Retos y el banner cuando vaya a esa página

    return NextResponse.json({
      success: true,
      userChallenge: {
        id: userChallenge.id,
        userId: userChallenge.user_id,
        challengeId: userChallenge.challenge_id,
        status: 'finished',
        startedAt: userChallenge.started_at,
        finishedAt,
        sessionData: sessionData || userChallenge.session_data,
      },
      challenge: {
        id: challenge.id,
        type: challenge.type,
        title: challenge.title,
        description: challenge.description,
        reward: challenge.reward,
        durationMinutes: challenge.duration_minutes,
      },
    });
  } catch (error) {
    console.error('Error finishing challenge:', error);
    return NextResponse.json(
      { error: 'Error al finalizar el reto' },
      { status: 500 }
    );
  }
}
