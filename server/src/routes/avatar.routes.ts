import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';

// --- Helpers from app/api/avatar/route.ts ---
/**
 * GET /api/avatar
 * Get user's avatar customizations and available items
 */


/**
 * POST /api/avatar
 * Unlock a new item (requires purchase from store)
 */

// --- Helpers from app/api/avatar/equip/route.ts ---
/**
 * POST /api/avatar/equip
 * Equip or unequip an item
 */

const router = Router();

// Migrated from app/api/avatar/route.ts
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    // Get user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Get user's customizations
    const { data: customizations, error: customizationsError } = await supabase
      .from('avatar_customizations')
      .select('*')
      .eq('user_id', user.id);

    if (customizationsError) {
      throw customizationsError;
    }

    // Get all available store items
    const { data: items, error: itemsError } = await supabase
      .from('store_items')
      .select('*')
      .eq('is_active', true);

    if (itemsError) {
      throw itemsError;
    }

    // Calculate energy level
    const avatarEnergy = userData.avatar_energy || 100;
    const energyLevel = avatarEnergy >= 70
      ? 'alta'
      : avatarEnergy >= 40
      ? 'media'
      : 'baja';

    // Format customizations
    const formattedCustomizations = (customizations || []).map(c => ({
      id: c.id,
      userId: c.user_id,
      category: c.category,
      itemId: c.item_id,
      unlockedAt: c.unlocked_at,
      equipped: c.equipped,
    }));

    // Group customizations by category
    const customizationsByCategory = formattedCustomizations.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof formattedCustomizations>);

    // Get equipped items per category
    const equippedItems = formattedCustomizations
      .filter(c => c.equipped)
      .reduce((acc, item) => {
        acc[item.category] = item.itemId;
        return acc;
      }, {} as Record<string, string>);

    // Calculate unlocked categories
    const unlockedCategories = Object.keys(customizationsByCategory);

    // Format items
    const formattedItems = (items || []).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      itemId: item.item_id,
      price: item.price,
      premiumOnly: item.premium_only,
      imageUrl: item.image_url,
      description: item.description,
      isActive: item.is_active,
      createdAt: item.created_at,
    }));

    return res.json({
      profile: {
        avatarEnergy,
        energyLevel,
        coins: userData.coins,
        isPremium: userData.is_premium,
      },
      customizations: customizationsByCategory,
      equippedItems,
      unlockedCategories,
      availableItems: formattedItems,
    });
  } catch (error) {
    console.error('Error fetching avatar data:', error);
    return res.status(500).json({ error: 'Error al obtener datos del avatar' });
  }
});

// Migrated from app/api/avatar/route.ts
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const { itemId } = body;

    if (!itemId) {
      return res.status(400).json({ error: 'itemId es requerido' });
    }

    // Get the store item
    const { data: item, error: itemError } = await supabase
      .from('store_items')
      .select('*')
      .eq('item_id', itemId)
      .eq('is_active', true)
      .single();

    if (itemError || !item) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    // Check if user already has this item
    const { data: existing } = await supabase
      .from('avatar_customizations')
      .select('*')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Ya tienes este item' });
    }

    // Add to user's customizations (unlocked but not equipped)
    const { data: newCustomization, error: insertError } = await supabase
      .from('avatar_customizations')
      .insert({
        user_id: user.id,
        category: item.category,
        item_id: item.item_id,
        equipped: false,
      })
      .select()
      .single();

    if (insertError || !newCustomization) {
      throw insertError;
    }

    return res.json({
      success: true,
      customization: {
        id: newCustomization.id,
        userId: newCustomization.user_id,
        category: newCustomization.category,
        itemId: newCustomization.item_id,
        equipped: newCustomization.equipped,
        unlockedAt: newCustomization.unlocked_at,
      },
      item: {
        id: item.id,
        name: item.name,
        category: item.category,
        itemId: item.item_id,
        price: item.price,
        premiumOnly: item.premium_only,
        imageUrl: item.image_url,
        description: item.description,
        isActive: item.is_active,
        createdAt: item.created_at,
      },
    });
  } catch (error) {
    console.error('Error unlocking item:', error);
    return res.status(500).json({ error: 'Error al desbloquear item' });
  }
});

// Migrated from app/api/avatar/equip/route.ts
router.post('/equip', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const { itemId, equipped } = body;

    if (!itemId || equipped === undefined) {
      return res.status(400).json({ error: 'itemId y equipped son requeridos' });
    }

    // Get the customization
    const { data: customization, error: customError } = await supabase
      .from('avatar_customizations')
      .select('*')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .single();

    if (customError || !customization) {
      return res.status(404).json({ error: 'No tienes este item desbloqueado' });
    }

    // If equipping, unequip other items in the same category
    if (equipped) {
      await supabase
        .from('avatar_customizations')
        .update({ equipped: false })
        .eq('user_id', user.id)
        .eq('category', customization.category);
    }

    // Update the item
    const { error: updateError } = await supabase
      .from('avatar_customizations')
      .update({ equipped })
      .eq('user_id', user.id)
      .eq('item_id', itemId);

    if (updateError) {
      throw updateError;
    }

    return res.json({
      success: true,
      message: equipped ? 'Item equipado' : 'Item desequipado',
    });
  } catch (error) {
    console.error('Error equipping item:', error);
    return res.status(500).json({ error: 'Error al equipar item' });
  }
});

export default router;