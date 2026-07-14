import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string; userId: string }>;
}

/**
 * DELETE /api/groups/[id]/members/[userId]
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId, userId: targetUserId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const admin = createServiceRoleClient();
    const { data: myMembership } = await admin
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (!myMembership) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    }

    const isSelf = targetUserId === user.id;
    const isAdmin = myMembership.role === 'admin';

    if (!isSelf && !isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await admin
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', targetUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Error al eliminar miembro' }, { status: 500 });
  }
}
