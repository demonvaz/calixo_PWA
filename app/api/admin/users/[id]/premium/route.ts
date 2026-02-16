import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * PUT /api/admin/users/[id]/premium
 * Activa o desactiva el estado Premium de un usuario (solo is_admin)
 * IMPORTANTE: Si se activa Premium, permanece activo hasta que se desactive manualmente.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const userId = id;
    const body = await request.json();
    const { isPremium } = body;

    if (typeof isPremium !== 'boolean') {
      return NextResponse.json(
        { error: 'isPremium debe ser un booleano' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('users')
      .update({
        is_premium: isPremium,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating premium status:', error);
      return NextResponse.json(
        { error: 'Error al actualizar estado Premium' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.id,
        isPremium: data.is_premium,
      },
    });
  } catch (error) {
    console.error('Error updating premium status:', error);
    return NextResponse.json(
      { error: 'Error al actualizar estado Premium' },
      { status: 500 }
    );
  }
}
