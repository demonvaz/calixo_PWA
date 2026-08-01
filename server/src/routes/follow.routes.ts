import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';

// --- Helpers from app/api/follow/route.ts ---
/**
 * POST /api/follow
 * Follow/unfollow a user
 */

// --- Helpers from app/api/follow/requests/route.ts ---
/**
 * GET /api/follow/requests
 * Get follow requests (sent or received)
 */

// --- Helpers from app/api/follow/requests/[id]/route.ts ---
/**
 * PATCH /api/follow/requests/[id]
 * Accept or reject a follow request
 */


/**
 * DELETE /api/follow/requests/[id]
 * Cancel a pending follow request (only by requester)
 */

const router = Router();

// Migrated from app/api/follow/route.ts
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const { userId: targetUserId, action } = body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    if (targetUserId === user.id) {
      return res.status(400).json({ error: 'No puedes seguirte a ti mismo' });
    }

    // Get target user's profile to check if private
    const { data: targetUser, error: targetUserError } = await supabase
      .from('users')
      .select('is_private')
      .eq('id', targetUserId)
      .single();

    if (targetUserError || !targetUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isPrivate = targetUser.is_private;

    // Check if already following
    const { data: existing } = await supabase
      .from('followers')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single();

    // Check if there's a pending request
    const { data: pendingRequest } = await supabase
      .from('follow_requests')
      .select('*')
      .eq('requester_id', user.id)
      .eq('requested_id', targetUserId)
      .eq('status', 'pending')
      .single();

    if (action === 'follow') {
      if (existing) {
        return res.status(400).json({ error: 'Ya sigues a este usuario' });
      }

      if (pendingRequest) {
        return res.status(400).json({ error: 'Ya tienes una solicitud pendiente con este usuario' });
      }

      // If profile is private, create a follow request instead
      if (isPrivate) {
        const { data: newRequest, error: requestError } = await supabase
          .from('follow_requests')
          .insert({
            requester_id: user.id,
            requested_id: targetUserId,
            status: 'pending',
          })
          .select()
          .single();

        if (requestError) {
          throw requestError;
        }

        // Create notification for follow request
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: targetUserId,
            type: 'social',
            title: 'Nueva solicitud de seguimiento',
            message: 'Tienes una nueva solicitud de seguimiento',
            payload: {
              type: 'follow_request',
              requesterId: user.id,
              requestId: newRequest.id,
            },
            seen: false,
          });

        if (notifError) {
          console.error('Error creating notification:', notifError);
        }

        return res.json({
          success: true,
          message: 'Solicitud de seguimiento enviada',
          requiresApproval: true,
          requestId: newRequest.id,
        });
      }

      // Profile is public, follow directly
      const { error: followError } = await supabase
        .from('followers')
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

      if (followError) {
        throw followError;
      }

      // Create notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type: 'social',
          title: 'Nuevo seguidor',
          message: 'Tienes un nuevo seguidor',
          payload: {
            type: 'new_follower',
            followerId: user.id,
          },
          seen: false,
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
      }

      // Get updated followers count
      const { count: followersCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);

      return res.json({
        success: true,
        message: 'Ahora sigues a este usuario',
        followersCount: followersCount || 0,
        requiresApproval: false,
      });
    } else if (action === 'unfollow') {
      // Check if there's a pending request to cancel
      if (pendingRequest) {
        const { error: deleteRequestError } = await supabase
          .from('follow_requests')
          .delete()
          .eq('id', pendingRequest.id);

        if (deleteRequestError) {
          throw deleteRequestError;
        }

        return res.json({
          success: true,
          message: 'Solicitud cancelada',
          cancelledRequest: true,
        });
      }

      // If not following, return error
      if (!existing) {
        return res.status(400).json({ error: 'No sigues a este usuario' });
      }

      // Remove follow relationship
      const { error: unfollowError } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (unfollowError) {
        throw unfollowError;
      }

      // Get updated followers count
      const { count: followersCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);

      return res.json({
        success: true,
        message: 'Dejaste de seguir a este usuario',
        followersCount: followersCount || 0,
      });
    } else {
      return res.status(400).json({ error: 'Acción inválida. Usa "follow" o "unfollow"' });
    }
  } catch (error) {
    console.error('Error following/unfollowing user:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// Migrated from app/api/follow/requests/route.ts
router.get('/requests', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const searchParams = new URLSearchParams(req.query as any);
    const type = searchParams.get('type') || 'received'; // 'received' or 'sent'

    let query = supabase
      .from('follow_requests')
      .select(`
        id,
        requester_id,
        requested_id,
        status,
        created_at,
        updated_at,
        requester:requester_id (
          id,
          display_name
        ),
        requested:requested_id (
          id,
          display_name
        )
      `)
      .eq('status', 'pending');

    if (type === 'received') {
      query = query.eq('requested_id', user.id);
    } else {
      query = query.eq('requester_id', user.id);
    }

    const { data: requests, error: requestsError } = await query.order('created_at', { ascending: false });

    if (requestsError) {
      throw requestsError;
    }

    // Format requests
    const formattedRequests = (requests || []).map((req: any) => ({
      id: req.id,
      requesterId: req.requester_id,
      requestedId: req.requested_id,
      requesterName: req.requester?.display_name || 'Usuario',
      requestedName: req.requested?.display_name || 'Usuario',
      status: req.status,
      createdAt: req.created_at,
      updatedAt: req.updated_at,
    }));

    return res.json({
      requests: formattedRequests,
      type,
    });
  } catch (error) {
    console.error('Error fetching follow requests:', error);
    return res.status(500).json({ error: 'Error al obtener las solicitudes' });
  }
});

// Migrated from app/api/follow/requests/[id]/route.ts
router.patch('/requests/:id', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { id } = req.params;
    const requestId = parseInt(id);

    const body = req.body;
    const { action } = body; // 'accept' or 'reject'

    if (!action || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Acción inválida. Usa "accept" o "reject"' });
    }

    // Get the follow request
    const { data: followRequest, error: requestError } = await supabase
      .from('follow_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !followRequest) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Verify that the current user is the one who received the request
    if (followRequest.requested_id !== user.id) {
      return res.status(403).json({ error: 'No autorizado para esta acción' });
    }

    // Check if request is already processed
    if (followRequest.status !== 'pending') {
      return res.status(400).json({ error: `Esta solicitud ya fue ${followRequest.status === 'accepted' ? 'aceptada' : 'rechazada'}` });
    }

    // Update request status
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    const { data: updatedRequest, error: updateError } = await supabase
      .from('follow_requests')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Mark the notification as read (for both accept and reject)
    // Find notification by requestId in payload - search all notifications
    // Use a more direct approach: search for notifications with the specific requestId
    const { data: allNotifications, error: notifSearchError } = await supabase
      .from('notifications')
      .select('id, payload, seen')
      .eq('user_id', user.id)
      .eq('type', 'social');

    if (!notifSearchError && allNotifications && allNotifications.length > 0) {
      // Find the notification with matching requestId
      const matchingNotification = allNotifications.find(
        (n: any) => {
          const payload = n.payload || {};
          return payload.type === 'follow_request' && payload.requestId === requestId;
        }
      );

      if (matchingNotification && !matchingNotification.seen) {
        const { error: updateNotifError } = await supabase
          .from('notifications')
          .update({ seen: true })
          .eq('id', matchingNotification.id);

        if (updateNotifError) {
          console.error('Error marking notification as read:', updateNotifError);
        } else {
          console.log(`Notification ${matchingNotification.id} marked as read for request ${requestId}`);
        }
      }
    }

    // If accepted, the trigger will automatically create the follow relationship
    // But we need to get the updated followers count
    let followersCount = 0;
    if (action === 'accept') {
      const { count } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);
      followersCount = count || 0;

      // Create notification for requester
      await supabase.from('notifications').insert({
        user_id: followRequest.requester_id,
        type: 'social',
        title: 'Solicitud aceptada',
        message: 'Tu solicitud de seguimiento fue aceptada',
        payload: {
          type: 'follow_request_accepted',
          requestedId: user.id,
        },
        seen: false,
      });
    }

    return res.json({
      success: true,
      message: action === 'accept' 
        ? 'Solicitud aceptada' 
        : 'Solicitud rechazada',
      status: newStatus,
      followersCount: action === 'accept' ? followersCount : undefined,
    });
  } catch (error) {
    console.error('Error processing follow request:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// Migrated from app/api/follow/requests/[id]/route.ts
router.delete('/requests/:id', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { id } = req.params;
    const requestId = parseInt(id);

    // Get the follow request
    const { data: followRequest, error: requestError } = await supabase
      .from('follow_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !followRequest) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Verify that the current user is the requester
    if (followRequest.requester_id !== user.id) {
      return res.status(403).json({ error: 'No autorizado para cancelar esta solicitud' });
    }

    // Only allow canceling pending requests
    if (followRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Solo se pueden cancelar solicitudes pendientes' });
    }

    // Delete the request
    const { error: deleteError } = await supabase
      .from('follow_requests')
      .delete()
      .eq('id', requestId);

    if (deleteError) {
      throw deleteError;
    }

    return res.json({
      success: true,
      message: 'Solicitud cancelada',
    });
  } catch (error) {
    console.error('Error canceling follow request:', error);
    return res.status(500).json({ error: 'Error al cancelar la solicitud' });
  }
});

export default router;