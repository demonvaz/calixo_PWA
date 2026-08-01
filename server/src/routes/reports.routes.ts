import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';

// --- Helpers from app/api/reports/route.ts ---
const reportSchema = z.object({
  reportedUserId: z.string().uuid().optional(),
  feedItemId: z.number().int().optional(),
  feedCommentId: z.number().int().optional(),
  reason: z.string().min(1).max(500),
  description: z.string().max(500).optional(),
});

const router = Router();

// Migrated from app/api/reports/route.ts
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body;
    const validatedData = reportSchema.parse(body);

    // At least one of reportedUserId, feedItemId or feedCommentId must be provided
    if (!validatedData.reportedUserId && !validatedData.feedItemId && !validatedData.feedCommentId) {
      return res.status(400).json({ error: 'Debes reportar un usuario, una publicación o un comentario' });
    }

    // Evitar duplicados: mismo reporter + mismo objetivo + mismo motivo
    let duplicateCheck = supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('reason', validatedData.reason);

    if (validatedData.reportedUserId) {
      duplicateCheck = duplicateCheck.eq('reported_user_id', validatedData.reportedUserId);
    } else if (validatedData.feedItemId) {
      duplicateCheck = duplicateCheck.eq('feed_item_id', validatedData.feedItemId);
    } else if (validatedData.feedCommentId) {
      duplicateCheck = duplicateCheck.eq('feed_comment_id', validatedData.feedCommentId);
    }

    const { data: existing } = await duplicateCheck.limit(1).maybeSingle();

    if (existing) {
      const target =
        validatedData.reportedUserId
          ? 'este usuario'
          : validatedData.feedCommentId
            ? 'este comentario'
            : 'esta publicación';
      return res.status(409).json({
          error: `No se ha enviado el reporte porque ya tienes uno enviado para ${target} con el mismo motivo`,
        });
    }

    const { data: newReport, error: insertError } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_user_id: validatedData.reportedUserId || null,
        feed_item_id: validatedData.feedItemId || null,
        feed_comment_id: validatedData.feedCommentId || null,
        reason: validatedData.reason,
        description: validatedData.description || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !newReport) {
      throw insertError;
    }

    return res.status(201).json({
      id: newReport.id,
      reporterId: newReport.reporter_id,
      reportedUserId: newReport.reported_user_id,
      feedItemId: newReport.feed_item_id,
      feedCommentId: (newReport as { feed_comment_id?: number }).feed_comment_id ?? null,
      reason: newReport.reason,
      description: newReport.description,
      status: newReport.status,
      createdAt: newReport.created_at,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    console.error('Error creating report:', error);
    return res.status(500).json({ error: 'Failed to create report' });
  }
});

export default router;