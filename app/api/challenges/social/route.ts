import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/challenges/social
 * Get social challenges for the authenticated user
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

    const adminSupabase = createServiceRoleClient();
    const { data: sessions, error } = await adminSupabase
      .from('social_sessions')
      .select('*')
      .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`);

    if (error) {
      throw error;
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('Error fetching social challenges:', error);
    return NextResponse.json(
      { error: 'Error al obtener retos sociales' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/challenges/social
 * Create a new social challenge invitation
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
    const { inviteeId, challengeId } = body;

    if (!inviteeId || !challengeId) {
      return NextResponse.json(
        { error: 'inviteeId y challengeId son requeridos' },
        { status: 400 }
      );
    }

    const adminSupabase = createServiceRoleClient();

    // Check if invitee exists in users table
    const { data: invitee, error: inviteeError } = await adminSupabase
      .from('users')
      .select('id')
      .eq('id', inviteeId)
      .single();

    if (inviteeError || !invitee) {
      return NextResponse.json(
        { error: 'Usuario invitado no encontrado' },
        { status: 404 }
      );
    }

    const { data: session, error } = await adminSupabase
      .from('social_sessions')
      .insert({
        inviter_id: user.id,
        invitee_id: inviteeId,
        challenge_id: challengeId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create notification for invitee
    await adminSupabase.from('notifications').insert({
      user_id: inviteeId,
      type: 'social',
      title: 'Invitación a reto social',
      message: 'Te han invitado a un reto social',
      payload: {
        type: 'social_challenge_invite',
        inviterId: user.id,
        challengeId,
        sessionId: session.id,
      },
      seen: false,
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error creating social challenge:', error);
    return NextResponse.json(
      { error: 'Error al crear reto social' },
      { status: 500 }
    );
  }
}
