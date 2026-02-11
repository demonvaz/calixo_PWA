import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateEnergyOnChallengeComplete } from '@/lib/avatar-energy';

/**
 * POST /api/challenges/claim
 * Reclama un reto finalizado y lo completa automáticamente otorgando las monedas base
 * El reto se marca como 'completed' y se otorgan las monedas base inmediatamente
 * Si el usuario comparte después, puede obtener 2 monedas extra mediante /api/challenges/complete
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
    const { userChallengeId } = body;

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

    if (userChallenge.status !== 'finished') {
      return NextResponse.json(
        { error: 'Este reto no está finalizado. Solo puedes reclamar retos que hayan terminado.' },
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

    // Completar el reto automáticamente y otorgar monedas base
    const claimedAt = new Date().toISOString();
    const completedAt = new Date().toISOString();
    
    // Update user challenge to completed (con recompensa base)
    const { error: updateChallengeError } = await supabase
      .from('user_challenges')
      .update({
        status: 'completed',
        claimed_at: claimedAt,
        completed_at: completedAt,
        shared: false, // Aún no se ha compartido
      })
      .eq('id', userChallengeId);

    if (updateChallengeError) {
      throw updateChallengeError;
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Para retos focus: 1 moneda por hora (calculado desde session_data)
    let baseReward = challenge.reward;
    if (challenge.type === 'focus' && userChallenge.session_data) {
      const sessionData = userChallenge.session_data as { durationMinutes?: number };
      const durationMinutes = sessionData.durationMinutes || 60;
      baseReward = Math.floor(durationMinutes / 60); // 1 moneda por hora
    }
    const newCoins = userData.coins + baseReward;
    const newStreak = userData.streak + 1;
    const newEnergy = updateEnergyOnChallengeComplete(
      userData.avatar_energy,
      challenge.type as 'daily' | 'focus' | 'social'
    );

    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        coins: newCoins,
        streak: newStreak,
        avatar_energy: newEnergy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateUserError) {
      throw updateUserError;
    }

    // Create transaction record for base reward
    await supabase.from('transactions').insert({
      user_id: user.id,
      amount: baseReward,
      type: 'earn',
      description: `Reto completado: ${challenge.title}`,
      challenge_id: challenge.id,
    });

    // Create focus session record if it's a focus challenge
    if (challenge.type === 'focus' && userChallenge.session_data) {
      const sessionData = userChallenge.session_data;
      await supabase.from('focus_sessions').insert({
        user_challenge_id: userChallenge.id,
        duration_seconds: sessionData.durationSeconds || 0,
        interruptions: sessionData.interruptions || 0,
        completed_successfully: true,
      });
    }

    return NextResponse.json({
      success: true,
      userChallenge: {
        id: userChallenge.id,
        userId: userChallenge.user_id,
        challengeId: userChallenge.challenge_id,
        status: 'completed',
        startedAt: userChallenge.started_at,
        finishedAt: userChallenge.finished_at,
        claimedAt,
        completedAt,
        sessionData: userChallenge.session_data,
      },
      challenge: {
        id: challenge.id,
        type: challenge.type,
        title: challenge.title,
        description: challenge.description,
        reward: challenge.reward,
        durationMinutes: challenge.duration_minutes,
      },
      coinsEarned: baseReward,
      baseReward: baseReward,
      shareBonus: 0,
      shared: false,
      newCoins,
      newStreak,
      newEnergy,
    });
  } catch (error) {
    console.error('Error claiming challenge:', error);
    return NextResponse.json(
      { error: 'Error al reclamar el reto' },
      { status: 500 }
    );
  }
}
