import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userChallenges, focusSessions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/challenges/fail
 * Mark a challenge as failed (e.g., due to interruption)
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
    const { userChallengeId, reason, sessionData } = body;

    if (!userChallengeId) {
      return NextResponse.json(
        { error: 'User Challenge ID es requerido' },
        { status: 400 }
      );
    }

    // Get the user challenge
    const [userChallenge] = await db
      .select()
      .from(userChallenges)
      .where(
        and(
          eq(userChallenges.id, userChallengeId),
          eq(userChallenges.userId, user.id)
        )
      )
      .limit(1);

    if (!userChallenge) {
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

    // Update user challenge to failed
    const updatedSessionData = {
      ...userChallenge.sessionData,
      ...sessionData,
      failureReason: reason,
    };

    await db
      .update(userChallenges)
      .set({
        status: 'failed',
        failedAt: new Date(),
        sessionData: updatedSessionData,
      })
      .where(eq(userChallenges.id, userChallengeId));

    // Create focus session record if it's a focus challenge
    if (sessionData) {
      await db.insert(focusSessions).values({
        userChallengeId: userChallenge.id,
        durationSeconds: sessionData.durationSeconds || 0,
        interruptions: sessionData.interruptions || 0,
        completedSuccessfully: false,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Reto marcado como fallido',
    });
  } catch (error) {
    console.error('Error failing challenge:', error);
    return NextResponse.json(
      { error: 'Error al marcar el reto como fallido' },
      { status: 500 }
    );
  }
}



