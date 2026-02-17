import { NextRequest, NextResponse } from 'next/server';
import { requireModerator } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/moderation/queue
 * Get pending reports (moderator/admin only)
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
      .select('id, reporter_id, reported_user_id, feed_item_id, reason, description, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Get display_name for reporters from users table
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

    const pendingReports = (reports || []).map((r) => ({
      id: r.id,
      reporterId: r.reporter_id,
      reportedUserId: r.reported_user_id,
      feedItemId: r.feed_item_id,
      reason: r.reason,
      description: r.description,
      status: r.status,
      createdAt: r.created_at,
      reporterEmail: reporterNames[r.reporter_id] || r.reporter_id,
    }));

    return NextResponse.json(pendingReports);
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation queue' },
      { status: 500 }
    );
  }
}
