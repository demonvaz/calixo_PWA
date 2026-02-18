import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

const couponSchema = z.object({
  code: z.string().min(1).max(50),
  discountPercent: z.number().int().min(1).max(100),
  partnerName: z.string().min(1, 'El nombre del partner es requerido').max(100),
  description: z.string().max(500).optional().nullable(),
  price: z.number().int().min(0, 'El precio debe ser 0 o mayor'),
  maxUses: z.number().int().min(1).optional().nullable(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/admin/coupons
 * List all coupons (admin only)
 */
export async function GET() {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const { data: allCoupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(allCoupons || []);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/coupons
 * Create a new coupon (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = couponSchema.parse(body);

    const supabase = createServiceRoleClient();
    const { data: newCoupon, error } = await supabase
      .from('coupons')
      .insert({
        code: validatedData.code.toUpperCase(),
        discount_percent: validatedData.discountPercent,
        partner_name: validatedData.partnerName,
        description: validatedData.description || null,
        price: validatedData.price,
        max_uses: validatedData.maxUses || null,
        valid_from: validatedData.validFrom ? validatedData.validFrom : new Date().toISOString(),
        valid_until: validatedData.validUntil,
        is_active: validatedData.isActive,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(newCoupon, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}
