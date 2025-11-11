import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { feedItems, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/feed/[id]/comments
 * Add a comment to a feed post
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

    const body = await request.json();
    const { comment } = body;

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'El comentario no puede estar vacío' },
        { status: 400 }
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

    // For simplicity, we just increment comments count
    // In a real app, you'd have a separate comments table
    const newCommentsCount = feedItem.commentsCount + 1;

    await db
      .update(feedItems)
      .set({ commentsCount: newCommentsCount })
      .where(eq(feedItems.id, feedItemId));

    // Create notification for post owner (if not own post)
    if (feedItem.userId !== user.id) {
      await db.insert(notifications).values({
        userId: feedItem.userId,
        type: 'social',
        payload: {
          type: 'feed_comment',
          feedItemId: feedItem.id,
          commenterId: user.id,
          comment: comment.substring(0, 100), // Preview
        },
        seen: false,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      commentsCount: newCommentsCount,
    });
  } catch (error) {
    console.error('Error commenting on post:', error);
    return NextResponse.json(
      { error: 'Error al comentar' },
      { status: 500 }
    );
  }
}



