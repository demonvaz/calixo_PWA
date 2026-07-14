import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { inviteMemberSchema } from '@/lib/validations/groups';
import { inviteGroupMember } from '@/lib/groups/invite-member';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/groups/[id]/invite
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const admin = createServiceRoleClient();
    const { data: membership } = await admin
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = inviteMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { inviteeId } = parsed.data;

    const result = await inviteGroupMember(admin, groupId, user.id, inviteeId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ invitation: result.invitation });
  } catch (error) {
    console.error('Error inviting member:', error);
    return NextResponse.json({ error: 'Error al invitar' }, { status: 500 });
  }
}
