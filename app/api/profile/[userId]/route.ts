import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/profile/[userId]
 * Get public profile data for a specific user
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

    // Get user profile
    const { data: profileUser, error: profileError } = await supabase
      .from('users')
      .select('*')
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
        .select('id')
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
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .single();

    const isFollowing = !!followData;

    return NextResponse.json({
      profile: {
        userId: profileUser.id,
        displayName: profileUser.display_name,
        avatarEnergy: profileUser.avatar_energy,
        isPrivate: profileUser.is_private,
        isPremium: profileUser.is_premium,
        streak: profileUser.streak,
        coins: profileUser.coins,
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
    return NextResponse.json(
      { 
        error: 'Error al obtener el perfil del usuario',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
