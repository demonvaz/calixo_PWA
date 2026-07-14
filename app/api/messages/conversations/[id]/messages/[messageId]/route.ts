import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string; messageId: string }>;
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
 * DELETE /api/messages/conversations/[id]/messages/[messageId]
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: conversationId, messageId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!(await verifyParticipant(conversationId, user.id))) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }

    const admin = createServiceRoleClient();
    const { data: message } = await admin
      .from('messages')
      .select('id, sender_id, conversation_id')
      .eq('id', parseInt(messageId, 10))
      .eq('conversation_id', conversationId)
      .single();

    if (!message) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });
    }

    if (message.sender_id !== user.id) {
      return NextResponse.json({ error: 'Solo puedes eliminar tus propios mensajes' }, { status: 403 });
    }

    await admin.from('messages').delete().eq('id', message.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Error al eliminar mensaje' }, { status: 500 });
  }
}
