import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createGroupChallengeSchema } from '@/lib/validations/group-challenges';
import { getWeekKey, calculateBaseReward } from '@/lib/group-challenges/week-limit';
import { createNotification } from '@/lib/group-challenges/distribute-prizes';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/groups/[id]/challenges
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
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
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    const active = (challenges || []).find((c) =>
      ['betting', 'in_progress', 'finished'].includes(c.status)
    );

    let activeWithParticipants = null;
    if (active) {
      const { data: participants } = await admin
        .from('group_challenge_participants')
        .select('user_id, bet_amount, status, failed_at')
        .eq('group_challenge_id', active.id);

      const userIds = (participants || []).map((p) => p.user_id);
      const { data: users } = await admin
        .from('users')
        .select('id, display_name')
        .in('id', userIds);

      const userMap = Object.fromEntries((users || []).map((u) => [u.id, u.display_name]));

      activeWithParticipants = {
        ...active,
        participants: (participants || []).map((p) => ({
          userId: p.user_id,
          displayName: userMap[p.user_id],
          betAmount: p.bet_amount,
          status: p.status,
          failedAt: p.failed_at,
        })),
      };
    }

    return NextResponse.json({
      challenges: challenges || [],
      activeChallenge: activeWithParticipants,
    });
  } catch (error) {
    console.error('Error fetching group challenges:', error);
    return NextResponse.json({ error: 'Error al obtener retos' }, { status: 500 });
  }
}

/**
 * POST /api/groups/[id]/challenges
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createGroupChallengeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const admin = createServiceRoleClient();

    const { data: membership } = await admin
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    }

    const { data: organizer } = await admin
      .from('users')
      .select('is_premium')
      .eq('id', user.id)
      .single();

    const weekKey = getWeekKey();
    const isPremium = organizer?.is_premium || false;

    const { count: weekCount } = await admin
      .from('group_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('week_key', weekKey)
      .eq('is_premium_override', false)
      .not('status', 'eq', 'canceled');

    if (!isPremium && (weekCount || 0) >= 1) {
      return NextResponse.json(
        { error: 'Ya se ha creado un reto grupal esta semana. Un miembro premium puede crear más.' },
        { status: 403 }
      );
    }

    const isPremiumOverride = isPremium && (weekCount || 0) >= 1;

    const { data: activeChallenge } = await admin
      .from('group_challenges')
      .select('id')
      .eq('group_id', groupId)
      .in('status', ['betting', 'in_progress', 'finished'])
      .single();

    if (activeChallenge) {
      return NextResponse.json({ error: 'Ya hay un reto activo en este grupo' }, { status: 400 });
    }

    const baseReward = calculateBaseReward(parsed.data.durationMinutes);

    const { data: challenge, error } = await admin
      .from('group_challenges')
      .insert({
        group_id: groupId,
        organizer_id: user.id,
        duration_minutes: parsed.data.durationMinutes,
        status: 'betting',
        week_key: weekKey,
        base_reward: baseReward,
        total_pot: baseReward,
        scheduled_start: parsed.data.scheduledStart || null,
        is_premium_override: isPremiumOverride,
      })
      .select()
      .single();

    if (error || !challenge) throw error;

    const { data: members } = await admin
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    for (const m of members || []) {
      await admin.from('group_challenge_participants').upsert({
        group_challenge_id: challenge.id,
        user_id: m.user_id,
        bet_amount: 0,
        status: 'invited',
      });

      if (m.user_id !== user.id) {
        await createNotification(
          m.user_id,
          'challenge',
          'Nuevo reto grupal',
          `Reto de ${parsed.data.durationMinutes} min en tu grupo`,
          { type: 'group_challenge_created', groupId, challengeId: challenge.id }
        );
      }
    }

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('Error creating group challenge:', error);
    return NextResponse.json({ error: 'Error al crear reto grupal' }, { status: 500 });
  }
}
