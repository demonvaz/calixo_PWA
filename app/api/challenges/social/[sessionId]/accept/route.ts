import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * POST /api/challenges/social/[sessionId]/accept
 * Accept a social challenge invitation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { sessionId: sessionIdParam } = await params;
    const sessionId = parseInt(sessionIdParam);

    const adminSupabase = createServiceRoleClient();
    const { data: session, error: fetchError } = await adminSupabase
      .from('social_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('invitee_id', user.id)
      .single();

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 }
      );
    }

    if (session.status !== 'pending') {
      return NextResponse.json(
        { error: 'Esta invitación ya fue respondida' },
        { status: 400 }
      );
    }

    await adminSupabase
      .from('social_sessions')
      .update({
        status: 'in_progress',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    // Notify the inviter
    await adminSupabase.from('notifications').insert({
      user_id: session.inviter_id,
      type: 'social',
      title: 'Reto aceptado',
      message: 'Tu invitación a reto social fue aceptada',
      payload: {
        type: 'social_challenge_accepted',
        inviteeId: user.id,
        sessionId: session.id,
      },
      seen: false,
    });

    return NextResponse.json({
      success: true,
      message: 'Invitación aceptada',
    });
  } catch (error) {
    console.error('Error accepting social challenge:', error);
    return NextResponse.json(
      { error: 'Error al aceptar la invitación' },
      { status: 500 }
    );
  }
}
