import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { findOrCreateDirectConversation, markMessagesDelivered, markMessagesSeen, notifyDmReceived } from '../lib/messaging/helpers';
import { getDmMessageReadBy } from '../lib/messaging/read-receipts';
import { createServiceRoleClient } from '../lib/supabase/server';
import { createConversationSchema, markReadSchema, sendMessageSchema } from '../lib/validations/messages';

// --- Helpers from app/api/messages/conversations/route.ts ---
/**
 * GET /api/messages/conversations
 */


/**
 * POST /api/messages/conversations
 */

// --- Helpers from app/api/messages/conversations/[id]/messages/route.ts ---
interface RouteParams {
  params: Promise<{ id: string }>;
}async function verifyParticipant(conversationId: string, userId: string) {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

// --- Helpers from app/api/messages/unread-count/route.ts ---
/**
 * GET /api/messages/unread-count
 */

const router = Router();

// Migrated from app/api/messages/conversations/route.ts
router.get('/conversations', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const admin = createServiceRoleClient();

    const { data: participations } = await admin
      .from('conversation_participants')
      .select('conversation_id, last_read_message_id')
      .eq('user_id', user.id);

    if (!participations || participations.length === 0) {
      return res.json({ conversations: [] });
    }

    const convIds = participations.map((p) => p.conversation_id);
    const readMap = Object.fromEntries(
      participations.map((p) => [p.conversation_id, p.last_read_message_id])
    );

    const { data: conversations } = await admin
      .from('conversations')
      .select('id, updated_at')
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    const results = [];

    for (const conv of conversations || []) {
      const { data: otherParticipant } = await admin
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conv.id)
        .neq('user_id', user.id)
        .single();

      const { data: lastMessage } = await admin
        .from('messages')
        .select('id, content, sender_id, status, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const lastReadId = readMap[conv.id] || 0;
      const { count: unreadCount } = await admin
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', user.id)
        .gt('id', lastReadId);

      let otherUser = null;
      if (otherParticipant) {
        const { data: profile } = await admin
          .from('users')
          .select('id, display_name, profile_photo_path, is_premium')
          .eq('id', otherParticipant.user_id)
          .single();
        otherUser = profile;
      }

      results.push({
        id: conv.id,
        updatedAt: conv.updated_at,
        otherUser: otherUser
          ? {
              id: otherUser.id,
              displayName: otherUser.display_name,
              profilePhotoPath: otherUser.profile_photo_path,
              isPremium: otherUser.is_premium,
            }
          : null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderId: lastMessage.sender_id,
              status: lastMessage.status,
              createdAt: lastMessage.created_at,
              isOwn: lastMessage.sender_id === user.id,
            }
          : null,
        unreadCount: unreadCount || 0,
      });
    }

    return res.json({ conversations: results });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
});

// Migrated from app/api/messages/conversations/route.ts
router.post('/conversations', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const parsed = createConversationSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { recipientId } = parsed.data;

    if (recipientId === user.id) {
      return res.status(400).json({ error: 'No puedes enviarte mensajes a ti mismo' });
    }

    const admin = createServiceRoleClient();
    const { data: recipient } = await admin
      .from('users')
      .select('id')
      .eq('id', recipientId)
      .single();

    if (!recipient) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const conversationId = await findOrCreateDirectConversation(user.id, recipientId);

    return res.json({ conversationId });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({ error: 'Error al crear conversación' });
  }
});

// Migrated from app/api/messages/conversations/[id]/messages/route.ts
router.get('/conversations/:id/messages', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { id: conversationId } = req.params;
    
    if (!(await verifyParticipant(conversationId, user.id))) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    await markMessagesDelivered(conversationId, user.id);

    const searchParams = new URLSearchParams(req.query as any);
    const before = searchParams.get('before');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const admin = createServiceRoleClient();
    let query = admin
      .from('messages')
      .select('id, sender_id, content, image_url, status, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('id', parseInt(before, 10));
    }

    const { data: messages, error } = await query;
    if (error) throw error;

    const senderIds = [...new Set((messages || []).map((m) => m.sender_id))];
    const { data: users } = await admin
      .from('users')
      .select('id, display_name')
      .in('id', senderIds);

    const userMap = Object.fromEntries((users || []).map((u) => [u.id, u.display_name]));

    const reversed = (messages || []).reverse();
    const ownMessageIds = reversed.filter((m) => m.sender_id === user.id).map((m) => m.id);
    const readByMap = await getDmMessageReadBy(ownMessageIds, user.id);

    const formatted = reversed.map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      senderName: userMap[m.sender_id] || 'Usuario',
      content: m.content,
      imageUrl: m.image_url,
      status: m.status,
      createdAt: m.created_at,
      isOwn: m.sender_id === user.id,
      readBy: readByMap[m.id] || [],
    }));

    return res.json({ messages: formatted });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// Migrated from app/api/messages/conversations/[id]/messages/route.ts
router.post('/conversations/:id/messages', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { id: conversationId } = req.params;
    
    if (!(await verifyParticipant(conversationId, user.id))) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    const body = req.body;
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const admin = createServiceRoleClient();
    const { data: message, error } = await admin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: parsed.data.content?.trim() || '',
        image_url: parsed.data.imageUrl || null,
        status: 'sent',
      })
      .select()
      .single();

    if (error || !message) throw error;

    const { data: otherParticipant } = await admin
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .neq('user_id', user.id)
      .single();

    if (otherParticipant) {
      await notifyDmReceived(
        otherParticipant.user_id,
        user.id,
        conversationId,
        parsed.data.content?.trim() || 'Imagen'
      );
    }

    return res.json({
      message: {
        id: message.id,
        senderId: message.sender_id,
        content: message.content,
        imageUrl: message.image_url,
        status: message.status,
        createdAt: message.created_at,
        isOwn: true,
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

// Migrated from app/api/messages/conversations/[id]/messages/route.ts
router.patch('/conversations/:id/messages', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { id: conversationId } = req.params;
    
    if (!(await verifyParticipant(conversationId, user.id))) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    const body = req.body;
    const parsed = markReadSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    await markMessagesSeen(conversationId, user.id, parsed.data.lastReadMessageId);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking read:', error);
    return res.status(500).json({ error: 'Error al marcar como leído' });
  }
});

// Migrated from app/api/messages/conversations/[id]/messages/[messageId]/route.ts
router.delete('/conversations/:id/messages/:messageId', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { id: conversationId, messageId } = req.params;
    
    if (!(await verifyParticipant(conversationId, user.id))) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    const admin = createServiceRoleClient();
    const { data: message } = await admin
      .from('messages')
      .select('id, sender_id, conversation_id')
      .eq('id', parseInt(messageId, 10))
      .eq('conversation_id', conversationId)
      .single();

    if (!message) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }

    if (message.sender_id !== user.id) {
      return res.status(403).json({ error: 'Solo puedes eliminar tus propios mensajes' });
    }

    await admin.from('messages').delete().eq('id', message.id);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return res.status(500).json({ error: 'Error al eliminar mensaje' });
  }
});

// Migrated from app/api/messages/unread-count/route.ts
router.get('/unread-count', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const admin = createServiceRoleClient();

    const { data: participations } = await admin
      .from('conversation_participants')
      .select('conversation_id, last_read_message_id')
      .eq('user_id', user.id);

    let totalUnread = 0;

    for (const p of participations || []) {
      const lastRead = p.last_read_message_id || 0;
      const { count } = await admin
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', p.conversation_id)
        .neq('sender_id', user.id)
        .gt('id', lastRead);
      totalUnread += count || 0;
    }

    return res.json({ unreadCount: totalUnread });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return res.status(500).json({ error: 'Error al obtener contador' });
  }
});

export default router;