import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string; messageId: string }>;
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
 * DELETE /api/groups/[id]/messages/[messageId]
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId, messageId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!(await verifyMember(groupId, user.id))) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    }

    const admin = createServiceRoleClient();
    const { data: message } = await admin
      .from('group_messages')
      .select('id, sender_id, group_id')
      .eq('id', parseInt(messageId, 10))
      .eq('group_id', groupId)
      .single();

    if (!message) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });
    }

    if (message.sender_id !== user.id) {
      return NextResponse.json({ error: 'Solo puedes eliminar tus propios mensajes' }, { status: 403 });
    }

    await admin.from('group_messages').delete().eq('id', message.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group message:', error);
    return NextResponse.json({ error: 'Error al eliminar mensaje' }, { status: 500 });
  }
}
