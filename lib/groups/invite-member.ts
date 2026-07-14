import type { SupabaseClient } from '@supabase/supabase-js';
import { MAX_GROUP_MEMBERS } from '@/lib/groups/constants';

export async function inviteGroupMember(
  admin: SupabaseClient,
  groupId: string,
  inviterId: string,
  inviteeId: string
): Promise<{ invitation: { id: string } } | { error: string; status: number }> {
  const { data: existingMember } = await admin
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', inviteeId)
    .single();

  if (existingMember) {
    return { error: 'El usuario ya es miembro', status: 400 };
  }

  const { count: memberCount } = await admin
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId);

  if ((memberCount || 0) >= MAX_GROUP_MEMBERS) {
    return {
      error: `El grupo ha alcanzado el máximo de ${MAX_GROUP_MEMBERS} miembros`,
      status: 400,
    };
  }

  const { data: invitation, error } = await admin
    .from('group_invitations')
    .upsert({
      group_id: groupId,
      inviter_id: inviterId,
      invitee_id: inviteeId,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !invitation) {
    throw error;
  }

  const { data: group } = await admin.from('chat_groups').select('name').eq('id', groupId).single();
  const { data: inviter } = await admin.from('users').select('display_name').eq('id', inviterId).single();

  await admin.from('notifications').insert({
    user_id: inviteeId,
    type: 'social',
    title: 'Invitación a grupo',
    message: `${inviter?.display_name || 'Usuario'} te invitó a "${group?.name}"`,
    payload: {
      type: 'group_invite',
      groupId,
      invitationId: invitation.id,
      inviterId,
    },
    seen: false,
  });

  return { invitation };
}
