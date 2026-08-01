import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';

// --- Helpers from app/api/users/search/route.ts ---
/**
 * GET /api/users/search?q=query
 * Search for users by display name or email
 */

const router = Router();

// Migrated from app/api/users/search/route.ts
router.get('/search', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const searchParams = new URLSearchParams(req.query as any);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return res.json({
        users: [],
        message: 'La búsqueda debe tener al menos 2 caracteres',
      });
    }

    // Search in users table by display_name
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        display_name,
        avatar_energy,
        is_premium,
        is_private,
        streak,
        coins
      `)
      .ilike('display_name', `%${query}%`)
      .neq('id', user.id) // Exclude current user
      .limit(20);

    if (usersError) {
      throw usersError;
    }

    // Get follow status for each user
    const userIds = (users || []).map(u => u.id);
    
    let followingMap: Record<string, boolean> = {};
    if (userIds.length > 0) {
      const { data: following } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', userIds);

      followingMap = (following || []).reduce((acc, f) => {
        acc[f.following_id] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }

    // Get pending follow requests
    let pendingRequestsMap: Record<string, number> = {};
    if (userIds.length > 0) {
      const { data: pendingRequests } = await supabase
        .from('follow_requests')
        .select('requested_id, id')
        .eq('requester_id', user.id)
        .eq('status', 'pending')
        .in('requested_id', userIds);

      pendingRequestsMap = (pendingRequests || []).reduce((acc, r) => {
        acc[r.requested_id] = r.id;
        return acc;
      }, {} as Record<string, number>);
    }

    // Get follower counts
    const { data: followerCounts } = await supabase
      .from('followers')
      .select('following_id')
      .in('following_id', userIds);

    const followerCountMap = (followerCounts || []).reduce((acc, f) => {
      acc[f.following_id] = (acc[f.following_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Format results
    const results = (users || []).map(userData => ({
      userId: userData.id,
      displayName: userData.display_name,
      avatarEnergy: userData.avatar_energy,
      isPremium: userData.is_premium,
      isPrivate: userData.is_private,
      streak: userData.streak,
      coins: userData.coins,
      isFollowing: followingMap[userData.id] || false,
      hasPendingRequest: !!pendingRequestsMap[userData.id],
      pendingRequestId: pendingRequestsMap[userData.id] || null,
      followersCount: followerCountMap[userData.id] || 0,
    }));

    return res.json({
      users: results,
      total: results.length,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({ error: 'Error al buscar usuarios' });
  }
});

export default router;