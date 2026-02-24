import { NextRequest, NextResponse } from 'next/server';
import { requireModerator } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

const resolveSchema = z.object({
  action: z.enum(['approve', 'reject']),
  moderationNote: z.string().min(1, 'La descripción de moderación es requerida').max(1000),
});

/**
 * PUT /api/admin/moderation/[id]/resolve
 * Aprobar o rechazar un reporte (moderator/admin only)
 * - Aprobar: oculta el feed item (nunca borra), status = resolved
 * - Rechazar: deja la publicación como está, status = dismissed
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isModerator = await requireModerator();
    if (!isModerator) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const reportId = parseInt(id);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'ID de reporte inválido' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = resolveSchema.parse(body);

    const supabase = createServiceRoleClient();

    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
    }

    const newStatus = validatedData.action === 'approve' ? 'resolved' : 'dismissed';

    // Si aprobar y hay feed_item_id: ocultar el post (nunca borrar)
    if (validatedData.action === 'approve' && report.feed_item_id) {
      await supabase
        .from('feed_items')
        .update({ is_hidden: true })
        .eq('id', report.feed_item_id);
    }

    // Si aprobar y hay feed_comment_id: ocultar el comentario
    if (validatedData.action === 'approve' && (report as { feed_comment_id?: number }).feed_comment_id) {
      await supabase
        .from('feed_comments')
        .update({ is_hidden: true })
        .eq('id', (report as { feed_comment_id: number }).feed_comment_id);
    }

    // Actualizar el reporte con status y nota de moderación
    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update({
        status: newStatus,
        moderation_note: validatedData.moderationNote,
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      report: updatedReport,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error resolving report:', error);
    return NextResponse.json(
      { error: 'Error al resolver el reporte' },
      { status: 500 }
    );
  }
}
