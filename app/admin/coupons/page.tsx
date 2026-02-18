import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminEmpty } from '@/components/admin/admin-empty';

export default async function AdminCouponsPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    redirect('/admin');
  }

  const supabase = createServiceRoleClient();
  const { data: allCoupons } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: true });

  const coupons = allCoupons ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Cupones"
        subtitle="Crea y gestiona códigos de descuento"
        action={{ label: 'Crear cupón', href: '/admin/coupons/new' }}
      />

      <div className="rounded-xl border border-neutral/10 bg-white overflow-hidden">
        {coupons.length === 0 ? (
          <AdminEmpty message="No hay cupones. Crea el primero." />
        ) : (
          <>
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-neutral/10 bg-neutral/5">
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Código</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Partner</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Descuento</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Precio</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Usos</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Válido</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Estado</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-dark"></th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b border-neutral/10 hover:bg-neutral/5">
                      <td className="py-3 px-4 font-mono text-sm font-medium">{coupon.code}</td>
                      <td className="py-3 px-4 text-sm">{coupon.partner_name || '-'}</td>
                      <td className="py-3 px-4 text-sm">{coupon.discount_percent}%</td>
                      <td className="py-3 px-4 text-sm">{coupon.price ?? 0} monedas</td>
                      <td className="py-3 px-4 text-sm">
                        {coupon.max_uses
                          ? `${coupon.current_uses ?? 0}/${coupon.max_uses}`
                          : `${coupon.current_uses ?? 0} (∞)`}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral">
                        {new Date(coupon.valid_until).toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-3 px-4">
                        {coupon.is_active && new Date(coupon.valid_until) > new Date() ? (
                          <span className="px-2 py-0.5 rounded-lg bg-complementary-emerald/10 text-complementary-emerald text-xs">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-neutral/10 text-neutral text-xs">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/coupons/${coupon.id}/edit`}
                          className="text-sm text-primary hover:underline"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden divide-y divide-neutral/10">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-medium text-text-dark">{coupon.code}</span>
                    {coupon.is_active && new Date(coupon.valid_until) > new Date() ? (
                      <span className="px-2 py-0.5 rounded-lg bg-complementary-emerald/10 text-complementary-emerald text-xs">
                        Activo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-neutral/10 text-neutral text-xs">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral">{coupon.partner_name || '-'} · {coupon.discount_percent}%</p>
                  <p className="text-xs text-neutral">
                    {coupon.current_uses ?? 0}{coupon.max_uses ? `/${coupon.max_uses}` : ' (∞)'} usos · Válido hasta {new Date(coupon.valid_until).toLocaleDateString('es-ES')}
                  </p>
                  <Link
                    href={`/admin/coupons/${coupon.id}/edit`}
                    className="inline-block text-sm text-primary font-medium"
                  >
                    Editar
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
