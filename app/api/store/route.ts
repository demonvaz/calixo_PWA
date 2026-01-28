import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/store
 * Obtener cupones disponibles en la tienda
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const partnerName = searchParams.get('partnerName');

    // Obtener usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
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

    return NextResponse.json({
      items: couponsWithStatus,
      userCoins: userData.coins,
      isPremium: userData.is_premium,
      totalItems: couponsWithStatus.length,
      ownedCount: purchasedCouponIds.size,
    });
  } catch (error) {
    console.error('Error fetching store coupons:', error);
    return NextResponse.json(
      { error: 'Error al obtener cupones de la tienda' },
      { status: 500 }
    );
  }
}
