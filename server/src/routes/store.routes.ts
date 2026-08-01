import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';

// --- Helpers from app/api/store/route.ts ---
/**
 * GET /api/store
 * Obtener cupones disponibles en la tienda
 */

// --- Helpers from app/api/store/purchased/route.ts ---
/**
 * GET /api/store/purchased
 * Obtener todos los cupones comprados por el usuario
 */

// --- Helpers from app/api/store/purchase/route.ts ---
/**
 * POST /api/store/purchase
 * Comprar un cupón de la tienda
 */

// --- Helpers from app/api/store/coupons/route.ts ---
/**
 * GET /api/store/coupons
 * Obtener todos los códigos de descuento activos disponibles
 */

// --- Helpers from app/api/store/coupons/validate/route.ts ---
/**
 * POST /api/store/coupons/validate
 * Validar un código de descuento
 */

const router = Router();

// Migrated from app/api/store/route.ts
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    // Get query parameters
    const searchParams = new URLSearchParams(req.query as any);
    const search = searchParams.get('search');
    const partnerName = searchParams.get('partnerName');

    // Obtener usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener cupones activos y válidos
    // No filtrar por agotado aquí, lo haremos después para mostrar visualmente
    let query = supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .gt('valid_until', new Date().toISOString())
      .order('partner_name', { ascending: true });

    if (partnerName) {
      query = query.ilike('partner_name', `%${partnerName}%`);
    }

    const { data: coupons, error: couponsError } = await query;

    if (couponsError) {
      throw couponsError;
    }

    // Aplicar filtro de búsqueda
    let filteredCoupons = coupons || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCoupons = filteredCoupons.filter(coupon =>
        coupon.code?.toLowerCase().includes(searchLower) ||
        coupon.partner_name?.toLowerCase().includes(searchLower) ||
        coupon.description?.toLowerCase().includes(searchLower)
      );
    }

    // Obtener cupones comprados por el usuario
    const { data: purchasedCoupons } = await supabase
      .from('user_coupons')
      .select('coupon_id')
      .eq('user_id', user.id);

    const purchasedCouponIds = new Set((purchasedCoupons || []).map(pc => pc.coupon_id));

    // Agregar estado de propiedad a los cupones
    const couponsWithStatus = filteredCoupons.map(coupon => {
      // Verificar si está agotado (si tiene max_uses y current_uses >= max_uses)
      const isOutOfStock = coupon.max_uses !== null && coupon.max_uses > 0 && 
                          coupon.current_uses >= coupon.max_uses;
      
      return {
        id: coupon.id,
        code: coupon.code,
        discountPercent: coupon.discount_percent,
        partnerName: coupon.partner_name,
        description: coupon.description,
        price: coupon.price,
        validUntil: coupon.valid_until,
        brandImage: coupon.brand_image || null,
        maxUses: coupon.max_uses,
        currentUses: coupon.current_uses || 0,
        isActive: coupon.is_active,
        createdAt: coupon.created_at,
        owned: purchasedCouponIds.has(coupon.id),
        isOutOfStock: isOutOfStock,
        canPurchase: !purchasedCouponIds.has(coupon.id) &&
                     userData.coins >= coupon.price &&
                     !isOutOfStock,
      };
    });

    // Ordenar: no comprados primero, luego por precio
    couponsWithStatus.sort((a, b) => {
      if (a.owned !== b.owned) return a.owned ? 1 : -1;
      return a.price - b.price;
    });

    return res.json({
      items: couponsWithStatus,
      userCoins: userData.coins,
      isPremium: userData.is_premium,
      totalItems: couponsWithStatus.length,
      ownedCount: purchasedCouponIds.size,
    });
  } catch (error) {
    console.error('Error fetching store coupons:', error);
    return res.status(500).json({ error: 'Error al obtener cupones de la tienda' });
  }
});

// Migrated from app/api/store/purchased/route.ts
router.get('/purchased', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    // Obtener cupones comprados por el usuario
    const { data: userCoupons, error: userCouponsError } = await supabase
      .from('user_coupons')
      .select(`
        *,
        coupons:coupons(*)
      `)
      .eq('user_id', user.id)
      .order('purchased_at', { ascending: false });

    if (userCouponsError) {
      throw userCouponsError;
    }

    // Obtener transacciones relacionadas para obtener información adicional
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, amount, description, created_at, coupon_code')
      .eq('user_id', user.id)
      .eq('type', 'spend')
      .not('coupon_code', 'is', null)
      .order('created_at', { ascending: false });

    if (transactionsError) {
      throw transactionsError;
    }

    // Crear un mapa de coupon_code -> transacción
    const transactionMap = new Map();
    (transactions || []).forEach(t => {
      if (t.coupon_code) {
        transactionMap.set(t.coupon_code, t);
      }
    });

    // Combinar información
    const purchasedCoupons = (userCoupons || []).map(userCoupon => {
      const coupon = userCoupon.coupons;
      const transaction = transactionMap.get(coupon?.code);

      return {
        purchase: {
          id: userCoupon.id,
          purchasedAt: userCoupon.purchased_at,
        },
        coupon: coupon ? {
          id: coupon.id,
          code: coupon.code,
          discountPercent: coupon.discount_percent,
          partnerName: coupon.partner_name,
          description: coupon.description,
          price: coupon.price,
          validUntil: coupon.valid_until,
          brandImage: coupon.brand_image || null,
        } : null,
        transaction: transaction ? {
          id: transaction.id,
          amount: transaction.amount,
          description: transaction.description,
          createdAt: transaction.created_at,
        } : null,
      };
    });

    return res.json({
      items: purchasedCoupons,
      total: purchasedCoupons.length,
    });
  } catch (error) {
    console.error('Error fetching purchased coupons:', error);
    return res.status(500).json({ error: 'Error al obtener cupones comprados' });
  }
});

// Migrated from app/api/store/purchase/route.ts
router.post('/purchase', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const { couponId } = body;

    if (!couponId) {
      return res.status(400).json({ error: 'couponId es requerido' });
    }

    // Obtener el cupón
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .eq('is_active', true)
      .single();

    if (couponError || !coupon) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }

    // Verificar que el cupón no haya expirado
    const now = new Date();
    const validUntil = new Date(coupon.valid_until);
    if (validUntil < now) {
      return res.status(400).json({ error: 'Este cupón ha expirado' });
    }

    // Obtener usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar si el usuario ya tiene este cupón
    const { data: existingPurchase } = await supabase
      .from('user_coupons')
      .select('*')
      .eq('user_id', user.id)
      .eq('coupon_id', couponId)
      .single();

    if (existingPurchase) {
      return res.status(400).json({ error: 'Ya tienes este cupón' });
    }

    // Verificar que el usuario tenga suficientes monedas
    if (userData.coins < coupon.price) {
      return res.status(400).json({ error: 'No tienes suficientes monedas' });
    }

    // Deduct coins
    const newCoins = userData.coins - coupon.price;
    const { error: updateError } = await supabase
      .from('users')
      .update({
        coins: newCoins,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // Crear registro de transacción
    await supabase.from('transactions').insert({
      user_id: user.id,
      amount: -coupon.price,
      type: 'spend',
      description: `Comprado cupón: ${coupon.code} - ${coupon.partner_name}`,
      coupon_code: coupon.code,
    });

    // Registrar la compra del cupón
    const { data: userCoupon, error: userCouponError } = await supabase
      .from('user_coupons')
      .insert({
        user_id: user.id,
        coupon_id: coupon.id,
      })
      .select()
      .single();

    if (userCouponError || !userCoupon) {
      throw userCouponError;
    }

    return res.json({
      success: true,
      newCoins,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountPercent: coupon.discount_percent,
        partnerName: coupon.partner_name,
        description: coupon.description,
        price: coupon.price,
        validUntil: coupon.valid_until,
      },
      purchase: {
        id: userCoupon.id,
        purchasedAt: userCoupon.purchased_at,
      },
    });
  } catch (error) {
    console.error('Error purchasing coupon:', error);
    return res.status(500).json({ error: 'Error al comprar cupón' });
  }
});

// Migrated from app/api/store/coupons/route.ts
router.get('/coupons', async (req: Request, res: Response) => {
  const supabase = req.supabase!;

  try {
    
    // Obtener todos los cupones activos y válidos
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('id, code, discount_percent, partner_name, description, valid_until')
      .eq('is_active', true)
      .gt('valid_until', new Date().toISOString())
      .order('partner_name', { ascending: true });

    if (error) {
      throw error;
    }

    return res.json({
      coupons: coupons || [],
      total: coupons?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return res.status(500).json({ error: 'Error al obtener códigos de descuento' });
  }
});

// Migrated from app/api/store/coupons/validate/route.ts
router.post('/coupons/validate', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Código de descuento requerido' });
    }

    // Buscar el cupón
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single();

    if (couponError || !coupon) {
      return res.status(404).json({ error: 'Código de descuento no válido o expirado' });
    }

    // Verificar que el cupón no haya expirado
    const now = new Date();
    const validUntil = new Date(coupon.valid_until);
    
    if (validUntil < now) {
      return res.status(400).json({ error: 'Este código de descuento ha expirado' });
    }

    // Verificar límite de usos si existe
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return res.status(400).json({ error: 'Este código de descuento ha alcanzado su límite de usos' });
    }

    return res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountPercent: coupon.discount_percent,
        partnerName: coupon.partner_name,
        description: coupon.description,
      },
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return res.status(500).json({ error: 'Error al validar código de descuento' });
  }
});

export default router;