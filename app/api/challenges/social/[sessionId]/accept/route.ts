import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { socialSessions, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/challenges/social/[sessionId]/accept
 * Accept a social challenge invitation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const sessionId = parseInt(params.sessionId);

    // Get the social session
    const [session] = await db
      .select()
      .from(socialSessions)
      .where(
        and(
          eq(socialSessions.id, sessionId),
          eq(socialSessions.inviteeId, user.id)
        )
      )
      .limit(1);

    if (!session) {
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

    // Accept the invitation
    await db
      .update(socialSessions)
      .set({
        status: 'in_progress',
        acceptedAt: new Date(),
      })
      .where(eq(socialSessions.id, sessionId));

    // Notify the inviter
    await db.insert(notifications).values({
      userId: session.inviterId,
      type: 'social',
      payload: {
        type: 'social_challenge_accepted',
        inviteeId: user.id,
        sessionId: session.id,
      },
      seen: false,
      createdAt: new Date(),
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



