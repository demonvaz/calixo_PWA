import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendMessageSchema, markReadSchema } from '@/lib/validations/messages';
import {
  markMessagesDelivered,
  markMessagesSeen,
  notifyDmReceived,
} from '@/lib/messaging/helpers';
import { getDmMessageReadBy } from '@/lib/messaging/read-receipts';

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function verifyParticipant(conversationId: string, userId: string) {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

/**
 * GET /api/messages/conversations/[id]/messages
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!(await verifyParticipant(conversationId, user.id))) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }

    await markMessagesDelivered(conversationId, user.id);

    const { searchParams } = new URL(request.url);
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

    return NextResponse.json({ messages: formatted });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Error al obtener mensajes' }, { status: 500 });
  }
}

/**
 * POST /api/messages/conversations/[id]/messages
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!(await verifyParticipant(conversationId, user.id))) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
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

    return NextResponse.json({
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
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
  }
}

/**
 * PATCH /api/messages/conversations/[id]/read
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!(await verifyParticipant(conversationId, user.id))) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = markReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    await markMessagesSeen(conversationId, user.id, parsed.data.lastReadMessageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking read:', error);
    return NextResponse.json({ error: 'Error al marcar como leído' }, { status: 500 });
  }
}
