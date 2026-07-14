import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { updateGroupSchema } from '@/lib/validations/groups';
import { resolveProfilePhotoUrl } from '@/lib/messaging/read-receipts';

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getMembership(groupId: string, userId: string) {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();
  return data;
}

/**
 * GET /api/groups/[id]
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const membership = await getMembership(groupId, user.id);
    if (!membership) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    }

    const admin = createServiceRoleClient();
    const { data: group } = await admin
      .from('chat_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    const { data: members } = await admin
      .from('group_members')
      .select('user_id, role, joined_at')
      .eq('group_id', groupId);

    const memberIds = (members || []).map((m) => m.user_id);
    const { data: users } = await admin
      .from('users')
      .select('id, display_name, profile_photo_path, is_premium')
      .in('id', memberIds);

    const userMap = Object.fromEntries((users || []).map((u) => [u.id, u]));

    return NextResponse.json({
      group: {
        id: group?.id,
        name: group?.name,
        description: group?.description,
        avatarPath: group?.avatar_path,
        createdBy: group?.created_by,
        updatedAt: group?.updated_at,
        myRole: membership.role,
        myUserId: user.id,
        members: (members || []).map((m) => ({
          userId: m.user_id,
          role: m.role,
          joinedAt: m.joined_at,
          displayName: userMap[m.user_id]?.display_name,
          profilePhotoPath: userMap[m.user_id]?.profile_photo_path,
          profilePhotoUrl: resolveProfilePhotoUrl(userMap[m.user_id]?.profile_photo_path ?? null),
          isPremium: userMap[m.user_id]?.is_premium,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Error al obtener grupo' }, { status: 500 });
  }
}

/**
 * PATCH /api/groups/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const membership = await getMembership(groupId, user.id);
    if (!membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const admin = createServiceRoleClient();
    const updates: Record<string, string> = {};
    if (parsed.data.name) updates.name = parsed.data.name;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;

    const { data: group, error } = await admin
      .from('chat_groups')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ group });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Error al actualizar grupo' }, { status: 500 });
  }
}

/**
 * DELETE /api/groups/[id]
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const membership = await getMembership(groupId, user.id);
    if (!membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden eliminar el grupo' }, { status: 403 });
    }

    const admin = createServiceRoleClient();
    const { error } = await admin
      .from('chat_groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Error al eliminar grupo' }, { status: 500 });
  }
}
