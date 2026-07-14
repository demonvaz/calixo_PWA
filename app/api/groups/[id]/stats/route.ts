import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/groups/[id]/stats
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id: groupId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const admin = createServiceRoleClient();
    const { data: membership } = await admin
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    }

    const { data: challenges } = await admin
      .from('group_challenges')
      .select('id, duration_minutes, status, total_pot, created_at, organizer_id')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    const completed = (challenges || []).filter((c) => c.status === 'distributed');
    const active = (challenges || []).find((c) =>
      ['betting', 'in_progress', 'finished'].includes(c.status)
    );

    const { data: members } = await admin
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    const memberStats: Record<string, { wins: number; losses: number; totalEarned: number }> = {};

    for (const m of members || []) {
      memberStats[m.user_id] = { wins: 0, losses: 0, totalEarned: 0 };
    }

    const challengeIds = (challenges || []).map((c) => c.id);
    if (challengeIds.length > 0) {
      const { data: participants } = await admin
        .from('group_challenge_participants')
        .select('user_id, status, group_challenge_id')
        .in('group_challenge_id', challengeIds);

      for (const p of participants || []) {
        if (!memberStats[p.user_id]) continue;
        if (p.status === 'success') memberStats[p.user_id].wins++;
        if (p.status === 'failed') memberStats[p.user_id].losses++;
      }

      const { data: earnings } = await admin
        .from('transactions')
        .select('user_id, amount')
        .eq('group_id', groupId)
        .eq('type', 'earn');

      for (const t of earnings || []) {
        if (memberStats[t.user_id]) {
          memberStats[t.user_id].totalEarned += t.amount;
        }
      }
    }

    const memberIds = Object.keys(memberStats);
    const { data: users } = await admin
      .from('users')
      .select('id, display_name')
      .in('id', memberIds);

    const userMap = Object.fromEntries((users || []).map((u) => [u.id, u.display_name]));

    const ranking = memberIds
      .map((id) => ({
        userId: id,
        displayName: userMap[id] || 'Usuario',
        ...memberStats[id],
        successRate:
          memberStats[id].wins + memberStats[id].losses > 0
            ? Math.round(
                (memberStats[id].wins / (memberStats[id].wins + memberStats[id].losses)) * 100
              )
            : 0,
      }))
      .sort((a, b) => b.wins - a.wins);

    return NextResponse.json({
      stats: {
        totalChallenges: (challenges || []).length,
        completedChallenges: completed.length,
        totalCoinsDistributed: completed.reduce((s, c) => s + (c.total_pot || 0), 0),
        activeChallenge: active || null,
        ranking,
        recentChallenges: (challenges || []).slice(0, 10),
      },
    });
  } catch (error) {
    console.error('Error fetching group stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
