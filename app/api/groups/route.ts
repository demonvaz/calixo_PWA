import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createGroupSchema } from '@/lib/validations/groups';

/**
 * GET /api/groups
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const admin = createServiceRoleClient();

    const { data: memberships } = await admin
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    const groupIds = memberships.map((m) => m.group_id);
    const roleMap = Object.fromEntries(memberships.map((m) => [m.group_id, m.role]));

    const { data: groups } = await admin
      .from('chat_groups')
      .select('id, name, description, avatar_path, created_by, updated_at')
      .in('id', groupIds)
      .order('updated_at', { ascending: false });

    const results = [];

    for (const group of groups || []) {
      const { count: memberCount } = await admin
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);

      const { data: lastMessage } = await admin
        .from('group_messages')
        .select('content, created_at, sender_id')
        .eq('group_id', group.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { data: readState } = await admin
        .from('group_message_reads')
        .select('last_read_message_id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single();

      const lastRead = readState?.last_read_message_id || 0;
      const { count: unreadCount } = await admin
        .from('group_messages')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id)
        .gt('id', lastRead);

      results.push({
        id: group.id,
        name: group.name,
        description: group.description,
        avatarPath: group.avatar_path,
        memberCount: memberCount || 0,
        role: roleMap[group.id],
        updatedAt: group.updated_at,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.created_at,
              isOwn: lastMessage.sender_id === user.id,
            }
          : null,
        unreadCount: unreadCount || 0,
      });
    }

    return NextResponse.json({ groups: results });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Error al obtener grupos' }, { status: 500 });
  }
}

/**
 * POST /api/groups
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const admin = createServiceRoleClient();
    const { data: group, error } = await admin
      .from('chat_groups')
      .insert({
        name: parsed.data.name,
        description: parsed.data.description || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error || !group) throw error;

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        createdBy: group.created_by,
      },
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Error al crear grupo' }, { status: 500 });
  }
}
