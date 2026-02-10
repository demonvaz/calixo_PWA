import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/feed/[id]/like
 * Check if current user has liked the post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const feedItemId = parseInt(id);

    // Check if user has liked this post
    const { data: like, error: likeError } = await supabase
      .from('feed_likes')
      .select('id')
      .eq('feed_item_id', feedItemId)
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      isLiked: !!like && !likeError,
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Error al verificar like' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feed/[id]/like
 * Toggle like/unlike a feed post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const feedItemId = parseInt(id);

    // Get the feed item
    const { data: feedItem, error: feedError } = await supabase
      .from('feed_items')
      .select('*')
      .eq('id', feedItemId)
      .single();

    if (feedError || !feedItem) {
      return NextResponse.json(
        { error: 'Post no encontrado' },
        { status: 404 }
      );
    }

    // Check if user already liked this post
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('feed_likes')
      .select('id')
      .eq('feed_item_id', feedItemId)
      .eq('user_id', user.id)
      .single();

    const isLiked = !!existingLike && !likeCheckError;
    let newLikesCount = feedItem.likes_count || 0;

    if (isLiked) {
      // Unlike: Remove like record
      const { error: deleteError } = await supabase
        .from('feed_likes')
        .delete()
        .eq('feed_item_id', feedItemId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      newLikesCount = Math.max(0, newLikesCount - 1);
    } else {
      // Like: Add like record
      const { error: insertError } = await supabase
        .from('feed_likes')
        .insert({
          feed_item_id: feedItemId,
          user_id: user.id,
        });

      if (insertError) {
        // If error is duplicate key, it's already liked
        if (insertError.code !== '23505') {
          throw insertError;
        }
      } else {
        newLikesCount = newLikesCount + 1;

        // Create notification for post owner (if not own post)
        if (feedItem.user_id !== user.id) {
          // Get liker display name
          const { data: likerData } = await supabase
            .from('users')
            .select('display_name')
            .eq('id', user.id)
            .single();

          await supabase.from('notifications').insert({
            user_id: feedItem.user_id,
            type: 'social',
            title: 'Nuevo like',
            message: `${likerData?.display_name || 'Alguien'} le dio like a tu publicación`,
            payload: {
              type: 'feed_like',
              feedItemId: feedItem.id,
              likerId: user.id,
            },
            seen: false,
          });
        }
      }
    }

    // Update likes count in feed_items
    const { error: updateError } = await supabase
      .from('feed_items')
      .update({ likes_count: newLikesCount })
      .eq('id', feedItemId);

    if (updateError) {
      console.error('Error updating likes count:', updateError);
      // Don't fail the request if count update fails
    }

    return NextResponse.json({
      success: true,
      isLiked: !isLiked,
      likesCount: newLikesCount,
    });
  } catch (error: any) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Error al dar like' },
      { status: 500 }
    );
  }
}
