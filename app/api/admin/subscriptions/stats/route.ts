import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/subscriptions/stats
 * Get subscription statistics (admin only)
 */
export async function GET() {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();

    const [
      totalActiveRes,
      totalCanceledRes,
      monthlyRes,
      annualRes,
      activeSubsRes,
    ] = await Promise.all([
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'canceled'),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('plan', 'monthly'),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('plan', 'annual'),
      supabase.from('subscriptions').select('plan').eq('status', 'active'),
    ]);

    const totalActive = totalActiveRes.count ?? 0;
    const totalCanceled = totalCanceledRes.count ?? 0;
    const monthlySubs = monthlyRes.count ?? 0;
    const annualSubs = annualRes.count ?? 0;

    let mrr = 0;
    (activeSubsRes.data || []).forEach((s) => {
      if (s.plan === 'monthly') mrr += 4.99;
      else if (s.plan === 'annual') mrr += 49.99 / 12;
    });

    const stats = {
      totalActive,
      totalCanceled,
      monthlySubs,
      annualSubs,
      mrr,
      arr: mrr * 12,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription stats' },
      { status: 500 }
    );
  }
}
