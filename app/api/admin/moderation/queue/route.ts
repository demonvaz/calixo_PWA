import { NextRequest, NextResponse } from 'next/server';
import { requireModerator } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/moderation/queue
 * Get pending reports with previews (moderator/admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const isModerator = await requireModerator();
    if (!isModerator) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const { data: reports, error } = await supabase
      .from('reports')
      .select('id, reporter_id, reported_user_id, feed_item_id, feed_comment_id, reason, description, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Get display_name for reporters
    const reporterIds = [...new Set((reports || []).map((r) => r.reporter_id).filter(Boolean))];
    const reporterNames: Record<string, string> = {};
    if (reporterIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', reporterIds);
      (users || []).forEach((u) => {
        reporterNames[u.id] = u.display_name || u.id;
      });
    }

    // Collect IDs for previews
    const feedItemIds = [...new Set((reports || []).map((r) => r.feed_item_id).filter(Boolean))] as number[];
    const reportedUserIds = [...new Set((reports || []).map((r) => r.reported_user_id).filter(Boolean))] as string[];
    const commentIds = [...new Set((reports || []).map((r) => (r as { feed_comment_id?: number }).feed_comment_id).filter(Boolean))] as number[];

    // Fetch feed items preview
    const feedPreviews: Record<number, { note: string | null; imageUrl: string | null; userName: string }> = {};
    if (feedItemIds.length > 0) {
      const { data: feedItems } = await supabase
        .from('feed_items')
        .select('id, note, image_url, user_id')
        .in('id', feedItemIds);
      const postUserIds = [...new Set((feedItems || []).map((f) => f.user_id))];
      const { data: postUsers } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', postUserIds);
      const postUserNames = Object.fromEntries((postUsers || []).map((u) => [u.id, u.display_name || u.id]));
      (feedItems || []).forEach((f) => {
        feedPreviews[f.id] = {
          note: f.note,
          imageUrl: f.image_url,
          userName: postUserNames[f.user_id] || f.user_id,
        };
      });
    }

    // Fetch reported users preview
    const userPreviews: Record<string, string> = {};
    if (reportedUserIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', reportedUserIds);
      (users || []).forEach((u) => {
        userPreviews[u.id] = u.display_name || u.id;
      });
    }

    // Fetch comments preview
    const commentPreviews: Record<number, { comment: string; userName: string }> = {};
    if (commentIds.length > 0) {
      const { data: comments } = await supabase
        .from('feed_comments')
        .select('id, comment, user_id')
        .in('id', commentIds);
      const commentUserIds = [...new Set((comments || []).map((c) => c.user_id))];
      const { data: commentUsers } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', commentUserIds);
      const commentUserNames = Object.fromEntries((commentUsers || []).map((u) => [u.id, u.display_name || u.id]));
      (comments || []).forEach((c) => {
        commentPreviews[c.id] = {
          comment: c.comment,
          userName: commentUserNames[c.user_id] || c.user_id,
        };
      });
    }

    const pendingReports = (reports || []).map((r) => {
      const report = r as { feed_comment_id?: number };
      const feedItemId = r.feed_item_id;
      const feedCommentId = report.feed_comment_id;
      const reportedUserId = r.reported_user_id;

      let reportType: 'post' | 'user' | 'comment' = 'post';
      if (feedCommentId) reportType = 'comment';
      else if (reportedUserId && !feedItemId) reportType = 'user';
      else if (feedItemId) reportType = 'post';

      return {
        id: r.id,
        reporterId: r.reporter_id,
        reportedUserId: reportedUserId,
        feedItemId: feedItemId,
        feedCommentId: feedCommentId ?? null,
        reason: r.reason,
        description: r.description,
        status: r.status,
        createdAt: r.created_at,
        reporterEmail: reporterNames[r.reporter_id] || r.reporter_id,
        reportType,
        preview: reportType === 'post' && feedItemId
          ? feedPreviews[feedItemId]
          : reportType === 'user' && reportedUserId
            ? { userName: userPreviews[reportedUserId] }
            : reportType === 'comment' && feedCommentId
              ? commentPreviews[feedCommentId]
              : null,
      };
    });

    return NextResponse.json(pendingReports);
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation queue' },
      { status: 500 }
    );
  }
}
