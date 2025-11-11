import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { feedItems, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/feed/[id]/like
 * Like/unlike a feed post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const feedItemId = parseInt(params.id);

    // Get the feed item
    const [feedItem] = await db
      .select()
      .from(feedItems)
      .where(eq(feedItems.id, feedItemId))
      .limit(1);

    if (!feedItem) {
      return NextResponse.json(
        { error: 'Post no encontrado' },
        { status: 404 }
      );
    }

    // For simplicity, we increment/decrement likes count
    // In a real app, you'd have a separate likes table
    const newLikesCount = feedItem.likesCount + 1;

    await db
      .update(feedItems)
      .set({ likesCount: newLikesCount })
      .where(eq(feedItems.id, feedItemId));

    // Create notification for post owner (if not own post)
    if (feedItem.userId !== user.id) {
      await db.insert(notifications).values({
        userId: feedItem.userId,
        type: 'social',
        payload: {
          type: 'feed_like',
          feedItemId: feedItem.id,
          likerId: user.id,
        },
        seen: false,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      likesCount: newLikesCount,
    });
  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json(
      { error: 'Error al dar like' },
      { status: 500 }
    );
  }
}



