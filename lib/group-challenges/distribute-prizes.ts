import { createServiceRoleClient } from '@/lib/supabase/server';

interface Participant {
  user_id: string;
  bet_amount: number;
  status: string;
}

interface DistributeResult {
  winners: string[];
  prizePerWinner: number;
  totalPot: number;
}

export async function distributeGroupChallengePrizes(
  challengeId: string,
  groupId: string,
  baseReward: number
): Promise<DistributeResult> {
  const admin = createServiceRoleClient();

  const { data: participants, error: pError } = await admin
    .from('group_challenge_participants')
    .select('user_id, bet_amount, status')
    .eq('group_challenge_id', challengeId);

  if (pError || !participants) {
    throw new Error('Error al obtener participantes');
  }

  const totalBets = participants.reduce((sum, p) => sum + (p.bet_amount || 0), 0);
  const totalPot = baseReward + totalBets;
  const winners = participants.filter((p) => p.status === 'success').map((p) => p.user_id);

  if (winners.length === 0) {
    for (const p of participants) {
      if (p.bet_amount > 0) {
        const { data: user } = await admin
          .from('users')
          .select('coins')
          .eq('id', p.user_id)
          .single();
        if (user) {
          await admin.from('users').update({ coins: user.coins + p.bet_amount }).eq('id', p.user_id);
          await admin.from('transactions').insert({
            user_id: p.user_id,
            amount: p.bet_amount,
            type: 'earn',
            description: 'Devolución apuesta reto grupal (sin ganadores)',
            group_challenge_id: challengeId,
            group_id: groupId,
          });
        }
      }
    }
    await admin.from('group_challenges').update({ status: 'distributed', total_pot: totalPot }).eq('id', challengeId);
    return { winners: [], prizePerWinner: 0, totalPot };
  }

  const prizePerWinner = Math.floor(totalPot / winners.length);

  for (const winnerId of winners) {
    const { data: user } = await admin
      .from('users')
      .select('coins')
      .eq('id', winnerId)
      .single();
    if (user) {
      await admin.from('users').update({ coins: user.coins + prizePerWinner }).eq('id', winnerId);
      await admin.from('transactions').insert({
        user_id: winnerId,
        amount: prizePerWinner,
        type: 'earn',
        description: 'Premio reto grupal',
        group_challenge_id: challengeId,
        group_id: groupId,
      });
    }
  }

  await admin.from('group_challenges').update({ status: 'distributed', total_pot: totalPot }).eq('id', challengeId);

  return { winners, prizePerWinner, totalPot };
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  payload: Record<string, unknown>
) {
  const admin = createServiceRoleClient();
  await admin.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    payload,
    seen: false,
  });
}
