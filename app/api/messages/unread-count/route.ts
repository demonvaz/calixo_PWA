import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/messages/unread-count
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

    return NextResponse.json({ unreadCount: totalUnread });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({ error: 'Error al obtener contador' }, { status: 500 });
  }
}
