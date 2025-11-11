import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { followers, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/follow
 * Follow/unfollow a user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId: targetUserId, action } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'No puedes seguirte a ti mismo' },
        { status: 400 }
      );
    }

    // Check if already following
    const [existing] = await db
      .select()
      .from(followers)
      .where(
        and(
          eq(followers.followerId, user.id),
          eq(followers.followingId, targetUserId)
        )
      )
      .limit(1);

    if (action === 'follow') {
      if (existing) {
        return NextResponse.json(
          { error: 'Ya sigues a este usuario' },
          { status: 400 }
        );
      }

      // Create follow relationship
      await db.insert(followers).values({
        followerId: user.id,
        followingId: targetUserId,
        followedAt: new Date(),
      });

      // Create notification
      await db.insert(notifications).values({
        userId: targetUserId,
        type: 'social',
        payload: {
          type: 'new_follower',
          followerId: user.id,
        },
        seen: false,
        createdAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: 'Ahora sigues a este usuario',
      });
    } else if (action === 'unfollow') {
      if (!existing) {
        return NextResponse.json(
          { error: 'No sigues a este usuario' },
          { status: 400 }
        );
      }

      // Remove follow relationship
      await db
        .delete(followers)
        .where(
          and(
            eq(followers.followerId, user.id),
            eq(followers.followingId, targetUserId)
          )
        );

      return NextResponse.json({
        success: true,
        message: 'Dejaste de seguir a este usuario',
      });
    } else {
      return NextResponse.json(
        { error: 'Acción inválida. Usa "follow" o "unfollow"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error following/unfollowing user:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}



