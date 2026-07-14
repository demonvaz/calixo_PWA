import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { invitationActionSchema } from '@/lib/validations/groups';
import { MAX_GROUP_MEMBERS } from '@/lib/groups/constants';

interface RouteParams {
  params: Promise<{ id: string; invId: string }>;
}

/**
 * PATCH /api/groups/[id]/invitations/[invId]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId, invId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = invitationActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const admin = createServiceRoleClient();
    const { data: invitation } = await admin
      .from('group_invitations')
      .select('*')
      .eq('id', invId)
      .eq('group_id', groupId)
      .eq('invitee_id', user.id)
      .eq('status', 'pending')
      .single();

    if (!invitation) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 });
    }

    if (parsed.data.action === 'accept') {
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

      await admin.from('group_invitations').update({ status: 'accepted' }).eq('id', invId);
      await admin.from('group_members').insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member',
      });
    } else {
      await admin.from('group_invitations').update({ status: 'rejected' }).eq('id', invId);
    }

    return NextResponse.json({ success: true, action: parsed.data.action });
  } catch (error) {
    console.error('Error processing invitation:', error);
    return NextResponse.json({ error: 'Error al procesar invitación' }, { status: 500 });
  }
}
