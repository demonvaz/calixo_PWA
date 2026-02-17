import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/profile/[userId]/following
 * Get list of users the specified user follows
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
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { userId } = await params;

    // Check if profile is private and we're not the owner
    const { data: profileUser, error: profileError } = await supabase
      .from('users')
      .select('is_private')
      .eq('id', userId)
      .single();

    if (profileError || !profileUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (profileUser.is_private && userId !== user.id) {
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

    const { searchParams } = new URL(request.url);
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
      return NextResponse.json(
        { error: 'Error al obtener siguiendo' },
        { status: 500 }
      );
    }

    const followingIds = (followingData || []).map((f) => f.following_id);

    if (followingIds.length === 0) {
      const { count: totalCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
      return NextResponse.json({ users: [], total: totalCount || 0, hasMore: false });
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
      return NextResponse.json(
        { error: 'Error al obtener usuarios' },
        { status: 500 }
      );
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
    return NextResponse.json({
      users,
      total: totalVal,
      hasMore: offset + users.length < totalVal,
    });
  } catch (error) {
    console.error('Error in following API:', error);
    return NextResponse.json(
      { error: 'Error al obtener siguiendo' },
      { status: 500 }
    );
  }
}
