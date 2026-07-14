import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { markGroupReadSchema } from '@/lib/validations/groups';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/groups/[id]/read
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = markGroupReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const admin = createServiceRoleClient();
    await admin.from('group_message_reads').upsert({
      group_id: groupId,
      user_id: user.id,
      last_read_message_id: parsed.data.lastReadMessageId,
      last_read_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking group read:', error);
    return NextResponse.json({ error: 'Error al marcar como leído' }, { status: 500 });
  }
}
