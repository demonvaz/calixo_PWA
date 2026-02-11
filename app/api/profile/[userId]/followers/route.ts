import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/profile/[userId]/followers
 * Get list of users who follow the specified user
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

    const { searchParams } = new URL(request.url);
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
      return NextResponse.json(
        { error: 'Error al obtener seguidores' },
        { status: 500 }
      );
    }

    const followerIds = (followersData || []).map((f) => f.follower_id);

    if (followerIds.length === 0) {
      const { count: totalCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);
      return NextResponse.json({ users: [], total: totalCount || 0, hasMore: false });
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
    console.error('Error in followers API:', error);
    return NextResponse.json(
      { error: 'Error al obtener seguidores' },
      { status: 500 }
    );
  }
}
