import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { challenges, userChallenges, profiles, config } from '@/db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';

/**
 * GET /api/challenges
 * Retrieve available challenges for the authenticated user
 * Filters by type: daily, focus, social
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'daily' | 'focus' | 'social' | null;

    // Get user profile to check if premium
    const [userProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    if (!userProfile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      );
    }

    // Get configuration for daily challenge limits
    const [dailyFreeLimit] = await db
      .select()
      .from(config)
      .where(eq(config.key, 'daily_free_challenges'))
      .limit(1);

    const [dailyPremiumLimit] = await db
      .select()
      .from(config)
      .where(eq(config.key, 'daily_premium_challenges'))
      .limit(1);

    const maxDailyChallenges = userProfile.isPremium
      ? (dailyPremiumLimit?.value as number) || 3
      : (dailyFreeLimit?.value as number) || 1;

    // Get today's challenges count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysChallenges = await db
      .select()
      .from(userChallenges)
      .where(
        and(
          eq(userChallenges.userId, user.id),
          gte(userChallenges.createdAt, today),
          lt(userChallenges.createdAt, tomorrow)
        )
      );

    // Build query conditions
    let whereConditions = [eq(challenges.isActive, true)];
    if (type) {
      whereConditions.push(eq(challenges.type, type));
    }

    // Get available challenges
    const availableChallenges = await db
      .select()
      .from(challenges)
      .where(and(...whereConditions));

    // Add metadata to challenges
    const challengesWithMetadata = availableChallenges.map((challenge) => {
      let canStart = true;
      let reason = '';

      if (challenge.type === 'daily') {
        const dailyChallengesCount = todaysChallenges.filter((uc) => {
          const ch = availableChallenges.find((c) => c.id === uc.challengeId);
          return ch?.type === 'daily';
        }).length;

        if (dailyChallengesCount >= maxDailyChallenges) {
          canStart = false;
          reason = userProfile.isPremium
            ? 'Has alcanzado el límite de retos diarios (3)'
            : 'Has alcanzado el límite de retos diarios gratuitos (1). Actualiza a Premium para más retos.';
        }
      }

      return {
        ...challenge,
        canStart,
        reason,
      };
    });

    return NextResponse.json({
      challenges: challengesWithMetadata,
      userProfile: {
        isPremium: userProfile.isPremium,
        maxDailyChallenges,
        todaysChallengesCount: todaysChallenges.length,
      },
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Error al obtener los retos' },
      { status: 500 }
    );
  }
}



