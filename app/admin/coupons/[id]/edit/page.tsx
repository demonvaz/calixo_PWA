import { redirect, notFound } from 'next/navigation';
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
    maxUses: coupon.max_uses,
    validUntil: coupon.valid_until,
    isActive: coupon.is_active ?? true,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-dark-navy mb-2">Editar Cupón</h2>
        <p className="text-neutral-gray">
          Modifica los detalles del cupón: {coupon.code}
        </p>
      </div>
      <CouponForm coupon={couponForForm} />
    </div>
  );
}
