import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { inviteMemberSchema } from '@/lib/validations/groups';
import { MAX_GROUP_MEMBERS } from '@/lib/groups/constants';

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

    const { data: existingMember } = await admin
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', inviteeId)
      .single();

    if (existingMember) {
      return NextResponse.json({ error: 'El usuario ya es miembro' }, { status: 400 });
    }

    const { count: memberCount } = await admin
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    if ((memberCount || 0) >= MAX_GROUP_MEMBERS) {
      return NextResponse.json(
        { error: `El grupo ha alcanzado el máximo de ${MAX_GROUP_MEMBERS} miembros` },
        { status: 400 }
      );
    }

    const { data: invitation, error } = await admin
      .from('group_invitations')
      .upsert({
        group_id: groupId,
        inviter_id: user.id,
        invitee_id: inviteeId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    const { data: group } = await admin.from('chat_groups').select('name').eq('id', groupId).single();
    const { data: inviter } = await admin.from('users').select('display_name').eq('id', user.id).single();

    await admin.from('notifications').insert({
      user_id: inviteeId,
      type: 'social',
      title: 'Invitación a grupo',
      message: `${inviter?.display_name || 'Usuario'} te invitó a "${group?.name}"`,
      payload: {
        type: 'group_invite',
        groupId,
        invitationId: invitation.id,
        inviterId: user.id,
      },
      seen: false,
    });

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Error inviting member:', error);
    return NextResponse.json({ error: 'Error al invitar' }, { status: 500 });
  }
}
