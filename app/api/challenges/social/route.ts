import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { socialSessions, profiles, notifications } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

/**
 * GET /api/challenges/social
 * Get social challenges for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Get social sessions where user is inviter or invitee
    const sessions = await db
      .select()
      .from(socialSessions)
      .where(
        or(
          eq(socialSessions.inviterId, user.id),
          eq(socialSessions.inviteeId, user.id)
        )
      );

    return NextResponse.json({ sessions });
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
    const supabase = await createServerClient();
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

    // Check if invitee exists
    const [invitee] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, inviteeId))
      .limit(1);

    if (!invitee) {
      return NextResponse.json(
        { error: 'Usuario invitado no encontrado' },
        { status: 404 }
      );
    }

    // Create social session
    const [session] = await db
      .insert(socialSessions)
      .values({
        inviterId: user.id,
        inviteeId,
        challengeId,
        status: 'pending',
        createdAt: new Date(),
      })
      .returning();

    // Create notification for invitee
    await db.insert(notifications).values({
      userId: inviteeId,
      type: 'social',
      payload: {
        type: 'social_challenge_invite',
        inviterId: user.id,
        challengeId,
        sessionId: session.id,
      },
      seen: false,
      createdAt: new Date(),
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



