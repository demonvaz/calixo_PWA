import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMentionedUsernames } from '@/lib/utils/mentions';

/**
 * GET /api/feed/[id]/comments
 * Get comments for a feed post
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

    // Get comments
    const { data: comments, error: commentsError } = await supabase
      .from('feed_comments')
      .select('*')
      .eq('feed_item_id', feedItemId)
      .order('created_at', { ascending: false });

    if (commentsError) {
      throw commentsError;
    }

    // Get user info for each comment
    const userIds = [...new Set((comments || []).map((c: any) => c.user_id))];
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', userIds);

    const usersMap = new Map((users || []).map((u: any) => [u.id, u.display_name]));

    // Format comments
    const formattedComments = (comments || []).map((comment: any) => ({
      id: comment.id,
      comment: comment.comment,
      userId: comment.user_id,
      displayName: usersMap.get(comment.user_id) || 'Usuario',
      createdAt: comment.created_at,
    }));

    return NextResponse.json({
      comments: formattedComments,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Error al obtener comentarios' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feed/[id]/comments
 * Add a comment to a feed post
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

    const body = await request.json();
    const { comment } = body;

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'El comentario no puede estar vacío' },
        { status: 400 }
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

    // Insert comment
    const { data: newComment, error: insertError } = await supabase
      .from('feed_comments')
      .insert({
        feed_item_id: feedItemId,
        user_id: user.id,
        comment: comment.trim(),
      })
      .select('*')
      .single();

    if (insertError) {
      throw insertError;
    }

    // Get user display name
    const { data: userData } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .single();

    // Update comments count
    const newCommentsCount = (feedItem.comments_count || 0) + 1;
    const { error: updateError } = await supabase
      .from('feed_items')
      .update({ comments_count: newCommentsCount })
      .eq('id', feedItemId);

    if (updateError) {
      console.error('Error updating comments count:', updateError);
      // Don't fail the request if count update fails
    }

    // Detect mentions in comment
    const mentionedUsernames = getMentionedUsernames(comment);
    const mentionedUserIds: string[] = [];

    if (mentionedUsernames.length > 0) {
      // Find users by display_name (case-insensitive)
      // Note: In a real app, you might want to use a username field instead
      const { data: mentionedUsers } = await supabase
        .from('users')
        .select('id, display_name')
        .in('display_name', mentionedUsernames.map(u => u.charAt(0).toUpperCase() + u.slice(1)));

      if (mentionedUsers) {
        mentionedUserIds.push(...mentionedUsers.map(u => u.id));
      }
    }

    // Create notification for post owner (if not own post and not mentioned)
    if (feedItem.user_id !== user.id && !mentionedUserIds.includes(feedItem.user_id)) {
      await supabase.from('notifications').insert({
        user_id: feedItem.user_id,
        type: 'social',
        title: 'Nuevo comentario',
        message: `${userData?.display_name || 'Alguien'} comentó en tu publicación`,
        payload: {
          type: 'feed_comment',
          feedItemId: feedItem.id,
          commenterId: user.id,
          comment: comment.substring(0, 100), // Preview
        },
        seen: false,
      });
    }

    // Create notifications for mentioned users
    for (const mentionedUserId of mentionedUserIds) {
      // Don't notify if it's the commenter or post owner (already notified above)
      if (mentionedUserId !== user.id && mentionedUserId !== feedItem.user_id) {
        await supabase.from('notifications').insert({
          user_id: mentionedUserId,
          type: 'social',
          title: 'Te mencionaron',
          message: `${userData?.display_name || 'Alguien'} te mencionó en un comentario`,
          payload: {
            type: 'feed_mention',
            feedItemId: feedItem.id,
            commentId: newComment.id,
            commenterId: user.id,
            comment: comment.substring(0, 100), // Preview
          },
          seen: false,
        });
      }
    }

    // Format the new comment
    const formattedComment = {
      id: newComment.id,
      comment: newComment.comment,
      userId: newComment.user_id,
      displayName: userData?.display_name || 'Usuario',
      createdAt: newComment.created_at,
    };

    return NextResponse.json({
      success: true,
      commentsCount: newCommentsCount,
      comment: formattedComment,
    });
  } catch (error) {
    console.error('Error commenting on post:', error);
    return NextResponse.json(
      { error: 'Error al comentar' },
      { status: 500 }
    );
  }
}






