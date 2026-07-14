import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { betSchema, reportFailureSchema, finishChallengeSchema } from '@/lib/validations/group-challenges';
import { distributeGroupChallengePrizes, createNotification } from '@/lib/group-challenges/distribute-prizes';

interface RouteParams {
  params: Promise<{ id: string; cid: string }>;
}

async function getChallenge(groupId: string, challengeId: string) {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from('group_challenges')
    .select('*')
    .eq('id', challengeId)
    .eq('group_id', groupId)
    .single();
  return data;
}

/**
 * POST /api/groups/[id]/challenges/[cid]/bet
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId, cid: challengeId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const challenge = await getChallenge(groupId, challengeId);
    if (!challenge || challenge.status !== 'betting') {
      return NextResponse.json({ error: 'No se pueden hacer apuestas ahora' }, { status: 400 });
    }

    const body = await request.json();
    const action = body.action as string;

    const admin = createServiceRoleClient();

    if (action === 'bet') {
      const parsed = betSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      const { data: userData } = await admin.from('users').select('coins').eq('id', user.id).single();
      if (!userData || userData.coins < parsed.data.amount) {
        return NextResponse.json({ error: 'Monedas insuficientes' }, { status: 400 });
      }

      const { data: existing } = await admin
        .from('group_challenge_participants')
        .select('bet_amount')
        .eq('group_challenge_id', challengeId)
        .eq('user_id', user.id)
        .single();

      const previousBet = existing?.bet_amount || 0;

      await admin.from('users').update({ coins: userData.coins - parsed.data.amount }).eq('id', user.id);
      await admin.from('transactions').insert({
        user_id: user.id,
        amount: parsed.data.amount,
        type: 'spend',
        description: 'Apuesta reto grupal',
        group_challenge_id: challengeId,
        group_id: groupId,
      });

      await admin.from('group_challenge_participants').upsert({
        group_challenge_id: challengeId,
        user_id: user.id,
        bet_amount: previousBet + parsed.data.amount,
        status: 'bet_placed',
      });

      const newPot = (challenge.total_pot || 0) + parsed.data.amount;
      await admin.from('group_challenges').update({ total_pot: newPot }).eq('id', challengeId);

      return NextResponse.json({ success: true, totalPot: newPot });
    }

    if (action === 'start') {
      if (challenge.organizer_id !== user.id) {
        return NextResponse.json({ error: 'Solo el organizador puede iniciar' }, { status: 403 });
      }

      await admin
        .from('group_challenges')
        .update({ status: 'in_progress', started_at: new Date().toISOString() })
        .eq('id', challengeId);

      const { data: participants } = await admin
        .from('group_challenge_participants')
        .select('user_id')
        .eq('group_challenge_id', challengeId);

      for (const p of participants || []) {
        await admin
          .from('group_challenge_participants')
          .update({ status: 'active' })
          .eq('group_challenge_id', challengeId)
          .eq('user_id', p.user_id)
          .in('status', ['invited', 'bet_placed']);

        await createNotification(
          p.user_id,
          'challenge',
          'Reto grupal iniciado',
          '¡El reto ha comenzado! No cojas el móvil.',
          { type: 'group_challenge_starting', groupId, challengeId }
        );
      }

      return NextResponse.json({ success: true, status: 'in_progress' });
    }

    if (action === 'report-failure') {
      if (challenge.status !== 'in_progress') {
        return NextResponse.json({ error: 'El reto no está en curso' }, { status: 400 });
      }

      const parsed = reportFailureSchema.safeParse(body);
      const reason = parsed.success ? parsed.data.reason : 'visibility';

      const { data: participant } = await admin
        .from('group_challenge_participants')
        .select('status, session_data')
        .eq('group_challenge_id', challengeId)
        .eq('user_id', user.id)
        .single();

      if (!participant || participant.status === 'failed') {
        return NextResponse.json({ success: true, alreadyFailed: true });
      }

      const sessionData = {
        ...(participant.session_data as Record<string, unknown> || {}),
        failures: [
          ...((participant.session_data as Record<string, unknown>)?.failures as unknown[] || []),
          { reason, at: new Date().toISOString() },
        ],
      };

      await admin
        .from('group_challenge_participants')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          session_data: sessionData,
        })
        .eq('group_challenge_id', challengeId)
        .eq('user_id', user.id);

      return NextResponse.json({ success: true, status: 'failed' });
    }

    if (action === 'finish') {
      if (challenge.status !== 'in_progress') {
        return NextResponse.json({ error: 'El reto no está en curso' }, { status: 400 });
      }

      const parsed = finishChallengeSchema.safeParse(body);
      const sessionData = parsed.success ? parsed.data.sessionData : {};

      const { data: participant } = await admin
        .from('group_challenge_participants')
        .select('status')
        .eq('group_challenge_id', challengeId)
        .eq('user_id', user.id)
        .single();

      if (participant && participant.status === 'active') {
        await admin
          .from('group_challenge_participants')
          .update({
            status: 'success',
            session_data: sessionData,
          })
          .eq('group_challenge_id', challengeId)
          .eq('user_id', user.id);
      }

      const { data: stillActive } = await admin
        .from('group_challenge_participants')
        .select('user_id')
        .eq('group_challenge_id', challengeId)
        .eq('status', 'active');

      if (!stillActive || stillActive.length === 0) {
        await admin
          .from('group_challenges')
          .update({ status: 'finished', ended_at: new Date().toISOString() })
          .eq('id', challengeId);

        const result = await distributeGroupChallengePrizes(
          challengeId,
          groupId,
          challenge.base_reward
        );

        for (const winnerId of result.winners) {
          await createNotification(
            winnerId,
            'reward',
            '¡Ganaste el reto grupal!',
            `Has ganado ${result.prizePerWinner} monedas`,
            { type: 'group_challenge_won', groupId, challengeId, amount: result.prizePerWinner }
          );
        }

        const { data: losers } = await admin
          .from('group_challenge_participants')
          .select('user_id')
          .eq('group_challenge_id', challengeId)
          .eq('status', 'failed');

        for (const l of losers || []) {
          await createNotification(
            l.user_id,
            'challenge',
            'Reto grupal perdido',
            'Has cogido el móvil durante el reto',
            { type: 'group_challenge_lost', groupId, challengeId }
          );
        }

        return NextResponse.json({ success: true, status: 'distributed', ...result });
      }

      return NextResponse.json({ success: true, status: 'waiting_others' });
    }

    if (action === 'cancel') {
      if (challenge.organizer_id !== user.id) {
        return NextResponse.json({ error: 'Solo el organizador puede cancelar' }, { status: 403 });
      }

      if (!['betting', 'scheduled'].includes(challenge.status)) {
        return NextResponse.json({ error: 'No se puede cancelar ahora' }, { status: 400 });
      }

      const { data: participants } = await admin
        .from('group_challenge_participants')
        .select('user_id, bet_amount')
        .eq('group_challenge_id', challengeId);

      for (const p of participants || []) {
        if (p.bet_amount > 0) {
          const { data: userData } = await admin.from('users').select('coins').eq('id', p.user_id).single();
          if (userData) {
            await admin.from('users').update({ coins: userData.coins + p.bet_amount }).eq('id', p.user_id);
            await admin.from('transactions').insert({
              user_id: p.user_id,
              amount: p.bet_amount,
              type: 'earn',
              description: 'Devolución apuesta (reto cancelado)',
              group_challenge_id: challengeId,
              group_id: groupId,
            });
          }
        }
      }

      await admin.from('group_challenges').update({ status: 'canceled' }).eq('id', challengeId);
      return NextResponse.json({ success: true, status: 'canceled' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error in group challenge action:', error);
    return NextResponse.json({ error: 'Error en reto grupal' }, { status: 500 });
  }
}
