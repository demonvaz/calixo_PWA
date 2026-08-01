import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { createServiceRoleClient } from '../lib/supabase/server';
import { z } from 'zod';

// --- Helpers from app/api/profile/route.ts ---
// Schema for updating profile
const updateProfileSchema = z.object({
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'El nombre no puede exceder 50 caracteres').optional(),
  isPrivate: z.boolean().optional(),
  gender: z.enum(['femenino', 'masculino', 'no_responder']).optional().nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD').optional().nullable(),
  email: z.string().email('El email no es válido').optional(),
});

// --- Helpers from app/api/profile/[userId]/route.ts ---
/**
 * GET /api/profile/[userId]
 * Get public profile data for a specific user
 */

// --- Helpers from app/api/profile/[userId]/following/route.ts ---
/**
 * GET /api/profile/[userId]/following
 * Get list of users the specified user follows
 */

// --- Helpers from app/api/profile/[userId]/followers/route.ts ---
/**
 * GET /api/profile/[userId]/followers
 * Get list of users who follow the specified user
 */

// --- Helpers from app/api/profile/[userId]/feed/route.ts ---
/**
 * GET /api/profile/[userId]/feed
 * Get feed posts for a specific user
 */

// --- Helpers from app/api/profile/following/route.ts ---
const PAGE_SIZE = 50;

// --- Helpers from app/api/profile/check-username/route.ts ---
/**
 * GET /api/profile/check-username?username=xxx
 * Check if a username is available
 */

// --- Helpers from app/api/profile/challenges/route.ts ---
/**
 * GET /api/profile/challenges?page=1&limit=5
 * Get all challenges for the current user with pagination
 */

const router = Router();

// Migrated from app/api/profile/route.ts
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    // Get user from database using Supabase
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // If user doesn't exist, create it automatically
    if (userError || !userData) {
      // Get display name from user metadata or use email prefix as fallback
      const displayName = 
        (user.user_metadata?.display_name as string) ||
        user.email?.split('@')[0] ||
        'Usuario';

      // Create user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          display_name: displayName,
          avatar_energy: 100,
          is_private: false,
          is_premium: false,
          coins: 0,
          streak: 0,
        })
        .select()
        .single();

      if (createError || !newUser) {
        console.error('Error creating user:', createError);
        return res.status(500).json({ error: 'Error al crear el usuario' });
      }

      userData = newUser;
    }

    // Get profile photo URL if exists
    let profilePhotoUrl: string | null = null;
    if (userData.profile_photo_path) {
      const pathParts = userData.profile_photo_path.split('/');
      if (pathParts.length > 1) {
        const bucket = pathParts[0];
        const filePath = pathParts.slice(1).join('/');
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        profilePhotoUrl = publicUrl;
      }
    }

    // Get stats
    const { count: challengesCompleted } = await supabase
      .from('user_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const { count: followersCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id);

    const { count: followingCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id);

    return res.json({
      profile: {
        userId: userData.id,
        displayName: userData.display_name,
        avatarEnergy: userData.avatar_energy,
        isPrivate: userData.is_private,
        isPremium: userData.is_premium,
        coins: userData.coins,
        streak: userData.streak,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        profilePhotoUrl: profilePhotoUrl,
        profilePhotoPath: userData.profile_photo_path || null,
        email: user.email || null,
        gender: userData.gender || null,
        birthDate: userData.birth_date || null,
      },
      stats: {
        challengesCompleted: challengesCompleted || 0,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Error al obtener el perfil' });
  }
});

// Migrated from app/api/profile/route.ts
router.patch('/', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const validatedFields = updateProfileSchema.safeParse(body);

    if (!validatedFields.success) {
      return res.status(400).json({ error: validatedFields.error.issues[0].message });
    }

    const updateData: Record<string, any> = {};
    if (validatedFields.data.displayName !== undefined) {
      const newDisplayName = validatedFields.data.displayName.trim();
      
      // Check if display name is being changed
      const { data: currentUser } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', user.id)
        .single();

      if (currentUser?.display_name !== newDisplayName) {
        // Check if new display name is already taken
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('display_name', newDisplayName)
          .neq('id', user.id)
          .single();

        if (existingUser) {
          return res.status(400).json({ error: 'Este nombre de usuario ya está en uso' });
        }
      }

      updateData.display_name = newDisplayName;
    }
    if (validatedFields.data.isPrivate !== undefined) {
      updateData.is_private = validatedFields.data.isPrivate;
    }
    if (validatedFields.data.gender !== undefined) {
      updateData.gender = validatedFields.data.gender;
    }
    if (validatedFields.data.birthDate !== undefined) {
      updateData.birth_date = validatedFields.data.birthDate || null;
    }
    updateData.updated_at = new Date().toISOString();

    // Si se quiere cambiar el email, actualizar en Supabase Auth
    if (validatedFields.data.email && validatedFields.data.email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: validatedFields.data.email,
      });
      
      if (emailError) {
        return res.status(400).json({ error: 'Error al actualizar el email: ' + emailError.message });
      }
    }

    // Update user using Supabase
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError || !updatedUser) {
      return res.status(500).json({ error: 'Error al actualizar el perfil' });
    }

    // Update display_name in auth metadata to keep it in sync
    if (validatedFields.data.displayName !== undefined) {
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          display_name: validatedFields.data.displayName.trim(),
        },
      });

      if (authUpdateError) {
        console.error('Error updating auth metadata:', authUpdateError);
        // Don't fail the request if auth metadata update fails, but log it
        // The users table update was successful, which is the most important
      }
    }

    // Get profile photo URL if exists
    let profilePhotoUrl: string | null = null;
    if (updatedUser.profile_photo_path) {
      const pathParts = updatedUser.profile_photo_path.split('/');
      if (pathParts.length > 1) {
        const bucket = pathParts[0];
        const filePath = pathParts.slice(1).join('/');
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        profilePhotoUrl = publicUrl;
      }
    }

    // Get updated user from auth to get latest email
    const { data: { user: updatedAuthUser } } = await supabase.auth.getUser();

    return res.json({
      message: 'Perfil actualizado exitosamente',
      profile: {
        userId: updatedUser.id,
        displayName: updatedUser.display_name,
        avatarEnergy: updatedUser.avatar_energy,
        isPrivate: updatedUser.is_private,
        isPremium: updatedUser.is_premium,
        coins: updatedUser.coins,
        streak: updatedUser.streak,
        updatedAt: updatedUser.updated_at,
        profilePhotoUrl: profilePhotoUrl,
        profilePhotoPath: updatedUser.profile_photo_path || null,
        email: updatedAuthUser?.email || user.email || null,
        gender: updatedUser.gender || null,
        birthDate: updatedUser.birth_date || null,
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
});

// Migrated from app/api/profile/[userId]/route.ts
router.get('/:userId', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { userId } = req.params;

    // Get user profile
    const { data: profileUser, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profileUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Check if profile is private and user is not the owner
    if (profileUser.is_private && profileUser.id !== user.id) {
      // Check if current user follows the profile user
      const { data: followData } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle();

      if (!followData) {
        return res.status(403).json({ error: 'Este perfil es privado' });
      }
    }

    // Get profile photo URL
    let profilePhotoUrl = null;
    if (profileUser.profile_photo_path) {
      const pathParts = profileUser.profile_photo_path.split('/');
      if (pathParts.length > 1) {
        const bucket = pathParts[0];
        const filePath = pathParts.slice(1).join('/');
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        profilePhotoUrl = publicUrl;
      }
    }

    // Get stats
    // Count completed challenges
    const { count: challengesCompleted } = await supabase
      .from('user_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Count followers
    const { count: followersCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    // Count following
    const { count: followingCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    // Check if current user follows this profile
    const { data: followData } = await supabase
      .from('followers')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .maybeSingle();

    const isFollowing = !!followData;

    return res.json({
      profile: {
        userId: profileUser.id,
        displayName: profileUser.display_name,
        avatarEnergy: profileUser.avatar_energy,
        isPrivate: profileUser.is_private,
        isPremium: profileUser.is_premium,
        streak: profileUser.streak,
        createdAt: profileUser.created_at,
        profilePhotoUrl: profilePhotoUrl || null,
      },
      stats: {
        challengesCompleted: challengesCompleted || 0,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
      },
      isFollowing,
      canView: true,
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ 
        error: 'Error al obtener el perfil del usuario',
        details: error?.message || String(error)
      });
  }
});

// Migrated from app/api/profile/[userId]/following/route.ts
router.get('/:userId/following', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { userId } = req.params;

    // Check if profile is private and we're not the owner
    const { data: profileUser, error: profileError } = await supabase
      .from('users')
      .select('is_private')
      .eq('id', userId)
      .single();

    if (profileError || !profileUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (profileUser.is_private && userId !== user.id) {
      const { data: followData } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      if (!followData) {
        return res.status(403).json({ error: 'Este perfil es privado' });
      }
    }

    const searchParams = new URLSearchParams(req.query as any);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const { data: followingData, error: followingError } = await supabase
      .from('followers')
      .select('following_id')
      .eq('follower_id', userId)
      .order('following_id')
      .range(offset, offset + limit - 1);

    if (followingError) {
      console.error('Error fetching following:', followingError);
      return res.status(500).json({ error: 'Error al obtener siguiendo' });
    }

    const followingIds = (followingData || []).map((f) => f.following_id);

    if (followingIds.length === 0) {
      const { count: totalCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
      return res.json({ users: [], total: totalCount || 0, hasMore: false });
    }

    const { count: totalCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, profile_photo_path, is_private')
      .in('id', followingIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return res.status(500).json({ error: 'Error al obtener usuarios' });
    }

    const users = (usersData || []).map((u) => {
      let profilePhotoUrl: string | null = null;
      if (u.profile_photo_path) {
        const pathParts = u.profile_photo_path.split('/');
        if (pathParts.length > 1) {
          const bucket = pathParts[0];
          const filePath = pathParts.slice(1).join('/');
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
          profilePhotoUrl = publicUrl;
        }
      }

      return {
        userId: u.id,
        displayName: u.display_name,
        profilePhotoUrl,
        isPrivate: u.is_private || false,
      };
    });

    const totalVal = totalCount ?? 0;
    return res.json({
      users,
      total: totalVal,
      hasMore: offset + users.length < totalVal,
    });
  } catch (error) {
    console.error('Error in following API:', error);
    return res.status(500).json({ error: 'Error al obtener siguiendo' });
  }
});

// Migrated from app/api/profile/[userId]/followers/route.ts
router.get('/:userId/followers', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { userId } = req.params;

    // Check if profile is private and we're not the owner
    const { data: profileUser, error: profileError } = await supabase
      .from('users')
      .select('is_private')
      .eq('id', userId)
      .single();

    if (profileError || !profileUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (profileUser.is_private && userId !== user.id) {
      const { data: followData } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      if (!followData) {
        return res.status(403).json({ error: 'Este perfil es privado' });
      }
    }

    const searchParams = new URLSearchParams(req.query as any);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const { data: followersData, error: followersError } = await supabase
      .from('followers')
      .select('follower_id')
      .eq('following_id', userId)
      .order('follower_id')
      .range(offset, offset + limit - 1);

    if (followersError) {
      console.error('Error fetching followers:', followersError);
      return res.status(500).json({ error: 'Error al obtener seguidores' });
    }

    const followerIds = (followersData || []).map((f) => f.follower_id);

    if (followerIds.length === 0) {
      const { count: totalCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);
      return res.json({ users: [], total: totalCount || 0, hasMore: false });
    }

    const { count: totalCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, profile_photo_path, is_private')
      .in('id', followerIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return res.status(500).json({ error: 'Error al obtener usuarios' });
    }

    const users = (usersData || []).map((u) => {
      let profilePhotoUrl: string | null = null;
      if (u.profile_photo_path) {
        const pathParts = u.profile_photo_path.split('/');
        if (pathParts.length > 1) {
          const bucket = pathParts[0];
          const filePath = pathParts.slice(1).join('/');
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
          profilePhotoUrl = publicUrl;
        }
      }

      return {
        userId: u.id,
        displayName: u.display_name,
        profilePhotoUrl,
        isPrivate: u.is_private || false,
      };
    });

    const totalVal = totalCount ?? 0;
    return res.json({
      users,
      total: totalVal,
      hasMore: offset + users.length < totalVal,
    });
  } catch (error) {
    console.error('Error in followers API:', error);
    return res.status(500).json({ error: 'Error al obtener seguidores' });
  }
});

// Migrated from app/api/profile/[userId]/feed/route.ts
router.get('/:userId/feed', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { userId } = req.params;
    const searchParams = new URLSearchParams(req.query as any);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if the profile user exists and is accessible
    const { data: profileUser, error: profileError } = await supabase
      .from('users')
      .select('id, is_private')
      .eq('id', userId)
      .single();

    if (profileError || !profileUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Check if profile is private and user is not the owner
    if (profileUser.is_private && profileUser.id !== user.id) {
      // Check if current user follows the profile user
      const { data: followData } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      if (!followData) {
        return res.status(403).json({ error: 'Este perfil es privado' });
      }
    }

    // Get total count (solo en primera carga, excluir ocultos)
    let total = 0;
    if (offset === 0) {
      const { count } = await supabase
        .from('feed_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .or('is_hidden.eq.false,is_hidden.is.null');
      total = count ?? 0;
    }

    // Get feed items for this user (excluir ocultos por moderación)
    const { data: feedItems, error: feedError } = await supabase
      .from('feed_items')
      .select('*')
      .eq('user_id', userId)
      .or('is_hidden.eq.false,is_hidden.is.null')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (feedError) {
      console.error('Feed Error:', feedError);
      throw feedError;
    }

    if (!feedItems || feedItems.length === 0) {
      return res.json({
        feedItems: [],
        hasMore: false,
        total: offset === 0 ? total : undefined,
      });
    }

    // Get user profile data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Get profile photo URL
    let profilePhotoUrl = null;
    if (userData.profile_photo_path) {
      const pathParts = userData.profile_photo_path.split('/');
      if (pathParts.length > 1) {
        const bucket = pathParts[0];
        const filePath = pathParts.slice(1).join('/');
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        profilePhotoUrl = publicUrl;
      }
    }

    // Get unique user challenge IDs
    const uniqueUserChallengeIds = [...new Set(
      feedItems
        .map((fi: any) => fi.user_challenge_id)
        .filter((id): id is number => id != null && id !== undefined)
    )];

    // Use service role client to bypass RLS for user_challenges and challenges
    const serviceClient = createServiceRoleClient();

    // Fetch user challenges
    const { data: userChallenges, error: ucError } = uniqueUserChallengeIds.length > 0
      ? await serviceClient
          .from('user_challenges')
          .select('*')
          .in('id', uniqueUserChallengeIds)
      : { data: [], error: null };

    if (ucError) {
      throw ucError;
    }

    const userChallengesMap = new Map((userChallenges || []).map((uc: any) => [Number(uc.id), uc]));

    // Get unique challenge IDs
    const uniqueChallengeIds = [...new Set(
      (userChallenges || [])
        .map((uc: any) => uc.challenge_id)
        .filter((id): id is number => id != null && id !== undefined)
    )];

    // Fetch challenges
    const { data: challenges, error: challengesError } = uniqueChallengeIds.length > 0
      ? await serviceClient
          .from('challenges')
          .select('*')
          .in('id', uniqueChallengeIds)
      : { data: [], error: null };

    if (challengesError) {
      throw challengesError;
    }

    const challengesMap = new Map((challenges || []).map((c: any) => [Number(c.id), c]));

    // Format results
    const formattedResults = feedItems.map((feedItem: any) => {
      const userChallengeId = feedItem.user_challenge_id ? Number(feedItem.user_challenge_id) : null;
      const userChallenge = userChallengeId ? userChallengesMap.get(userChallengeId) || null : null;
      const challengeId = userChallenge?.challenge_id ? Number(userChallenge.challenge_id) : null;
      const challenge = challengeId ? challengesMap.get(challengeId) || null : null;

      return {
        feedItem: {
          id: feedItem.id,
          userId: feedItem.user_id,
          userChallengeId: feedItem.user_challenge_id,
          imageUrl: feedItem.image_url,
          note: feedItem.note,
          likesCount: feedItem.likes_count,
          commentsCount: feedItem.comments_count,
          createdAt: feedItem.created_at,
        },
        profile: {
          userId: userData.id,
          displayName: userData.display_name,
          avatarEnergy: userData.avatar_energy,
          isPrivate: userData.is_private,
          isPremium: userData.is_premium,
          streak: userData.streak,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at,
          profilePhotoUrl: profilePhotoUrl || null,
        },
        userChallenge: userChallenge ? {
          id: userChallenge.id,
          userId: userChallenge.user_id,
          challengeId: userChallenge.challenge_id,
          status: userChallenge.status,
          startedAt: userChallenge.started_at,
          completedAt: userChallenge.completed_at,
          failedAt: userChallenge.failed_at,
          sessionData: userChallenge.session_data,
          createdAt: userChallenge.created_at,
        } : null,
        challenge: challenge ? {
          id: challenge.id,
          type: challenge.type,
          title: challenge.title,
          description: challenge.description,
          reward: challenge.reward,
          durationMinutes: challenge.duration_minutes,
          isActive: challenge.is_active,
          createdAt: challenge.created_at,
        } : null,
      };
    });

    const hasMore = formattedResults.length === limit;

    return res.json({
      feedItems: formattedResults,
      hasMore,
      total: offset === 0 ? total : undefined,
    });
  } catch (error: any) {
    console.error('Error fetching user feed:', error);
    return res.status(500).json({ 
        error: 'Error al obtener las publicaciones del usuario',
        details: error?.message || String(error)
      });
  }
});

// Migrated from app/api/profile/following/route.ts
router.get('/following', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const searchParams = new URLSearchParams(req.query as any);
    const limit = Math.min(parseInt(searchParams.get('limit') || String(PAGE_SIZE), 10) || PAGE_SIZE, 100);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const { data: followingData, error: followingError } = await supabase
      .from('followers')
      .select('following_id')
      .eq('follower_id', user.id)
      .order('following_id')
      .range(offset, offset + limit - 1);

    if (followingError) {
      console.error('Error fetching following:', followingError);
      return res.status(500).json({ error: 'Error al obtener siguiendo' });
    }

    const followingIds = (followingData || []).map((f) => f.following_id);

    if (followingIds.length === 0) {
      const { count: totalCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);
      return res.json({ users: [], total: totalCount || 0, hasMore: false });
    }

    const { count: totalCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id);

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, profile_photo_path, is_private')
      .in('id', followingIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return res.status(500).json({ error: 'Error al obtener usuarios' });
    }

    const users = (usersData || []).map((u) => {
      let profilePhotoUrl: string | null = null;
      if (u.profile_photo_path) {
        const pathParts = u.profile_photo_path.split('/');
        if (pathParts.length > 1) {
          const bucket = pathParts[0];
          const filePath = pathParts.slice(1).join('/');
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
          profilePhotoUrl = publicUrl;
        }
      }

      return {
        userId: u.id,
        displayName: u.display_name,
        profilePhotoUrl,
        isPrivate: u.is_private || false,
      };
    });

    const totalVal = totalCount ?? 0;
    return res.json({
      users,
      total: totalVal,
      hasMore: offset + users.length < totalVal,
    });
  } catch (error) {
    console.error('Error in following API:', error);
    return res.status(500).json({ error: 'Error al obtener siguiendo' });
  }
});

// Migrated from app/api/profile/check-username/route.ts
router.get('/check-username', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    // User is optional - during signup, they might not be fully authenticated yet

    const searchParams = new URLSearchParams(req.query as any);
    const username = searchParams.get('username');

    if (!username) {
      return res.status(400).json({ error: 'El nombre de usuario es requerido' });
    }

    // Validate username format
    if (username.length < 2) {
      return res.json({
        available: false,
        message: 'El nombre debe tener al menos 2 caracteres',
      });
    }

    if (username.length > 50) {
      return res.json({
        available: false,
        message: 'El nombre no puede exceder 50 caracteres',
      });
    }

    // Check if username contains only valid characters (letters, numbers, underscores)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.json({
        available: false,
        message: 'El nombre solo puede contener letras, números y guiones bajos',
      });
    }

    // Use service role client to check username availability
    // This allows checking during signup when user might not be fully authenticated
    const { createServiceRoleClient } = await import('@/lib/supabase/server');
    const serviceClient = createServiceRoleClient();
    
    // Build query - exclude current user if authenticated
    let query = serviceClient
      .from('users')
      .select('id, display_name')
      .eq('display_name', username);

    // If user is authenticated, exclude their own username
    if (user?.id) {
      query = query.neq('id', user.id);
    }

    const { data: existingUser, error: queryError } = await query.single();

    if (queryError && queryError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is what we want
      console.error('Error checking username:', queryError);
      return res.status(500).json({ error: 'Error al verificar el nombre de usuario' });
    }

    const isAvailable = !existingUser;

    return res.json({
      available: isAvailable,
      message: isAvailable 
        ? 'Nombre de usuario disponible' 
        : 'Este nombre de usuario ya está en uso',
    });
  } catch (error) {
    console.error('Error checking username:', error);
    return res.status(500).json({ error: 'Error al verificar el nombre de usuario' });
  }
});

// Migrated from app/api/profile/followers/route.ts
router.get('/followers', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const searchParams = new URLSearchParams(req.query as any);
    const limit = Math.min(parseInt(searchParams.get('limit') || String(PAGE_SIZE), 10) || PAGE_SIZE, 100);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const { data: followersData, error: followersError } = await supabase
      .from('followers')
      .select('follower_id', { count: 'exact' })
      .eq('following_id', user.id)
      .order('follower_id')
      .range(offset, offset + limit - 1);

    if (followersError) {
      console.error('Error fetching followers:', followersError);
      return res.status(500).json({ error: 'Error al obtener seguidores' });
    }

    const followerIds = (followersData || []).map((f) => f.follower_id);

    if (followerIds.length === 0) {
      const { count: totalCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);
      return res.json({ users: [], total: totalCount || 0, hasMore: false });
    }

    const { count: totalCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id);

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, profile_photo_path, is_private')
      .in('id', followerIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return res.status(500).json({ error: 'Error al obtener usuarios' });
    }

    const users = (usersData || []).map((u) => {
      let profilePhotoUrl: string | null = null;
      if (u.profile_photo_path) {
        const pathParts = u.profile_photo_path.split('/');
        if (pathParts.length > 1) {
          const bucket = pathParts[0];
          const filePath = pathParts.slice(1).join('/');
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
          profilePhotoUrl = publicUrl;
        }
      }

      return {
        userId: u.id,
        displayName: u.display_name,
        profilePhotoUrl,
        isPrivate: u.is_private || false,
      };
    });

    const totalVal = totalCount ?? 0;
    return res.json({
      users,
      total: totalVal,
      hasMore: offset + users.length < totalVal,
    });
  } catch (error) {
    console.error('Error in followers API:', error);
    return res.status(500).json({ error: 'Error al obtener seguidores' });
  }
});

// Migrated from app/api/profile/challenges/route.ts
router.get('/challenges', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    // Get pagination parameters
    const searchParams = new URLSearchParams(req.query as any);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('user_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error counting challenges:', countError);
    }

    // Get paginated user challenges
    const { data: userChallenges, error: challengesError } = await supabase
      .from('user_challenges')
      .select('id, challenge_id, status, started_at, completed_at, failed_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (challengesError) {
      console.error('Error fetching challenges:', challengesError);
      return res.status(500).json({ error: 'Error al obtener los retos' });
    }

    if (!userChallenges || userChallenges.length === 0) {
      return res.json({
        challenges: [],
        total: 0,
      });
    }

    // Get challenge IDs
    const challengeIds = userChallenges.map(uc => uc.challenge_id);

    // Get challenge details
    const { data: challenges, error: challengeDetailsError } = await supabase
      .from('challenges')
      .select('id, title, type, reward')
      .in('id', challengeIds);

    if (challengeDetailsError) {
      console.error('Error fetching challenge details:', challengeDetailsError);
      return res.status(500).json({ error: 'Error al obtener los detalles de los retos' });
    }

    // Create a map of challenge details
    const challengeMap = new Map(
      (challenges || []).map(c => [c.id, c])
    );

    // Format the response
    const formattedChallenges = userChallenges.map((uc) => {
      const challenge = challengeMap.get(uc.challenge_id);
      // Determine the date to show based on status
      let statusDate = uc.created_at;
      if (uc.status === 'completed' && uc.completed_at) {
        statusDate = uc.completed_at;
      } else if ((uc.status === 'failed' || uc.status === 'canceled') && uc.failed_at) {
        statusDate = uc.failed_at;
      } else if (uc.started_at) {
        statusDate = uc.started_at;
      }
      
      return {
        id: uc.id,
        challengeId: uc.challenge_id,
        challengeTitle: challenge?.title || 'Reto desconocido',
        challengeType: challenge?.type || 'unknown',
        reward: challenge?.reward || 0,
        status: uc.status,
        statusDate: statusDate,
        startedAt: uc.started_at,
        completedAt: uc.completed_at,
        failedAt: uc.failed_at,
      };
    });

    const totalPages = totalCount ? Math.ceil(totalCount / limit) : 0;

    return res.json({
      challenges: formattedChallenges,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching completed challenges:', error);
    return res.status(500).json({ error: 'Error al obtener los retos completados' });
  }
});


const VALID_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Migrated from app/api/profile/photo/route.ts
router.post('/photo', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  const user = req.user!;
  try {
    const userId = user.id;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    if (!VALID_PHOTO_TYPES.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Tipo de archivo no válido. Solo JPG, PNG o WEBP' });
    }
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 5MB' });
    }

    const serviceClient = createServiceRoleClient();
    const { data: currentUser } = await serviceClient
      .from('users').select('profile_photo_path').eq('id', userId).single();

    if (currentUser?.profile_photo_path) {
      const oldPath = currentUser.profile_photo_path;
      const pathParts = oldPath.split('/');
      if (pathParts.length > 1) {
        await serviceClient.storage.from(pathParts[0]).remove([pathParts.slice(1).join('/')]);
      }
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.originalname.split('.').pop() || 'jpg';
    const filename = `${userId}/profile-${timestamp}-${randomString}.${extension}`;

    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from('profile-photos')
      .upload(filename, file.buffer, { contentType: file.mimetype, upsert: false });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      if (uploadError.message?.includes('Bucket not found') || (uploadError as any).statusCode === '404') {
        return res.status(500).json({ error: 'El bucket de almacenamiento no existe. Por favor, crea el bucket "profile-photos" en Supabase Storage.' });
      }
      if (uploadError.message?.includes('row-level security') || (uploadError as any).statusCode === '403') {
        return res.status(500).json({ error: 'Error de permisos. Verifica que las políticas RLS estén configuradas correctamente en Supabase Storage.' });
      }
      return res.status(500).json({ error: `Error al subir la imagen: ${uploadError.message || 'Error desconocido'}` });
    }

    const storagePath = `profile-photos/${uploadData.path}`;
    const { error: updateError } = await serviceClient
      .from('users')
      .update({ profile_photo_path: storagePath, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user:', updateError);
      await serviceClient.storage.from('profile-photos').remove([uploadData.path]);
      return res.status(500).json({ error: 'Error al actualizar el perfil' });
    }

    const { data: { publicUrl } } = serviceClient.storage.from('profile-photos').getPublicUrl(uploadData.path);
    return res.json({ url: publicUrl, path: storagePath });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Error al procesar la imagen' });
  }
});

router.delete('/photo', requireAuth, async (req: Request, res: Response) => {
  const user = req.user!;
  try {
    const userId = user.id;
    const serviceClient = createServiceRoleClient();
    const { data: currentUser } = await serviceClient
      .from('users').select('profile_photo_path').eq('id', userId).single();

    if (!currentUser?.profile_photo_path) {
      return res.status(404).json({ error: 'No hay foto de perfil para eliminar' });
    }

    const oldPath = currentUser.profile_photo_path;
    const pathParts = oldPath.split('/');
    if (pathParts.length > 1) {
      const { error: deleteError } = await serviceClient.storage
        .from(pathParts[0]).remove([pathParts.slice(1).join('/')]);
      if (deleteError) console.error('Error deleting photo:', deleteError);
    }

    const { error: updateError } = await serviceClient
      .from('users')
      .update({ profile_photo_path: null, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) return res.status(500).json({ error: 'Error al actualizar el perfil' });

    return res.json({ message: 'Foto de perfil eliminada exitosamente' });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Error al eliminar la foto' });
  }
});

export default router;
