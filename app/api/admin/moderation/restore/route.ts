import { NextRequest, NextResponse } from 'next/server';
import { requireModerator } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

const restoreSchema = z.object({
  feedItemId: z.number().int().positive(),
});

/**
 * POST /api/admin/moderation/restore
 * Restaurar un post oculto por moderación (moderator/admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const isModerator = await requireModerator();
    if (!isModerator) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { feedItemId } = restoreSchema.parse(body);

    const supabase = createServiceRoleClient();

    const { data: feedItem, error: fetchError } = await supabase
      .from('feed_items')
      .select('id, is_hidden')
      .eq('id', feedItemId)
      .single();

    if (fetchError || !feedItem) {
      return NextResponse.json({ error: 'Publicación no encontrada' }, { status: 404 });
    }

    if (!feedItem.is_hidden) {
      return NextResponse.json(
        { error: 'La publicación no está oculta' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('feed_items')
      .update({ is_hidden: false })
      .eq('id', feedItemId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Publicación restaurada',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error restoring post:', error);
    return NextResponse.json(
      { error: 'Error al restaurar la publicación' },
      { status: 500 }
    );
  }
}
