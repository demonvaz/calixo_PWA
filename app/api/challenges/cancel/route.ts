import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/challenges/cancel
 * Cancel a challenge that is in progress
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

    if (userChallenge.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Este reto ya no está en progreso' },
        { status: 400 }
      );
    }

    // Update user challenge to canceled with cancellation reason
    const updatedSessionData = {
      ...(userChallenge.session_data || {}),
      cancellationReason: 'Cancelado por el usuario',
      cancelledAt: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('user_challenges')
      .update({
        status: 'canceled',
        failed_at: new Date().toISOString(), // Using failed_at to track when it was canceled
        session_data: updatedSessionData,
      })
      .eq('id', userChallengeId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Reto cancelado exitosamente',
    });
  } catch (error) {
    console.error('Error canceling challenge:', error);
    return NextResponse.json(
      { error: 'Error al cancelar el reto' },
      { status: 500 }
    );
  }
}
