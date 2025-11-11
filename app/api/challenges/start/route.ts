import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { challenges, userChallenges, profiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/challenges/start
 * Start a new challenge for the authenticated user
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
    const { challengeId, customDuration } = body;

    if (!challengeId) {
      return NextResponse.json(
        { error: 'Challenge ID es requerido' },
        { status: 400 }
      );
    }

    // Verify challenge exists and is active
    const [challenge] = await db
      .select()
      .from(challenges)
      .where(and(eq(challenges.id, challengeId), eq(challenges.isActive, true)))
      .limit(1);

    if (!challenge) {
      return NextResponse.json(
        { error: 'Reto no encontrado o inactivo' },
        { status: 404 }
      );
    }

    // Check if user already has an active challenge of this type
    const existingChallenge = await db
      .select()
      .from(userChallenges)
      .where(
        and(
          eq(userChallenges.userId, user.id),
          eq(userChallenges.status, 'in_progress')
        )
      );

    if (existingChallenge.length > 0) {
      return NextResponse.json(
        { error: 'Ya tienes un reto en progreso. Complétalo primero.' },
        { status: 400 }
      );
    }

    // For focus challenges, validate custom duration
    let duration = challenge.durationMinutes;
    if (challenge.type === 'focus' && customDuration) {
      if (customDuration > 23 * 60) {
        return NextResponse.json(
          { error: 'La duración máxima es de 23 horas' },
          { status: 400 }
        );
      }
      duration = customDuration;
    }

    // Create new user challenge
    const [newUserChallenge] = await db
      .insert(userChallenges)
      .values({
        userId: user.id,
        challengeId: challenge.id,
        status: 'in_progress',
        startedAt: new Date(),
        sessionData: {
          durationMinutes: duration,
          startTime: new Date().toISOString(),
          interruptions: 0,
        },
      })
      .returning();

    return NextResponse.json({
      success: true,
      userChallenge: newUserChallenge,
      challenge,
    });
  } catch (error) {
    console.error('Error starting challenge:', error);
    return NextResponse.json(
      { error: 'Error al iniciar el reto' },
      { status: 500 }
    );
  }
}



