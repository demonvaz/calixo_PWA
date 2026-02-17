import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-text-dark font-serif mb-2">Gestión de Cupones</h2>
          <p className="text-neutral">
            Crea y gestiona códigos de descuento
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/coupons/new">Crear Nuevo Cupón</Link>
        </Button>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {(!allCoupons || allCoupons.length === 0) ? (
            <p className="text-neutral text-center py-8">
              No hay cupones. Crea el primero.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral/20">
                    <th className="text-left py-3 px-4 font-medium text-text-dark font-serif">Código</th>
                    <th className="text-left py-3 px-4 font-medium text-text-dark font-serif">Descuento</th>
                    <th className="text-left py-3 px-4 font-medium text-text-dark font-serif">Usos</th>
                    <th className="text-left py-3 px-4 font-medium text-text-dark font-serif">Válido Hasta</th>
                    <th className="text-left py-3 px-4 font-medium text-text-dark font-serif">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-text-dark font-serif">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {allCoupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b border-neutral/10">
                      <td className="py-3 px-4 font-mono font-medium text-text-dark font-serif">
                        {coupon.code}
                      </td>
                      <td className="py-3 px-4">{coupon.discount_percent}%</td>
                      <td className="py-3 px-4">
                        {coupon.max_uses
                          ? `${coupon.current_uses ?? 0}/${coupon.max_uses}`
                          : `${coupon.current_uses ?? 0} (ilimitado)`}
                      </td>
                      <td className="py-3 px-4 text-neutral">
                        {new Date(coupon.valid_until).toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-3 px-4">
                        {coupon.is_active &&
                        new Date(coupon.valid_until) > new Date() ? (
                          <span className="px-2 py-1 bg-complementary-emerald/10 text-complementary-emerald rounded-lg text-sm">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-neutral-gray/10 text-neutral rounded-lg text-sm">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/coupons/${coupon.id}/edit`}
                          className="text-primary hover:underline text-sm"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
