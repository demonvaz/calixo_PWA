import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { avatarCustomizations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/avatar/equip
 * Equip or unequip an item
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
    const { itemId, equipped } = body;

    if (!itemId || equipped === undefined) {
      return NextResponse.json(
        { error: 'itemId y equipped son requeridos' },
        { status: 400 }
      );
    }

    // Get the customization
    const [customization] = await db
      .select()
      .from(avatarCustomizations)
      .where(and(
        eq(avatarCustomizations.userId, user.id),
        eq(avatarCustomizations.itemId, itemId)
      ))
      .limit(1);

    if (!customization) {
      return NextResponse.json(
        { error: 'No tienes este item desbloqueado' },
        { status: 404 }
      );
    }

    // If equipping, unequip other items in the same category
    if (equipped) {
      await db
        .update(avatarCustomizations)
        .set({ equipped: false })
        .where(and(
          eq(avatarCustomizations.userId, user.id),
          eq(avatarCustomizations.category, customization.category)
        ));
    }

    // Update the item
    await db
      .update(avatarCustomizations)
      .set({ equipped })
      .where(and(
        eq(avatarCustomizations.userId, user.id),
        eq(avatarCustomizations.itemId, itemId)
      ));

    return NextResponse.json({
      success: true,
      message: equipped ? 'Item equipado' : 'Item desequipado',
    });
  } catch (error) {
    console.error('Error equipping item:', error);
    return NextResponse.json(
      { error: 'Error al equipar item' },
      { status: 500 }
    );
  }
}



