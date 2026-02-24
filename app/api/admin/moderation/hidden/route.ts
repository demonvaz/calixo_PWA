import { NextRequest, NextResponse } from 'next/server';
import { requireModerator } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/moderation/hidden
 * Get hidden feed items (posts ocultos por moderación) - moderator/admin only
 */
export async function GET(request: NextRequest) {
  try {
    const isModerator = await requireModerator();
    if (!isModerator) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const { data: feedItems, error } = await supabase
      .from('feed_items')
      .select('id, user_id, note, image_url, created_at')
      .eq('is_hidden', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Get user display names
    const userIds = [...new Set((feedItems || []).map((f) => f.user_id))];
    const userNames: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', userIds);
      (users || []).forEach((u) => {
        userNames[u.id] = u.display_name || u.id;
      });
    }

    const hiddenPosts = (feedItems || []).map((f) => ({
      id: f.id,
      userId: f.user_id,
      userName: userNames[f.user_id] || f.user_id,
      note: f.note,
      imageUrl: f.image_url,
      createdAt: f.created_at,
    }));

    return NextResponse.json(hiddenPosts);
  } catch (error) {
    console.error('Error fetching hidden posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hidden posts' },
      { status: 500 }
    );
  }
}
