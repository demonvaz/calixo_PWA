import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/permissions';

/**
 * PUT /api/admin/banners/[id] - Actualizar banner
 * DELETE /api/admin/banners/[id] - Eliminar banner
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const bannerId = parseInt(id);
  if (isNaN(bannerId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { phrase, image_url, sort_order, is_active } = body;

    const updates: Record<string, unknown> = {};
    if (phrase !== undefined) updates.phrase = typeof phrase === 'string' ? phrase.trim() : null;
    if (image_url !== undefined) updates.image_url = image_url?.trim() || null;
    if (sort_order !== undefined) updates.sort_order = typeof sort_order === 'number' ? sort_order : 0;
    if (is_active !== undefined) updates.is_active = is_active !== false;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('feed_banners')
      .update(updates)
      .eq('id', bannerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating banner:', error);
      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Admin banners PUT error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const bannerId = parseInt(id);
  if (isNaN(bannerId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from('feed_banners')
      .delete()
      .eq('id', bannerId);

    if (error) {
      console.error('Error deleting banner:', error);
      return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin banners DELETE error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
