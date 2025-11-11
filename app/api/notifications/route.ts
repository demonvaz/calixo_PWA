import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/notifications
 * Get user notifications
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unseenOnly = searchParams.get('unseenOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get notifications
    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    const results = await query;

    // Filter unseen if requested
    const filteredResults = unseenOnly 
      ? results.filter(n => !n.seen)
      : results;

    // Count unseen
    const unseenCount = results.filter(n => !n.seen).length;

    return NextResponse.json({
      notifications: filteredResults,
      unseenCount,
      total: results.length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Create a test notification (for development)
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
    const { type, payload } = body;

    if (!type || !payload) {
      return NextResponse.json(
        { error: 'type y payload son requeridos' },
        { status: 400 }
      );
    }

    // Create notification
    const [notification] = await db
      .insert(notifications)
      .values({
        userId: user.id,
        type,
        payload,
        seen: false,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Error al crear notificación' },
      { status: 500 }
    );
  }
}



