import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { avatarCustomizations, profiles, storeItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/avatar
 * Get user's avatar customizations and available items
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

    // Get user's customizations
    const customizations = await db
      .select()
      .from(avatarCustomizations)
      .where(eq(avatarCustomizations.userId, user.id));

    // Get all available store items
    const items = await db
      .select()
      .from(storeItems)
      .where(eq(storeItems.isActive, true));

    // Calculate energy level
    const energyLevel = profile.avatarEnergy >= 70
      ? 'alta'
      : profile.avatarEnergy >= 40
      ? 'media'
      : 'baja';

    // Group customizations by category
    const customizationsByCategory = customizations.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof customizations>);

    // Get equipped items per category
    const equippedItems = customizations
      .filter(c => c.equipped)
      .reduce((acc, item) => {
        acc[item.category] = item.itemId;
        return acc;
      }, {} as Record<string, string>);

    // Calculate unlocked categories
    const unlockedCategories = Object.keys(customizationsByCategory);

    return NextResponse.json({
      profile: {
        avatarEnergy: profile.avatarEnergy,
        energyLevel,
        coins: profile.coins,
        isPremium: profile.isPremium,
      },
      customizations: customizationsByCategory,
      equippedItems,
      unlockedCategories,
      availableItems: items,
    });
  } catch (error) {
    console.error('Error fetching avatar data:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del avatar' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/avatar
 * Unlock a new item (requires purchase from store)
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
        eq(storeItems.itemId, itemId),
        eq(storeItems.isActive, true)
      ))
      .limit(1);

    if (!item) {
      return NextResponse.json(
        { error: 'Item no encontrado' },
        { status: 404 }
      );
    }

    // Check if user already has this item
    const existing = await db
      .select()
      .from(avatarCustomizations)
      .where(and(
        eq(avatarCustomizations.userId, user.id),
        eq(avatarCustomizations.itemId, itemId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Ya tienes este item' },
        { status: 400 }
      );
    }

    // Add to user's customizations (unlocked but not equipped)
    const [newCustomization] = await db
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
      customization: newCustomization,
      item,
    });
  } catch (error) {
    console.error('Error unlocking item:', error);
    return NextResponse.json(
      { error: 'Error al desbloquear item' },
      { status: 500 }
    );
  }
}



