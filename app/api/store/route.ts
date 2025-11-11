import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { storeItems, avatarCustomizations, profiles } from '@/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';

/**
 * GET /api/store
 * Get store items with filters
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const premiumOnly = searchParams.get('premiumOnly');
    const search = searchParams.get('search');

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

    // Build query conditions
    let whereConditions = [eq(storeItems.isActive, true)];

    if (category) {
      whereConditions.push(eq(storeItems.category, category));
    }

    if (premiumOnly === 'true') {
      whereConditions.push(eq(storeItems.premiumOnly, true));
    } else if (premiumOnly === 'false') {
      whereConditions.push(eq(storeItems.premiumOnly, false));
    }

    // Get all items
    let items = await db
      .select()
      .from(storeItems)
      .where(and(...whereConditions));

    // Apply price filters
    if (minPrice) {
      const min = parseInt(minPrice);
      items = items.filter(item => item.price >= min);
    }

    if (maxPrice) {
      const max = parseInt(maxPrice);
      items = items.filter(item => item.price <= max);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    }

    // Get user's owned items
    const ownedItems = await db
      .select()
      .from(avatarCustomizations)
      .where(eq(avatarCustomizations.userId, user.id));

    const ownedItemIds = new Set(ownedItems.map(item => item.itemId));

    // Add ownership status to items
    const itemsWithStatus = items.map(item => ({
      ...item,
      owned: ownedItemIds.has(item.itemId),
      canPurchase: !ownedItemIds.has(item.itemId) && 
                   profile.coins >= item.price &&
                   (!item.premiumOnly || profile.isPremium),
    }));

    // Sort items: unowned first, then by price
    itemsWithStatus.sort((a, b) => {
      if (a.owned !== b.owned) return a.owned ? 1 : -1;
      return a.price - b.price;
    });

    return NextResponse.json({
      items: itemsWithStatus,
      userCoins: profile.coins,
      isPremium: profile.isPremium,
      totalItems: itemsWithStatus.length,
      ownedCount: ownedItemIds.size,
    });
  } catch (error) {
    console.error('Error fetching store items:', error);
    return NextResponse.json(
      { error: 'Error al obtener items de la tienda' },
      { status: 500 }
    );
  }
}



