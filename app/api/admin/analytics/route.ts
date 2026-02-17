import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/analytics
 * Get analytics data (admin only)
 */
export async function GET() {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString();
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthAgoStr = monthAgo.toISOString();

    // DAU, WAU, MAU - users with updated_at in range
    const [dauRes, wauRes, mauRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('updated_at', today),
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('updated_at', weekAgoStr),
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('updated_at', monthAgoStr),
    ]);

    // Challenges completed by status
    const { data: challengesByType } = await supabase
      .from('user_challenges')
      .select('status')
      .eq('status', 'completed');
    const completedCount = challengesByType?.length || 0;

    // Total coins earned vs spent
    const [earnedRes, spentRes] = await Promise.all([
      supabase.from('transactions').select('amount').eq('type', 'earn'),
      supabase.from('transactions').select('amount').eq('type', 'spend'),
    ]);
    const coinsEarned = (earnedRes.data || []).reduce((sum, t) => sum + (t.amount || 0), 0);
    const coinsSpent = (spentRes.data || []).reduce((sum, t) => sum + (t.amount || 0), 0);

    // Most purchased items
    const { data: spendTransactions } = await supabase
      .from('transactions')
      .select('item_id')
      .eq('type', 'spend');
    const itemCounts: Record<number, number> = {};
    (spendTransactions || []).forEach((t) => {
      if (t.item_id) {
        itemCounts[t.item_id] = (itemCounts[t.item_id] || 0) + 1;
      }
    });
    const topItems = Object.entries(itemCounts)
      .map(([itemId, count]) => ({ itemId: parseInt(itemId), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Most liked posts
    const { data: topPosts } = await supabase
      .from('feed_items')
      .select('id, likes_count')
      .order('likes_count', { ascending: false })
      .limit(10);

    const analytics = {
      users: {
        dau: dauRes.count ?? 0,
        wau: wauRes.count ?? 0,
        mau: mauRes.count ?? 0,
      },
      challenges: {
        completedByType: [{ status: 'completed', count: completedCount }],
      },
      coins: {
        earned: coinsEarned,
        spent: coinsSpent,
        net: coinsEarned - coinsSpent,
      },
      topItems,
      topPosts: (topPosts || []).map((p) => ({ id: p.id, likesCount: p.likes_count })),
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
