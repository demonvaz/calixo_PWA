import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { CouponForm } from '@/components/admin/coupon-form';

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    redirect('/admin');
  }

  const { id } = await params;
  const couponId = parseInt(id);
  if (isNaN(couponId)) {
    notFound();
  }

  const supabase = createServiceRoleClient();
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('id', couponId)
    .single();

  if (error || !coupon) {
    notFound();
  }

  const couponForForm = {
    id: coupon.id,
    code: coupon.code,
    discountPercent: coupon.discount_percent,
    partnerName: coupon.partner_name || '',
    description: coupon.description || null,
    price: coupon.price ?? 0,
    maxUses: coupon.max_uses,
    validUntil: coupon.valid_until,
    isActive: coupon.is_active ?? true,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-dark font-serif">Editar cupón</h1>
          <p className="text-sm text-neutral mt-0.5">{coupon.code}</p>
        </div>
        <Link
          href="/admin/coupons"
          className="text-sm text-neutral hover:text-primary transition-colors shrink-0"
        >
          ← Volver a cupones
        </Link>
      </div>
      <CouponForm coupon={couponForForm} />
    </div>
  );
}
