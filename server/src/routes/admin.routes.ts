import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { upload } from '../middleware/upload';
import { createServiceRoleClient } from '../lib/supabase/server';
import { checkAdminPermissions } from '../lib/permissions';
import { z } from 'zod';

// --- Helpers from app/api/admin/users/route.ts ---
/**
 * GET /api/admin/users
 * Lista todos los usuarios con filtros (solo is_admin)
 */

// --- Helpers from app/api/admin/users/[id]/ban/route.ts ---
/**
 * PUT /api/admin/users/[id]/ban
 * Ban a user (admin only)
 */

// --- Helpers from app/api/admin/users/[id]/premium/route.ts ---
/**
 * PUT /api/admin/users/[id]/premium
 * Activa o desactiva el estado Premium de un usuario (solo is_admin)
 * IMPORTANTE: Si se activa Premium, permanece activo hasta que se desactive manualmente.
 */

// --- Helpers from app/api/admin/config/route.ts ---
/**
 * GET /api/admin/config
 * Get all configuration (admin only)
 */


/**
 * PUT /api/admin/config
 * Update configuration (admin only)
 */

// --- Helpers from app/api/admin/moderation/hidden/route.ts ---
/**
 * GET /api/admin/moderation/hidden
 * Get hidden feed items (posts ocultos por moderación) - moderator/admin only
 */

// --- Helpers from app/api/admin/moderation/[id]/resolve/route.ts ---
const resolveSchema = z.object({
  action: z.enum(['approve', 'reject']),
  moderationNote: z.string().min(1, 'La descripción de moderación es requerida').max(1000),
});

// --- Helpers from app/api/admin/moderation/queue/route.ts ---
/**
 * GET /api/admin/moderation/queue
 * Get pending reports with previews (moderator/admin only)
 */

// --- Helpers from app/api/admin/moderation/restore/route.ts ---
const restoreSchema = z.object({
  feedItemId: z.number().int().positive(),
});

// --- Helpers from app/api/admin/coupons/route.ts ---
const couponSchema = z.object({
  code: z.string().min(1).max(50),
  discountPercent: z.number().int().min(1).max(100),
  partnerName: z.string().min(1, 'El nombre del partner es requerido').max(100),
  description: z.string().max(500).optional().nullable(),
  price: z.number().int().min(0, 'El precio debe ser 0 o mayor'),
  maxUses: z.number().int().min(1).optional().nullable(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime(),
  isActive: z.boolean().default(true),
  brandImage: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
});

// --- Helpers from app/api/admin/coupons/[id]/route.ts ---
const couponUpdateSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  discountPercent: z.number().int().min(1).max(100).optional(),
  partnerName: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  price: z.number().int().min(0).optional(),
  maxUses: z.number().int().min(1).optional().nullable(),
  validUntil: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  brandImage: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
});

// --- Helpers from app/api/admin/banners/route.ts ---
/**
 * GET /api/admin/banners - Listar todos los banners
 * POST /api/admin/banners - Crear banner
 */

// --- Helpers from app/api/admin/banners/[id]/route.ts ---
/**
 * PUT /api/admin/banners/[id] - Actualizar banner
 * DELETE /api/admin/banners/[id] - Eliminar banner
 */

// --- Helpers from app/api/admin/challenges/route.ts ---
const challengeSchema = z.object({
  type: z.literal('daily'),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  reward: z.number().int().min(0),
  durationMinutes: z.number().int().min(1),
  isActive: z.boolean().default(true),
});

// --- Helpers from app/api/admin/challenges/[id]/route.ts ---
const challengeUpdateSchema = z.object({
  type: z.enum(['daily', 'focus', 'social']).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  reward: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(1).optional().nullable(),
  isActive: z.boolean().optional(),
});

// --- Helpers from app/api/admin/subscriptions/stats/route.ts ---
/**
 * GET /api/admin/subscriptions/stats
 * Get subscription statistics (admin only)
 */

// --- Helpers from app/api/admin/analytics/route.ts ---
/**
 * GET /api/admin/analytics
 * Get analytics data (admin only)
 */

const router = Router();

// Migrated from app/api/admin/users/route.ts
router.get('/users', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const searchParams = new URLSearchParams(req.query as any);
    const search = searchParams.get('search')?.trim();
    const isPremium = searchParams.get('isPremium');

    let query = supabase
      .from('users')
      .select('id, display_name, is_premium, coins, avatar_energy, created_at, is_admin')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('display_name', `%${search}%`);
    }

    if (isPremium === 'true') {
      query = query.eq('is_premium', true);
    } else if (isPremium === 'false') {
      query = query.eq('is_premium', false);
    }

    const { data: usersData, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Error al obtener usuarios' });
    }

    // Obtener emails de auth.users (solo si hay API para ello - Supabase no expone email directamente en users)
    // La tabla users de Supabase puede no tener email - se obtiene de auth
    const users = (usersData || []).map((u) => ({
      id: u.id,
      email: null as string | null, // Email viene de auth.users
      displayName: u.display_name || null,
      isPremium: u.is_premium ?? false,
      coins: u.coins ?? 0,
      energy: u.avatar_energy ?? 100,
      createdAt: u.created_at,
      isAdmin: u.is_admin ?? false,
    }));

    return res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Migrated from app/api/admin/users/[id]/ban/route.ts
router.put('/users/:id/ban', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { id } = req.params;
    const userId = id;
    const body = req.body;
    const { banned } = body;

    // For now, we'll add a note in the description or create a separate banned flag
    // Since we don't have a banned field, we'll use a workaround
    // In production, you'd want to add a `banned` boolean field to profiles

    return res.json({
      success: true,
      message: banned ? 'Usuario baneado' : 'Usuario desbaneado',
    });
  } catch (error) {
    console.error('Error banning user:', error);
    return res.status(500).json({ error: 'Failed to ban user' });
  }
});

// Migrated from app/api/admin/users/[id]/premium/route.ts
router.put('/users/:id/premium', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { id } = req.params;
    const userId = id;
    const body = req.body;
    const { isPremium } = body;

    if (typeof isPremium !== 'boolean') {
      return res.status(400).json({ error: 'isPremium debe ser un booleano' });
    }

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
      return res.status(500).json({ error: 'Error al actualizar estado Premium' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({
      success: true,
      user: {
        id: data.id,
        isPremium: data.is_premium,
      },
    });
  } catch (error) {
    console.error('Error updating premium status:', error);
    return res.status(500).json({ error: 'Error al actualizar estado Premium' });
  }
});

// Migrated from app/api/admin/config/route.ts
router.get('/config', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { data: allConfig, error } = await supabase
      .from('config')
      .select('key, value');

    if (error) {
      throw error;
    }

    const configObject: Record<string, unknown> = {};
    (allConfig || []).forEach((item) => {
      configObject[item.key] = item.value;
    });

    return res.json(configObject);
  } catch (error) {
    console.error('Error fetching config:', error);
    return res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// Migrated from app/api/admin/config/route.ts
router.put('/config', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const updates = body as Record<string, unknown>;

    const results: { key: string; value: unknown }[] = [];

    for (const [key, value] of Object.entries(updates)) {
      const { error } = await supabase
        .from('config')
        .upsert(
          { key, value, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
      if (error) {
        throw error;
      }
      results.push({ key, value });
    }

    return res.json({ success: true, updates: results });
  } catch (error) {
    console.error('Error updating config:', error);
    return res.status(500).json({ error: 'Failed to update config' });
  }
});

// Migrated from app/api/admin/moderation/hidden/route.ts
router.get('/moderation/hidden', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { data: feedItems, error } = await supabase
      .from('feed_items')
      .select('id, user_id, note, image_url, created_at')
      .eq('is_hidden', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Get user display names
    const userIds = [...new Set((feedItems || []).map((f) => f.user_id))];
    const userNames: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', userIds);
      (users || []).forEach((u) => {
        userNames[u.id] = u.display_name || u.id;
      });
    }

    const hiddenPosts = (feedItems || []).map((f) => ({
      id: f.id,
      userId: f.user_id,
      userName: userNames[f.user_id] || f.user_id,
      note: f.note,
      imageUrl: f.image_url,
      createdAt: f.created_at,
    }));

    return res.json(hiddenPosts);
  } catch (error) {
    console.error('Error fetching hidden posts:', error);
    return res.status(500).json({ error: 'Failed to fetch hidden posts' });
  }
});

// Migrated from app/api/admin/moderation/[id]/resolve/route.ts
router.put('/moderation/:id/resolve', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { id } = req.params;
    const reportId = parseInt(id);
    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'ID de reporte inválido' });
    }

    const body = req.body;
    const validatedData = resolveSchema.parse(body);


    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
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

    return res.json({
      success: true,
      report: updatedReport,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.issues });
    }
    console.error('Error resolving report:', error);
    return res.status(500).json({ error: 'Error al resolver el reporte' });
  }
});

// Migrated from app/api/admin/moderation/queue/route.ts
router.get('/moderation/queue', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { data: reports, error } = await supabase
      .from('reports')
      .select('id, reporter_id, reported_user_id, feed_item_id, feed_comment_id, reason, description, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Get display_name for reporters
    const reporterIds = [...new Set((reports || []).map((r) => r.reporter_id).filter(Boolean))];
    const reporterNames: Record<string, string> = {};
    if (reporterIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', reporterIds);
      (users || []).forEach((u) => {
        reporterNames[u.id] = u.display_name || u.id;
      });
    }

    // Collect IDs for previews
    const feedItemIds = [...new Set((reports || []).map((r) => r.feed_item_id).filter(Boolean))] as number[];
    const reportedUserIds = [...new Set((reports || []).map((r) => r.reported_user_id).filter(Boolean))] as string[];
    const commentIds = [...new Set((reports || []).map((r) => (r as { feed_comment_id?: number }).feed_comment_id).filter(Boolean))] as number[];

    // Fetch feed items preview
    const feedPreviews: Record<number, { note: string | null; imageUrl: string | null; userName: string }> = {};
    if (feedItemIds.length > 0) {
      const { data: feedItems } = await supabase
        .from('feed_items')
        .select('id, note, image_url, user_id')
        .in('id', feedItemIds);
      const postUserIds = [...new Set((feedItems || []).map((f) => f.user_id))];
      const { data: postUsers } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', postUserIds);
      const postUserNames = Object.fromEntries((postUsers || []).map((u) => [u.id, u.display_name || u.id]));
      (feedItems || []).forEach((f) => {
        feedPreviews[f.id] = {
          note: f.note,
          imageUrl: f.image_url,
          userName: postUserNames[f.user_id] || f.user_id,
        };
      });
    }

    // Fetch reported users preview
    const userPreviews: Record<string, string> = {};
    if (reportedUserIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', reportedUserIds);
      (users || []).forEach((u) => {
        userPreviews[u.id] = u.display_name || u.id;
      });
    }

    // Fetch comments preview
    const commentPreviews: Record<number, { comment: string; userName: string }> = {};
    if (commentIds.length > 0) {
      const { data: comments } = await supabase
        .from('feed_comments')
        .select('id, comment, user_id')
        .in('id', commentIds);
      const commentUserIds = [...new Set((comments || []).map((c) => c.user_id))];
      const { data: commentUsers } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', commentUserIds);
      const commentUserNames = Object.fromEntries((commentUsers || []).map((u) => [u.id, u.display_name || u.id]));
      (comments || []).forEach((c) => {
        commentPreviews[c.id] = {
          comment: c.comment,
          userName: commentUserNames[c.user_id] || c.user_id,
        };
      });
    }

    const pendingReports = (reports || []).map((r) => {
      const report = r as { feed_comment_id?: number };
      const feedItemId = r.feed_item_id;
      const feedCommentId = report.feed_comment_id;
      const reportedUserId = r.reported_user_id;

      let reportType: 'post' | 'user' | 'comment' = 'post';
      if (feedCommentId) reportType = 'comment';
      else if (reportedUserId && !feedItemId) reportType = 'user';
      else if (feedItemId) reportType = 'post';

      return {
        id: r.id,
        reporterId: r.reporter_id,
        reportedUserId: reportedUserId,
        feedItemId: feedItemId,
        feedCommentId: feedCommentId ?? null,
        reason: r.reason,
        description: r.description,
        status: r.status,
        createdAt: r.created_at,
        reporterEmail: reporterNames[r.reporter_id] || r.reporter_id,
        reportType,
        preview: reportType === 'post' && feedItemId
          ? feedPreviews[feedItemId]
          : reportType === 'user' && reportedUserId
            ? { userName: userPreviews[reportedUserId] }
            : reportType === 'comment' && feedCommentId
              ? commentPreviews[feedCommentId]
              : null,
      };
    });

    return res.json(pendingReports);
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return res.status(500).json({ error: 'Failed to fetch moderation queue' });
  }
});

// Migrated from app/api/admin/moderation/restore/route.ts
router.post('/moderation/restore', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const { feedItemId } = restoreSchema.parse(body);


    const { data: feedItem, error: fetchError } = await supabase
      .from('feed_items')
      .select('id, is_hidden')
      .eq('id', feedItemId)
      .single();

    if (fetchError || !feedItem) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }

    if (!feedItem.is_hidden) {
      return res.status(400).json({ error: 'La publicación no está oculta' });
    }

    const { error: updateError } = await supabase
      .from('feed_items')
      .update({ is_hidden: false })
      .eq('id', feedItemId);

    if (updateError) {
      throw updateError;
    }

    return res.json({
      success: true,
      message: 'Publicación restaurada',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.issues });
    }
    console.error('Error restoring post:', error);
    return res.status(500).json({ error: 'Error al restaurar la publicación' });
  }
});

// Migrated from app/api/admin/coupons/route.ts
router.get('/coupons', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { data: allCoupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return res.json(allCoupons || []);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// Migrated from app/api/admin/coupons/route.ts
router.post('/coupons', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const validatedData = couponSchema.parse(body);

    const { data: newCoupon, error } = await supabase
      .from('coupons')
      .insert({
        code: validatedData.code.toUpperCase(),
        discount_percent: validatedData.discountPercent,
        partner_name: validatedData.partnerName,
        description: validatedData.description || null,
        price: validatedData.price,
        max_uses: validatedData.maxUses || null,
        brand_image: (validatedData.brandImage && validatedData.brandImage.trim()) ? validatedData.brandImage.trim() : null,
        valid_from: validatedData.validFrom ? validatedData.validFrom : new Date().toISOString(),
        valid_until: validatedData.validUntil,
        is_active: validatedData.isActive,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json(newCoupon);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    console.error('Error creating coupon:', error);
    return res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// Migrated from app/api/admin/coupons/[id]/route.ts
router.put('/coupons/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { id } = req.params;
    const couponId = parseInt(id);
    if (isNaN(couponId)) {
      return res.status(400).json({ error: 'Invalid coupon ID' });
    }

    const body = req.body;
    const validatedData = couponUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (validatedData.code) updateData.code = validatedData.code.toUpperCase();
    if (validatedData.discountPercent !== undefined) updateData.discount_percent = validatedData.discountPercent;
    if (validatedData.partnerName !== undefined) updateData.partner_name = validatedData.partnerName;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.price !== undefined) updateData.price = validatedData.price;
    if (validatedData.maxUses !== undefined) updateData.max_uses = validatedData.maxUses;
    if (validatedData.validUntil) updateData.valid_until = validatedData.validUntil;
    if (validatedData.isActive !== undefined) updateData.is_active = validatedData.isActive;
    if (validatedData.brandImage !== undefined) updateData.brand_image = (validatedData.brandImage && String(validatedData.brandImage).trim()) ? String(validatedData.brandImage).trim() : null;

    const { data: updatedCoupon, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', couponId)
      .select()
      .single();

    if (error || !updatedCoupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    return res.json(updatedCoupon);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    console.error('Error updating coupon:', error);
    return res.status(500).json({ error: 'Failed to update coupon' });
  }
});

// Migrated from app/api/admin/coupons/[id]/route.ts
router.delete('/coupons/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { id } = req.params;
    const couponId = parseInt(id);
    if (isNaN(couponId)) {
      return res.status(400).json({ error: 'Invalid coupon ID' });
    }

    const { error } = await supabase
      .from('coupons')
      .update({ is_active: false })
      .eq('id', couponId);

    if (error) {
      throw error;
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// Migrated from app/api/admin/banners/route.ts
router.get('/banners', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  
  try {
    const { data, error } = await supabase
      .from('feed_banners')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching banners:', error);
      return res.status(500).json({ error: 'Error al cargar banners' });
    }

    return res.json(data || []);
  } catch (err) {
    console.error('Admin banners GET error:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Migrated from app/api/admin/banners/route.ts
router.post('/banners', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  
  try {
    const body = req.body;
    const { phrase, image_url, sort_order, is_active } = body;

    if (!phrase || typeof phrase !== 'string' || !phrase.trim()) {
      return res.status(400).json({ error: 'La frase es obligatoria' });
    }

    const { data, error } = await supabase
      .from('feed_banners')
      .insert({
        phrase: phrase.trim(),
        image_url: image_url?.trim() || null,
        sort_order: typeof sort_order === 'number' ? sort_order : 0,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating banner:', error);
      return res.status(500).json({ error: 'Error al crear banner' });
    }

    return res.json(data);
  } catch (err) {
    console.error('Admin banners POST error:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Migrated from app/api/admin/banners/[id]/route.ts
router.put('/banners/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  
  const { id } = req.params;
  const bannerId = parseInt(id);
  if (isNaN(bannerId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const body = req.body;
    const { phrase, image_url, sort_order, is_active } = body;

    const updates: Record<string, unknown> = {};
    if (phrase !== undefined) updates.phrase = typeof phrase === 'string' ? phrase.trim() : null;
    if (image_url !== undefined) updates.image_url = image_url?.trim() || null;
    if (sort_order !== undefined) updates.sort_order = typeof sort_order === 'number' ? sort_order : 0;
    if (is_active !== undefined) updates.is_active = is_active !== false;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nada que actualizar' });
    }

    const { data, error } = await supabase
      .from('feed_banners')
      .update(updates)
      .eq('id', bannerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating banner:', error);
      return res.status(500).json({ error: 'Error al actualizar' });
    }

    return res.json(data);
  } catch (err) {
    console.error('Admin banners PUT error:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Migrated from app/api/admin/banners/[id]/route.ts
router.delete('/banners/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  
  const { id } = req.params;
  const bannerId = parseInt(id);
  if (isNaN(bannerId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const { error } = await supabase
      .from('feed_banners')
      .delete()
      .eq('id', bannerId);

    if (error) {
      console.error('Error deleting banner:', error);
      return res.status(500).json({ error: 'Error al eliminar' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Admin banners DELETE error:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Migrated from app/api/admin/challenges/route.ts
router.get('/challenges', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const searchParams = new URLSearchParams(req.query as any);
    const isActive = searchParams.get('isActive');

    let query = supabase.from('challenges').select('*').order('created_at', { ascending: true });

    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: allChallenges, error } = await query;

    if (error) {
      throw error;
    }

    return res.json(allChallenges || []);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// Migrated from app/api/admin/challenges/route.ts
router.post('/challenges', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const validatedData = challengeSchema.parse(body);

    const { data: newChallenge, error } = await supabase
      .from('challenges')
      .insert({
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description || null,
        reward: validatedData.reward,
        duration_minutes: validatedData.durationMinutes,
        is_active: validatedData.isActive,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json(newChallenge);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    console.error('Error creating challenge:', error);
    return res.status(500).json({ error: 'Failed to create challenge' });
  }
});

// Migrated from app/api/admin/challenges/[id]/route.ts
router.put('/challenges/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { id } = req.params;
    const challengeId = parseInt(id);
    if (isNaN(challengeId)) {
      return res.status(400).json({ error: 'Invalid challenge ID' });
    }

    const body = req.body;
    const validatedData = challengeUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.reward !== undefined) updateData.reward = validatedData.reward;
    if (validatedData.durationMinutes !== undefined) updateData.duration_minutes = validatedData.durationMinutes;
    if (validatedData.isActive !== undefined) updateData.is_active = validatedData.isActive;

    const { data: updatedChallenge, error } = await supabase
      .from('challenges')
      .update(updateData)
      .eq('id', challengeId)
      .select()
      .single();

    if (error || !updatedChallenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    return res.json(updatedChallenge);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    console.error('Error updating challenge:', error);
    return res.status(500).json({ error: 'Failed to update challenge' });
  }
});

// Migrated from app/api/admin/challenges/[id]/route.ts
router.delete('/challenges/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { id } = req.params;
    const challengeId = parseInt(id);
    if (isNaN(challengeId)) {
      return res.status(400).json({ error: 'Invalid challenge ID' });
    }

    const { data: challenge, error: fetchError } = await supabase
      .from('challenges')
      .select('id')
      .eq('id', challengeId)
      .single();

    if (fetchError || !challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    await supabase
      .from('challenges')
      .update({ is_active: false })
      .eq('id', challengeId);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    return res.status(500).json({ error: 'Failed to delete challenge' });
  }
});

// Migrated from app/api/admin/subscriptions/stats/route.ts
router.get('/subscriptions/stats', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    

    const [
      totalActiveRes,
      totalCanceledRes,
      monthlyRes,
      annualRes,
      activeSubsRes,
    ] = await Promise.all([
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'canceled'),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('plan', 'monthly'),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('plan', 'annual'),
      supabase.from('subscriptions').select('plan').eq('status', 'active'),
    ]);

    const totalActive = totalActiveRes.count ?? 0;
    const totalCanceled = totalCanceledRes.count ?? 0;
    const monthlySubs = monthlyRes.count ?? 0;
    const annualSubs = annualRes.count ?? 0;

    let mrr = 0;
    (activeSubsRes.data || []).forEach((s) => {
      if (s.plan === 'monthly') mrr += 4.99;
      else if (s.plan === 'annual') mrr += 49.99 / 12;
    });

    const stats = {
      totalActive,
      totalCanceled,
      monthlySubs,
      annualSubs,
      mrr,
      arr: mrr * 12,
    };

    return res.json(stats);
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    return res.status(500).json({ error: 'Failed to fetch subscription stats' });
  }
});

// Migrated from app/api/admin/analytics/route.ts
router.get('/analytics', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString();
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthAgoStr = monthAgo.toISOString();

    // DAU, WAU, MAU - users with updated_at in range
    const [dauRes, wauRes, mauRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('updated_at', today),
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('updated_at', weekAgoStr),
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('updated_at', monthAgoStr),
    ]);

    // Challenges completed by status
    const { data: challengesByType } = await supabase
      .from('user_challenges')
      .select('status')
      .eq('status', 'completed');
    const completedCount = challengesByType?.length || 0;

    // Total coins earned vs spent
    const [earnedRes, spentRes] = await Promise.all([
      supabase.from('transactions').select('amount').eq('type', 'earn'),
      supabase.from('transactions').select('amount').eq('type', 'spend'),
    ]);
    const coinsEarned = (earnedRes.data || []).reduce((sum, t) => sum + Math.max(0, t.amount || 0), 0);
    const coinsSpent = (spentRes.data || []).reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

    // Cupones más comprados (transactions con type=spend y coupon_code)
    const { data: spendTransactions } = await supabase
      .from('transactions')
      .select('coupon_code')
      .eq('type', 'spend');
    const couponCounts: Record<string, number> = {};
    (spendTransactions || []).forEach((t) => {
      const code = t.coupon_code?.trim();
      if (code) {
        couponCounts[code] = (couponCounts[code] || 0) + 1;
      }
    });
    const topCouponCodes = Object.entries(couponCounts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Enriquecer con datos del cupón (partner_name)
    const topItems = await Promise.all(
      topCouponCodes.map(async ({ code, count }) => {
        const { data: coupon } = await supabase
          .from('coupons')
          .select('id, code, partner_name')
          .eq('code', code)
          .single();
        return {
          code,
          couponId: coupon?.id,
          partnerName: coupon?.partner_name || code,
          count,
        };
      })
    );

    // Most liked posts
    const { data: topPostsData } = await supabase
      .from('feed_items')
      .select('id, likes_count')
      .order('likes_count', { ascending: false })
      .limit(10);
    const topPosts = topPostsData || [];

    const analytics = {
      users: {
        dau: dauRes.count ?? 0,
        wau: wauRes.count ?? 0,
        mau: mauRes.count ?? 0,
      },
      challenges: {
        completedByType: [{ status: 'completed', count: completedCount }],
      },
      coins: {
        earned: coinsEarned,
        spent: coinsSpent,
        net: coinsEarned - coinsSpent,
      },
      topItems: topItems,
      topPosts: topPosts.map((p: { id: number; likes_count?: number }) => ({ id: p.id, likesCount: p.likes_count ?? 0 })),
    };

    return res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});


const VALID_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

router.get('/check', requireAuth, async (req: Request, res: Response) => {
  try {
    const permissions = await checkAdminPermissions(req.supabase!, req.user!.id);
    return res.json({ ...permissions });
  } catch (error) {
    console.error('Error checking admin permissions:', error);
    return res.status(500).json({ error: 'Failed to check admin permissions' });
  }
});

router.post('/banners/upload', requireAuth, requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    if (!VALID_UPLOAD_TYPES.includes(file.mimetype)) return res.status(400).json({ error: 'Tipo no válido. Solo JPG, PNG o WEBP' });
    if (file.size > 5 * 1024 * 1024) return res.status(400).json({ error: 'Máximo 5MB' });

    const supabase = createServiceRoleClient();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = file.originalname.split('.').pop() || 'jpg';
    const path = `banner-${timestamp}-${random}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('banners').upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

    if (uploadError) {
      console.error('Banner upload error:', uploadError);
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('404')) {
        return res.status(500).json({ error: 'Crea el bucket "banners" en Supabase Storage (público)' });
      }
      return res.status(500).json({ error: uploadError.message || 'Error al subir' });
    }

    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(uploadData.path);
    return res.json({ url: publicUrl, path: `banners/${uploadData.path}` });
  } catch (err) {
    console.error('Banner upload error:', err);
    return res.status(500).json({ error: 'Error al procesar la imagen' });
  }
});

router.post('/coupons/upload', requireAuth, requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    if (!VALID_UPLOAD_TYPES.includes(file.mimetype)) return res.status(400).json({ error: 'Tipo no válido. Solo JPG, PNG o WEBP' });
    if (file.size > 5 * 1024 * 1024) return res.status(400).json({ error: 'Máximo 5MB' });

    const supabase = createServiceRoleClient();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = file.originalname.split('.').pop() || 'jpg';
    const path = `coupons/coupon-${timestamp}-${random}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('banners').upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

    if (uploadError) {
      console.error('Coupon upload error:', uploadError);
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('404')) {
        return res.status(500).json({ error: 'Crea el bucket "banners" en Supabase Storage (público)' });
      }
      return res.status(500).json({ error: uploadError.message || 'Error al subir' });
    }

    const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(uploadData.path);
    return res.json({ url: publicUrl, path: `banners/${uploadData.path}` });
  } catch (err) {
    console.error('Coupon upload error:', err);
    return res.status(500).json({ error: 'Error al procesar la imagen' });
  }
});

export default router;
