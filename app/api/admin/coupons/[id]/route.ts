import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

const couponUpdateSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  discountPercent: z.number().int().min(1).max(100).optional(),
  partnerName: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  price: z.number().int().min(0).optional(),
  maxUses: z.number().int().min(1).optional().nullable(),
  validUntil: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PUT /api/admin/coupons/[id]
 * Update a coupon (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const couponId = parseInt(id);
    if (isNaN(couponId)) {
      return NextResponse.json({ error: 'Invalid coupon ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = couponUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (validatedData.code) updateData.code = validatedData.code.toUpperCase();
    if (validatedData.discountPercent !== undefined) updateData.discount_percent = validatedData.discountPercent;
    if (validatedData.partnerName !== undefined) updateData.partner_name = validatedData.partnerName;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.price !== undefined) updateData.price = validatedData.price;
    if (validatedData.maxUses !== undefined) updateData.max_uses = validatedData.maxUses;
    if (validatedData.validUntil) updateData.valid_until = validatedData.validUntil;
    if (validatedData.isActive !== undefined) updateData.is_active = validatedData.isActive;

    const supabase = createServiceRoleClient();
    const { data: updatedCoupon, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', couponId)
      .select()
      .single();

    if (error || !updatedCoupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json(updatedCoupon);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to update coupon' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/coupons/[id]
 * Delete/expire a coupon (admin only) - marks as inactive
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const couponId = parseInt(id);
    if (isNaN(couponId)) {
      return NextResponse.json({ error: 'Invalid coupon ID' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: false })
      .eq('id', couponId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { error: 'Failed to delete coupon' },
      { status: 500 }
    );
  }
}
