import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendGroupMessageSchema } from '@/lib/validations/groups';
import { getGroupMessageReadBy } from '@/lib/messaging/read-receipts';

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function verifyMember(groupId: string, userId: string) {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

/**
 * GET /api/groups/[id]/messages
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!(await verifyMember(groupId, user.id))) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const before = searchParams.get('before');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const admin = createServiceRoleClient();
    let query = admin
      .from('group_messages')
      .select('id, sender_id, content, image_url, created_at')
      .eq('group_id', groupId)
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
    const readByMap = await getGroupMessageReadBy(
      groupId,
      reversed.map((m) => ({ id: m.id, sender_id: m.sender_id }))
    );

    const formatted = reversed.map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      senderName: userMap[m.sender_id] || 'Usuario',
      content: m.content,
      imageUrl: m.image_url,
      createdAt: m.created_at,
      isOwn: m.sender_id === user.id,
      readBy: readByMap[m.id] || [],
    }));

    return NextResponse.json({ messages: formatted });
  } catch (error) {
    console.error('Error fetching group messages:', error);
    return NextResponse.json({ error: 'Error al obtener mensajes' }, { status: 500 });
  }
}

/**
 * POST /api/groups/[id]/messages
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!(await verifyMember(groupId, user.id))) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = sendGroupMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const admin = createServiceRoleClient();
    const { data: message, error } = await admin
      .from('group_messages')
      .insert({
        group_id: groupId,
        sender_id: user.id,
        content: parsed.data.content?.trim() || '',
        image_url: parsed.data.imageUrl || null,
      })
      .select()
      .single();

    if (error || !message) throw error;

    const { data: members } = await admin
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .neq('user_id', user.id);

    const { data: sender } = await admin.from('users').select('display_name').eq('id', user.id).single();
    const { data: group } = await admin.from('chat_groups').select('name').eq('id', groupId).single();

    for (const m of members || []) {
      await admin.from('notifications').insert({
        user_id: m.user_id,
        type: 'social',
        title: group?.name || 'Grupo',
        message: `${sender?.display_name}: ${(parsed.data.content || 'Imagen').slice(0, 60)}`,
        payload: { type: 'group_message', groupId, messageId: message.id },
        seen: false,
      });
    }

    return NextResponse.json({
      message: {
        id: message.id,
        senderId: message.sender_id,
        content: message.content,
        imageUrl: message.image_url,
        createdAt: message.created_at,
        isOwn: true,
      },
    });
  } catch (error) {
    console.error('Error sending group message:', error);
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
  }
}
