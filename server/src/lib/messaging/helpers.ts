import { createServiceRoleClient } from '@/lib/supabase/server';

export async function findOrCreateDirectConversation(
  userId: string,
  recipientId: string
): Promise<string> {
  const admin = createServiceRoleClient();

  const { data: myConvs } = await admin
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  const myConvIds = (myConvs || []).map((c) => c.conversation_id);

  if (myConvIds.length > 0) {
    const { data: shared } = await admin
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', recipientId)
      .in('conversation_id', myConvIds);

    if (shared && shared.length > 0) {
      return shared[0].conversation_id;
    }
  }

  const { data: conversation, error: convError } = await admin
    .from('conversations')
    .insert({ type: 'direct' })
    .select('id')
    .single();

  if (convError || !conversation) {
    throw new Error('Error al crear conversación');
  }

  await admin.from('conversation_participants').insert([
    { conversation_id: conversation.id, user_id: userId },
    { conversation_id: conversation.id, user_id: recipientId },
  ]);

  return conversation.id;
}

export async function markMessagesDelivered(
  conversationId: string,
  recipientId: string
) {
  const admin = createServiceRoleClient();

  await admin
    .from('messages')
    .update({ status: 'delivered' })
    .eq('conversation_id', conversationId)
    .neq('sender_id', recipientId)
    .eq('status', 'sent');
}

export async function markMessagesSeen(
  conversationId: string,
  userId: string,
  lastReadMessageId: number
) {
  const admin = createServiceRoleClient();

  await admin
    .from('conversation_participants')
    .update({
      last_read_message_id: lastReadMessageId,
      last_read_at: new Date().toISOString(),
    })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  const { data: messagesToMark } = await admin
    .from('messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .lte('id', lastReadMessageId);

  if (messagesToMark && messagesToMark.length > 0) {
    for (const msg of messagesToMark) {
      await admin.from('message_read_receipts').upsert({
        message_id: msg.id,
        user_id: userId,
        read_at: new Date().toISOString(),
      });
    }

    await admin
      .from('messages')
      .update({ status: 'seen' })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .lte('id', lastReadMessageId)
      .in('status', ['sent', 'delivered']);
  }
}

export async function notifyDmReceived(
  recipientId: string,
  senderId: string,
  conversationId: string,
  preview: string
) {
  const admin = createServiceRoleClient();
  const { data: sender } = await admin
    .from('users')
    .select('display_name')
    .eq('id', senderId)
    .single();

  await admin.from('notifications').insert({
    user_id: recipientId,
    type: 'social',
    title: 'Nuevo mensaje',
    message: `${sender?.display_name || 'Usuario'}: ${preview.slice(0, 80)}`,
    payload: {
      type: 'dm_received',
      senderId,
      conversationId,
    },
    seen: false,
  });
}
