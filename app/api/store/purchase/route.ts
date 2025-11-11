import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { storeItems, profiles, transactions, avatarCustomizations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/store/purchase
 * Purchase an item from the store
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
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId es requerido' },
        { status: 400 }
      );
    }

    // Get the store item
    const [item] = await db
      .select()
      .from(storeItems)
      .where(and(
        eq(storeItems.id, itemId),
        eq(storeItems.isActive, true)
      ))
      .limit(1);

    if (!item) {
      return NextResponse.json(
        { error: 'Item no encontrado' },
        { status: 404 }
      );
    }

    // Get user profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      );
    }

    // Check if user has enough coins
    if (profile.coins < item.price) {
      return NextResponse.json(
        { error: 'No tienes suficientes monedas' },
        { status: 400 }
      );
    }

    // Check premium requirement
    if (item.premiumOnly && !profile.isPremium) {
      return NextResponse.json(
        { error: 'Este item requiere cuenta Premium' },
        { status: 400 }
      );
    }

    // Check if user already has this item
    const existing = await db
      .select()
      .from(avatarCustomizations)
      .where(and(
        eq(avatarCustomizations.userId, user.id),
        eq(avatarCustomizations.itemId, item.itemId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Ya tienes este item' },
        { status: 400 }
      );
    }

    // Deduct coins
    const newCoins = profile.coins - item.price;
    await db
      .update(profiles)
      .set({
        coins: newCoins,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, user.id));

    // Create transaction record
    await db.insert(transactions).values({
      userId: user.id,
      amount: -item.price,
      type: 'spend',
      itemId: item.id,
      description: `Comprado: ${item.name}`,
      createdAt: new Date(),
    });

    // Unlock the item
    const [customization] = await db
      .insert(avatarCustomizations)
      .values({
        userId: user.id,
        category: item.category,
        itemId: item.itemId,
        equipped: false,
        unlockedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      newCoins,
      item,
      customization,
    });
  } catch (error) {
    console.error('Error purchasing item:', error);
    return NextResponse.json(
      { error: 'Error al comprar item' },
      { status: 500 }
    );
  }
}



