import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { createServiceRoleClient } from '../lib/supabase/server';
import { getMentionedUsernames } from '../lib/utils/mentions';

// --- Helpers from app/api/feed/route.ts ---
/**
 * GET /api/feed
 * Get feed items (global or from followed users)
 */


/**
 * POST /api/feed
 * Create a new feed post (already handled in challenges/complete, this is for manual posts)
 */

// --- Helpers from app/api/feed/[id]/route.ts ---
/**
 * GET /api/feed/[id]
 * Get a single feed post by ID
 */

// --- Helpers from app/api/feed/[id]/metadata/route.ts ---
/**
 * GET /api/feed/[id]/metadata
 * Public endpoint to get post metadata for social sharing
 * This endpoint doesn't require authentication
 */

// --- Helpers from app/api/feed/[id]/like/route.ts ---
/**
 * GET /api/feed/[id]/like
 * Check if current user has liked the post
 */


/**
 * POST /api/feed/[id]/like
 * Toggle like/unlike a feed post
 */

// --- Helpers from app/api/feed/[id]/comments/route.ts ---
/**
 * GET /api/feed/[id]/comments
 * Get comments for a feed post
 */


/**
 * POST /api/feed/[id]/comments
 * Add a comment to a feed post
 */

const router = Router();

// Migrated from app/api/feed/route.ts
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    // Get query parameters
    const searchParams = new URLSearchParams(req.query as any);
    const type = searchParams.get('type') || 'following'; // 'following' or 'global'
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let userIds: string[] = [];

    if (type === 'following') {
      // Get users the current user follows
      const { data: following, error: followingError } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followingError) {
        throw followingError;
      }

      const followingIds = (following || []).map(f => f.following_id);
      
      // Only include followed users posts (exclude own posts)
      userIds = followingIds;

      if (userIds.length === 0) {
        return res.json({
          feedItems: [],
          hasMore: false,
          total: 0,
        });
      }
    } else {
      // Global feed - all public posts including own posts
      const { data: publicUsers, error: publicUsersError } = await supabase
        .from('users')
        .select('id')
        .eq('is_private', false);

      if (publicUsersError) {
        throw publicUsersError;
      }

      // Include all public users
      userIds = (publicUsers || []).map(u => u.id);
      
      // Always include own user ID in global feed, even if profile is private
      if (!userIds.includes(user.id)) {
        userIds.push(user.id);
      }

      if (userIds.length === 0) {
        return res.json({
          feedItems: [],
          hasMore: false,
          total: 0,
        });
      }
    }

    // Get feed items (using regular client for RLS on feed_items)
    // Excluir posts ocultos por moderación (is_hidden = true)
    let query = supabase
      .from('feed_items')
      .select('*')
      .in('user_id', userIds)
      .or('is_hidden.eq.false,is_hidden.is.null');
    
    // Only exclude own posts when viewing 'following' feed
    if (type === 'following') {
      query = query.neq('user_id', user.id);
    }
    
    const { data: feedItems, error: feedError } = await query
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
        total: 0,
      });
    }

    // Get unique user IDs and user challenge IDs
    const uniqueUserIds = [...new Set(feedItems.map((fi: any) => fi.user_id))];
    const uniqueUserChallengeIds = [...new Set(
      feedItems
        .map((fi: any) => fi.user_challenge_id)
        .filter((id): id is number => id != null && id !== undefined)
    )];

    // Use service role client to bypass RLS for user_challenges and challenges
    // These are public data related to public feed_items
    const serviceClient = createServiceRoleClient();

    // Fetch related data in parallel
    const [usersResult, userChallengesResult] = await Promise.all([
      supabase
        .from('users')
        .select('*')
        .in('id', uniqueUserIds),
      uniqueUserChallengeIds.length > 0
        ? serviceClient
            .from('user_challenges')
            .select('*')
            .in('id', uniqueUserChallengeIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (usersResult.error) {
      throw usersResult.error;
    }
    if (userChallengesResult.error) {
      throw userChallengesResult.error;
    }

    // Process users and get profile photo URLs
    const usersMap = new Map();
    (usersResult.data || []).forEach((u: any) => {
      let profilePhotoUrl = null;
      
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
      
      usersMap.set(u.id, { ...u, profilePhotoUrl });
    });
    
    const userChallengesMap = new Map((userChallengesResult.data || []).map((uc: any) => [Number(uc.id), uc]));

    // Get unique challenge IDs from user_challenges
    const uniqueChallengeIds = [...new Set(
      (userChallengesResult.data || [])
        .map((uc: any) => uc.challenge_id)
        .filter((id): id is number => id != null && id !== undefined)
    )];

    // Fetch challenges using service role client
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
      const user = usersMap.get(feedItem.user_id) || null;
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
        profile: user ? {
          userId: user.id,
          displayName: user.display_name,
          avatarEnergy: user.avatar_energy,
          isPrivate: user.is_private,
          isPremium: user.is_premium,
          coins: user.coins,
          streak: user.streak,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          profilePhotoUrl: user.profilePhotoUrl || null,
        } : null,
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
      total: formattedResults.length,
    });
  } catch (error: any) {
    console.error('Error fetching feed:', error);
    return res.status(500).json({ 
        error: 'Error al obtener el feed',
        details: error?.message || String(error)
      });
  }
});

// Migrated from app/api/feed/route.ts
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const { userChallengeId, imageUrl, note } = body;

    if (!userChallengeId || !imageUrl || !note) {
      return res.status(400).json({ error: 'userChallengeId, imageUrl y note son requeridos' });
    }

    // Verify the user challenge belongs to this user
    const { data: userChallenge, error: challengeError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('id', userChallengeId)
      .eq('user_id', user.id)
      .single();

    if (challengeError || !userChallenge) {
      return res.status(404).json({ error: 'Reto no encontrado o no autorizado' });
    }

    // Create feed item
    const { data: feedItem, error: insertError } = await supabase
      .from('feed_items')
      .insert({
        user_id: user.id,
        user_challenge_id: userChallengeId,
        image_url: imageUrl,
        note,
      })
      .select()
      .single();

    if (insertError || !feedItem) {
      throw insertError;
    }

    return res.json({
      success: true,
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
    });
  } catch (error) {
    console.error('Error creating feed post:', error);
    return res.status(500).json({ error: 'Error al crear el post' });
  }
});

// Migrated from app/api/feed/[id]/route.ts
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { id } = req.params;
    const feedItemId = parseInt(id);

    if (isNaN(feedItemId)) {
      return res.status(400).json({ error: 'ID de publicación inválido' });
    }

    // Get the feed item
    const { data: feedItem, error: feedError } = await supabase
      .from('feed_items')
      .select('*')
      .eq('id', feedItemId)
      .single();

    if (feedError || !feedItem) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }

    // No mostrar posts ocultos por moderación
    if (feedItem.is_hidden) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }

    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', feedItem.user_id)
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

    // Get user challenge if exists
    let userChallenge = null;
    let challenge = null;

    if (feedItem.user_challenge_id) {
      const serviceClient = createServiceRoleClient();
      
      const { data: userChallengeData, error: ucError } = await serviceClient
        .from('user_challenges')
        .select('*')
        .eq('id', feedItem.user_challenge_id)
        .single();

      if (!ucError && userChallengeData) {
        userChallenge = {
          id: userChallengeData.id,
          userId: userChallengeData.user_id,
          challengeId: userChallengeData.challenge_id,
          status: userChallengeData.status,
          startedAt: userChallengeData.started_at,
          completedAt: userChallengeData.completed_at,
          failedAt: userChallengeData.failed_at,
          sessionData: userChallengeData.session_data,
          createdAt: userChallengeData.created_at,
        };

        // Get challenge data
        if (userChallengeData.challenge_id) {
          const { data: challengeData, error: challengeError } = await serviceClient
            .from('challenges')
            .select('*')
            .eq('id', userChallengeData.challenge_id)
            .single();

          if (!challengeError && challengeData) {
            challenge = {
              id: challengeData.id,
              type: challengeData.type,
              title: challengeData.title,
              description: challengeData.description,
              reward: challengeData.reward,
              durationMinutes: challengeData.duration_minutes,
              isActive: challengeData.is_active,
              createdAt: challengeData.created_at,
            };
          }
        }
      }
    }

    // Format response
    const formattedPost = {
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
        coins: userData.coins,
        streak: userData.streak,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        profilePhotoUrl: profilePhotoUrl || null,
      },
      userChallenge,
      challenge,
    };

    return res.json({
      post: formattedPost,
    });
  } catch (error: any) {
    console.error('Error fetching feed post:', error);
    return res.status(500).json({ 
        error: 'Error al obtener la publicación',
        details: error?.message || String(error)
      });
  }
});

// Migrated from app/api/feed/[id]/metadata/route.ts
router.get('/:id/metadata', async (req: Request, res: Response) => {
  const supabase = req.supabase!;

  try {
    const { id } = req.params;
    const feedItemId = parseInt(id);

    if (isNaN(feedItemId)) {
      return res.status(400).json({ error: 'ID de publicación inválido' });
    }

    // Use service role client to bypass RLS for public metadata
    const serviceClient = createServiceRoleClient();

    // Get the feed item
    const { data: feedItem, error: feedError } = await serviceClient
      .from('feed_items')
      .select('*')
      .eq('id', feedItemId)
      .single();

    if (feedError || !feedItem) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }

    // Get user profile
    const { data: userData, error: userError } = await serviceClient
      .from('users')
      .select('display_name, profile_photo_path')
      .eq('id', feedItem.user_id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Get challenge info if exists
    let challengeTitle = '';
    if (feedItem.user_challenge_id) {
      const { data: userChallenge } = await serviceClient
        .from('user_challenges')
        .select('challenge_id')
        .eq('id', feedItem.user_challenge_id)
        .single();

      if (userChallenge?.challenge_id) {
        const { data: challenge } = await serviceClient
          .from('challenges')
          .select('title')
          .eq('id', userChallenge.challenge_id)
          .single();

        if (challenge) {
          challengeTitle = challenge.title;
        }
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://calixo.app';
    const postUrl = `${baseUrl}/feed/${feedItemId}`;
    
    // Build title and description
    const title = challengeTitle 
      ? `${userData.display_name} completó: ${challengeTitle}`
      : `${userData.display_name} compartió una publicación`;
    
    const description = feedItem.note 
      ? feedItem.note.substring(0, 200)
      : `Mira esta publicación de ${userData.display_name} en Calixo`;

    // Get image URL
    let imageUrl = `${baseUrl}/icons/icon-512x512.png`;
    if (feedItem.image_url) {
      imageUrl = feedItem.image_url;
    }

    return res.json({
      title,
      description,
      image: imageUrl,
      url: postUrl,
      siteName: 'Calixo',
      type: 'article',
    });
  } catch (error: any) {
    console.error('Error fetching post metadata:', error);
    return res.status(500).json({ 
        error: 'Error al obtener metadata',
        details: error?.message || String(error)
      });
  }
});

// Migrated from app/api/feed/[id]/like/route.ts
router.get('/:id/like', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { id } = req.params;
    const feedItemId = parseInt(id);

    // Check if user has liked this post
    const { data: like, error: likeError } = await supabase
      .from('feed_likes')
      .select('id')
      .eq('feed_item_id', feedItemId)
      .eq('user_id', user.id)
      .single();

    return res.json({
      isLiked: !!like && !likeError,
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    return res.status(500).json({ error: 'Error al verificar like' });
  }
});

// Migrated from app/api/feed/[id]/like/route.ts
router.post('/:id/like', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { id } = req.params;
    const feedItemId = parseInt(id);

    // Get the feed item
    const { data: feedItem, error: feedError } = await supabase
      .from('feed_items')
      .select('*')
      .eq('id', feedItemId)
      .single();

    if (feedError || !feedItem) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Check if user already liked this post
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('feed_likes')
      .select('id')
      .eq('feed_item_id', feedItemId)
      .eq('user_id', user.id)
      .single();

    const isLiked = !!existingLike && !likeCheckError;
    let newLikesCount = feedItem.likes_count || 0;

    if (isLiked) {
      // Unlike: Remove like record
      const { error: deleteError } = await supabase
        .from('feed_likes')
        .delete()
        .eq('feed_item_id', feedItemId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      newLikesCount = Math.max(0, newLikesCount - 1);
    } else {
      // Like: Add like record
      const { error: insertError } = await supabase
        .from('feed_likes')
        .insert({
          feed_item_id: feedItemId,
          user_id: user.id,
        });

      if (insertError) {
        // If error is duplicate key, it's already liked
        if (insertError.code !== '23505') {
          throw insertError;
        }
      } else {
        newLikesCount = newLikesCount + 1;

        // Create notification for post owner (if not own post)
        if (feedItem.user_id !== user.id) {
          // Get liker display name
          const { data: likerData } = await supabase
            .from('users')
            .select('display_name')
            .eq('id', user.id)
            .single();

          await supabase.from('notifications').insert({
            user_id: feedItem.user_id,
            type: 'social',
            title: 'Nuevo like',
            message: `${likerData?.display_name || 'Alguien'} le dio like a tu publicación`,
            payload: {
              type: 'feed_like',
              feedItemId: feedItem.id,
              likerId: user.id,
            },
            seen: false,
          });
        }
      }
    }

    // Update likes count in feed_items
    const { error: updateError } = await supabase
      .from('feed_items')
      .update({ likes_count: newLikesCount })
      .eq('id', feedItemId);

    if (updateError) {
      console.error('Error updating likes count:', updateError);
      // Don't fail the request if count update fails
    }

    return res.json({
      success: true,
      isLiked: !isLiked,
      likesCount: newLikesCount,
    });
  } catch (error: any) {
    console.error('Error toggling like:', error);
    return res.status(500).json({ error: 'Error al dar like' });
  }
});

// Migrated from app/api/feed/[id]/comments/route.ts
router.get('/:id/comments', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { id } = req.params;
    const feedItemId = parseInt(id);

    // Get comments (excluir ocultos por moderación)
    const { data: comments, error: commentsError } = await supabase
      .from('feed_comments')
      .select('*')
      .eq('feed_item_id', feedItemId)
      .or('is_hidden.eq.false,is_hidden.is.null')
      .order('created_at', { ascending: false });

    if (commentsError) {
      throw commentsError;
    }

    // Get user info for each comment
    const userIds = [...new Set((comments || []).map((c: any) => c.user_id))];
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', userIds);

    const usersMap = new Map((users || []).map((u: any) => [u.id, u.display_name]));

    // Format comments
    const formattedComments = (comments || []).map((comment: any) => ({
      id: comment.id,
      comment: comment.comment,
      userId: comment.user_id,
      displayName: usersMap.get(comment.user_id) || 'Usuario',
      createdAt: comment.created_at,
    }));

    return res.json({
      comments: formattedComments,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});

// Migrated from app/api/feed/[id]/comments/route.ts
router.post('/:id/comments', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const { comment } = body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'El comentario no puede estar vacío' });
    }

    const { id } = req.params;
    const feedItemId = parseInt(id);

    // Get the feed item
    const { data: feedItem, error: feedError } = await supabase
      .from('feed_items')
      .select('*')
      .eq('id', feedItemId)
      .single();

    if (feedError || !feedItem) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Insert comment
    const { data: newComment, error: insertError } = await supabase
      .from('feed_comments')
      .insert({
        feed_item_id: feedItemId,
        user_id: user.id,
        comment: comment.trim(),
      })
      .select('*')
      .single();

    if (insertError) {
      throw insertError;
    }

    // Get user display name
    const { data: userData } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .single();

    // Update comments count
    const newCommentsCount = (feedItem.comments_count || 0) + 1;
    const { error: updateError } = await supabase
      .from('feed_items')
      .update({ comments_count: newCommentsCount })
      .eq('id', feedItemId);

    if (updateError) {
      console.error('Error updating comments count:', updateError);
      // Don't fail the request if count update fails
    }

    // Detect mentions in comment
    const mentionedUsernames = getMentionedUsernames(comment);
    const mentionedUserIds: string[] = [];

    if (mentionedUsernames.length > 0) {
      // Find users by display_name (case-insensitive)
      // Note: In a real app, you might want to use a username field instead
      const { data: mentionedUsers } = await supabase
        .from('users')
        .select('id, display_name')
        .in('display_name', mentionedUsernames.map(u => u.charAt(0).toUpperCase() + u.slice(1)));

      if (mentionedUsers) {
        mentionedUserIds.push(...mentionedUsers.map(u => u.id));
      }
    }

    // Create notification for post owner (if not own post and not mentioned)
    if (feedItem.user_id !== user.id && !mentionedUserIds.includes(feedItem.user_id)) {
      await supabase.from('notifications').insert({
        user_id: feedItem.user_id,
        type: 'social',
        title: 'Nuevo comentario',
        message: `${userData?.display_name || 'Alguien'} comentó en tu publicación`,
        payload: {
          type: 'feed_comment',
          feedItemId: feedItem.id,
          commenterId: user.id,
          comment: comment.substring(0, 100), // Preview
        },
        seen: false,
      });
    }

    // Create notifications for mentioned users
    for (const mentionedUserId of mentionedUserIds) {
      // Don't notify if it's the commenter or post owner (already notified above)
      if (mentionedUserId !== user.id && mentionedUserId !== feedItem.user_id) {
        await supabase.from('notifications').insert({
          user_id: mentionedUserId,
          type: 'social',
          title: 'Te mencionaron',
          message: `${userData?.display_name || 'Alguien'} te mencionó en un comentario`,
          payload: {
            type: 'feed_mention',
            feedItemId: feedItem.id,
            commentId: newComment.id,
            commenterId: user.id,
            comment: comment.substring(0, 100), // Preview
          },
          seen: false,
        });
      }
    }

    // Format the new comment
    const formattedComment = {
      id: newComment.id,
      comment: newComment.comment,
      userId: newComment.user_id,
      displayName: userData?.display_name || 'Usuario',
      createdAt: newComment.created_at,
    };

    return res.json({
      success: true,
      commentsCount: newCommentsCount,
      comment: formattedComment,
    });
  } catch (error) {
    console.error('Error commenting on post:', error);
    return res.status(500).json({ error: 'Error al comentar' });
  }
});

export default router;