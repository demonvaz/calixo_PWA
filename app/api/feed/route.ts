import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { feedItems, profiles, userChallenges, challenges, followers } from '@/db/schema';
import { eq, desc, and, inArray, or } from 'drizzle-orm';

/**
 * GET /api/feed
 * Get feed items (global or from followed users)
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
    const type = searchParams.get('type') || 'following'; // 'following' or 'global'
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let feedQuery;

    if (type === 'following') {
      // Get users the current user follows
      const following = await db
        .select({ followingId: followers.followingId })
        .from(followers)
        .where(eq(followers.followerId, user.id));

      const followingIds = following.map(f => f.followingId);
      
      // Include own posts + followed users posts
      const userIds = [user.id, ...followingIds];

      if (userIds.length === 0) {
        return NextResponse.json({
          feedItems: [],
          hasMore: false,
          total: 0,
        });
      }

      feedQuery = db
        .select({
          feedItem: feedItems,
          profile: profiles,
          userChallenge: userChallenges,
          challenge: challenges,
        })
        .from(feedItems)
        .leftJoin(profiles, eq(feedItems.userId, profiles.userId))
        .leftJoin(userChallenges, eq(feedItems.userChallengeId, userChallenges.id))
        .leftJoin(challenges, eq(userChallenges.challengeId, challenges.id))
        .where(inArray(feedItems.userId, userIds))
        .orderBy(desc(feedItems.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      // Global feed - all public posts
      feedQuery = db
        .select({
          feedItem: feedItems,
          profile: profiles,
          userChallenge: userChallenges,
          challenge: challenges,
        })
        .from(feedItems)
        .leftJoin(profiles, eq(feedItems.userId, profiles.userId))
        .leftJoin(userChallenges, eq(feedItems.userChallengeId, userChallenges.id))
        .leftJoin(challenges, eq(userChallenges.challengeId, challenges.id))
        .where(eq(profiles.isPrivate, false))
        .orderBy(desc(feedItems.createdAt))
        .limit(limit)
        .offset(offset);
    }

    const results = await feedQuery;

    const hasMore = results.length === limit;

    return NextResponse.json({
      feedItems: results,
      hasMore,
      total: results.length,
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json(
      { error: 'Error al obtener el feed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feed
 * Create a new feed post (already handled in challenges/complete, this is for manual posts)
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
    const { userChallengeId, imageUrl, note } = body;

    if (!userChallengeId || !imageUrl || !note) {
      return NextResponse.json(
        { error: 'userChallengeId, imageUrl y note son requeridos' },
        { status: 400 }
      );
    }

    // Verify the user challenge belongs to this user
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
        { error: 'Reto no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Create feed item
    const [feedItem] = await db
      .insert(feedItems)
      .values({
        userId: user.id,
        userChallengeId,
        imageUrl,
        note,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      feedItem,
    });
  } catch (error) {
    console.error('Error creating feed post:', error);
    return NextResponse.json(
      { error: 'Error al crear el post' },
      { status: 500 }
    );
  }
}



