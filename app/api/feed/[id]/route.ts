import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/feed/[id]
 * Get a single feed post by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const feedItemId = parseInt(id);

    if (isNaN(feedItemId)) {
      return NextResponse.json(
        { error: 'ID de publicación inválido' },
        { status: 400 }
      );
    }

    // Get the feed item
    const { data: feedItem, error: feedError } = await supabase
      .from('feed_items')
      .select('*')
      .eq('id', feedItemId)
      .single();

    if (feedError || !feedItem) {
      return NextResponse.json(
        { error: 'Publicación no encontrada' },
        { status: 404 }
      );
    }

    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', feedItem.user_id)
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

    return NextResponse.json({
      post: formattedPost,
    });
  } catch (error: any) {
    console.error('Error fetching feed post:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener la publicación',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
