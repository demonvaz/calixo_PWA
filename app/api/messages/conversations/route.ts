import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createConversationSchema } from '@/lib/validations/messages';
import { findOrCreateDirectConversation } from '@/lib/messaging/helpers';

/**
 * GET /api/messages/conversations
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const admin = createServiceRoleClient();

    const { data: participations } = await admin
      .from('conversation_participants')
      .select('conversation_id, last_read_message_id')
      .eq('user_id', user.id);

    if (!participations || participations.length === 0) {
      return NextResponse.json({ conversations: [] });
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

    return NextResponse.json({ conversations: results });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Error al obtener conversaciones' }, { status: 500 });
  }
}

/**
 * POST /api/messages/conversations
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { recipientId } = parsed.data;

    if (recipientId === user.id) {
      return NextResponse.json({ error: 'No puedes enviarte mensajes a ti mismo' }, { status: 400 });
    }

    const admin = createServiceRoleClient();
    const { data: recipient } = await admin
      .from('users')
      .select('id')
      .eq('id', recipientId)
      .single();

    if (!recipient) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const conversationId = await findOrCreateDirectConversation(user.id, recipientId);

    return NextResponse.json({ conversationId });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Error al crear conversación' }, { status: 500 });
  }
}
