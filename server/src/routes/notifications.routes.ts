import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';

// --- Helpers from app/api/notifications/route.ts ---
/**
 * GET /api/notifications
 * Get user notifications
 */


/**
 * POST /api/notifications
 * Create a test notification (for development)
 */

// --- Helpers from app/api/notifications/[id]/route.ts ---
/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */

// --- Helpers from app/api/notifications/[id]/read/route.ts ---
/**
 * POST /api/notifications/[id]/read
 * Mark notification as read
 */

// --- Helpers from app/api/notifications/read-all/route.ts ---
/**
 * POST /api/notifications/read-all
 * Mark all notifications as read
 */

const router = Router();

// Migrated from app/api/notifications/route.ts
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const searchParams = new URLSearchParams(req.query as any);
    const unseenOnly = searchParams.get('unseenOnly') === 'true';
    const seenOnly = searchParams.get('seenOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unseenOnly) {
      query = query.eq('seen', false);
    } else if (seenOnly) {
      query = query.eq('seen', true);
    }

    const { data: results, error: queryError, count } = await query;

    if (queryError) {
      throw queryError;
    }

    // Check if there are more notifications
    const totalCount = count || 0;
    const hasMore = offset + limit < totalCount;

    // Count unseen and read from current results
    const unseenCount = (results || []).filter(n => !n.seen).length;
    const readCount = (results || []).filter(n => n.seen).length;
    
    // If filtering by unseen only, also get total read count
    let totalReadCount = readCount;
    if (unseenOnly) {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('seen', true);
      totalReadCount = count || 0;
    }

    // Collect user IDs from payloads to fetch user names
    const userIds = new Set<string>();
    (results || []).forEach(n => {
      const payload = n.payload || {};
      if (payload.requesterId) userIds.add(payload.requesterId);
      if (payload.followerId) userIds.add(payload.followerId);
      if (payload.likerId) userIds.add(payload.likerId);
      if (payload.commenterId) userIds.add(payload.commenterId);
      if (payload.requestedId) userIds.add(payload.requestedId);
    });

    // Fetch user display names
    let usersMap: Record<string, string> = {};
    if (userIds.size > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', Array.from(userIds));

      usersMap = (users || []).reduce((acc, u) => {
        acc[u.id] = u.display_name || 'Usuario';
        return acc;
      }, {} as Record<string, string>);
    }

    // Format results with enriched payload
    const formattedResults = (results || []).map(n => {
      const payload = n.payload || {};
      const enrichedPayload = { ...payload };

      // Add user names to payload
      if (payload.requesterId && usersMap[payload.requesterId]) {
        enrichedPayload.requesterName = usersMap[payload.requesterId];
      }
      if (payload.followerId && usersMap[payload.followerId]) {
        enrichedPayload.followerName = usersMap[payload.followerId];
      }
      if (payload.likerId && usersMap[payload.likerId]) {
        enrichedPayload.likerName = usersMap[payload.likerId];
      }
      if (payload.commenterId && usersMap[payload.commenterId]) {
        enrichedPayload.commenterName = usersMap[payload.commenterId];
      }
      if (payload.requestedId && usersMap[payload.requestedId]) {
        enrichedPayload.requestedName = usersMap[payload.requestedId];
      }

      return {
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        payload: enrichedPayload,
        seen: n.seen,
        createdAt: n.created_at,
      };
    });

    // Calculate readCount based on filter
    let finalReadCount: number;
    if (unseenOnly) {
      finalReadCount = totalReadCount;
    } else if (seenOnly) {
      finalReadCount = formattedResults.length;
    } else {
      finalReadCount = readCount;
    }

    return res.json({
      notifications: formattedResults,
      unseenCount,
      readCount: finalReadCount,
      total: formattedResults.length,
      hasMore,
      totalCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// Migrated from app/api/notifications/route.ts
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const { type, title, message, payload } = body;

    if (!type || !title || !message) {
      return res.status(400).json({ error: 'type, title y message son requeridos' });
    }

    // Create notification
    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type,
        title,
        message,
        payload: payload || null,
        seen: false,
      })
      .select()
      .single();

    if (insertError || !notification) {
      throw insertError;
    }

    return res.json({
      success: true,
      notification: {
        id: notification.id,
        userId: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        payload: notification.payload,
        seen: notification.seen,
        createdAt: notification.created_at,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({ error: 'Error al crear notificación' });
  }
});

// Migrated from app/api/notifications/[id]/route.ts
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { id } = req.params;
    const notificationId = parseInt(id);

    // Delete notification (only if it belongs to the user)
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    return res.json({
      success: true,
      message: 'Notificación eliminada',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ error: 'Error al eliminar notificación' });
  }
});

// Migrated from app/api/notifications/[id]/read/route.ts
router.post('/:id/read', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { id } = req.params;
    const notificationId = parseInt(id);

    // Update notification
    const { data: updated, error: updateError } = await supabase
      .from('notifications')
      .update({ seen: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !updated) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    return res.json({
      success: true,
      notification: {
        id: updated.id,
        userId: updated.user_id,
        type: updated.type,
        title: updated.title,
        message: updated.message,
        payload: updated.payload,
        seen: updated.seen,
        createdAt: updated.created_at,
      },
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Error al marcar notificación' });
  }
});

// Migrated from app/api/notifications/read-all/route.ts
router.post('/read-all', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    // Update all unseen notifications
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ seen: true })
      .eq('user_id', user.id)
      .eq('seen', false);

    if (updateError) {
      throw updateError;
    }

    return res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ error: 'Error al marcar notificaciones' });
  }
});

export default router;