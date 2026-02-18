import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/profile/[userId]/feed
 * Get feed posts for a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if the profile user exists and is accessible
    const { data: profileUser, error: profileError } = await supabase
      .from('users')
      .select('id, is_private')
      .eq('id', userId)
      .single();

    if (profileError || !profileUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
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
        return NextResponse.json(
          { error: 'Este perfil es privado' },
          { status: 403 }
        );
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
      return NextResponse.json({
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
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
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

    return NextResponse.json({
      feedItems: formattedResults,
      hasMore,
      total: offset === 0 ? total : undefined,
    });
  } catch (error: any) {
    console.error('Error fetching user feed:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener las publicaciones del usuario',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
