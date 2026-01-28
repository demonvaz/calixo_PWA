import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/store/purchased
 * Obtener todos los cupones comprados por el usuario
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

    return NextResponse.json({
      items: purchasedCoupons,
      total: purchasedCoupons.length,
    });
  } catch (error) {
    console.error('Error fetching purchased coupons:', error);
    return NextResponse.json(
      { error: 'Error al obtener cupones comprados' },
      { status: 500 }
    );
  }
}
