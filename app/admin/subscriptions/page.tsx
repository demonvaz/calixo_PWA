import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminStatCard } from '@/components/admin/admin-stat-card';
import { AdminEmpty } from '@/components/admin/admin-empty';

export default async function AdminSubscriptionsPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    redirect('/admin');
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/admin/subscriptions/stats`, {
    cache: 'no-store',
  });
  const stats = response.ok ? await response.json() : {};

  const supabase = createServiceRoleClient();
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false });

  const userIds = [...new Set((subscriptions || []).map((s) => s.user_id).filter(Boolean))];
  const userNames: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', userIds);
    (users || []).forEach((u) => {
      userNames[u.id] = u.display_name || u.id;
    });
  }

  const allSubscriptions = (subscriptions || []).map((sub) => ({
    id: sub.id,
    userId: sub.user_id,
    status: sub.status,
    plan: sub.plan,
    currentPeriodEnd: sub.current_period_end,
    createdAt: sub.created_at,
    displayName: userNames[sub.user_id] || sub.user_id,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Suscripciones" subtitle="Estadísticas y gestión Stripe" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <AdminStatCard label="Activas" value={stats.totalActive || 0} />
        <AdminStatCard label="Canceladas" value={stats.totalCanceled || 0} />
        <AdminStatCard label="MRR" value={`$${(stats.mrr || 0).toFixed(2)}`} />
        <AdminStatCard label="ARR" value={`$${(stats.arr || 0).toFixed(2)}`} />
      </div>

      <div className="rounded-2xl border border-neutral/10 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral/10">
          <h3 className="text-sm font-semibold text-text-dark">Todas las Suscripciones</h3>
        </div>
        {allSubscriptions.length === 0 ? (
          <AdminEmpty message="No hay Suscripciones" />
        ) : (
          <>
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-neutral/10 bg-neutral/5">
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Usuario</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Plan</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Estado</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Válido hasta</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Creada</th>
                  </tr>
                </thead>
                <tbody>
                  {allSubscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b border-neutral/10 hover:bg-neutral/5">
                      <td className="py-3 px-4 text-sm">{sub.displayName || sub.userId}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs">
                          {sub.plan === 'monthly' ? 'Mensual ($4.99)' : 'Anual ($49.99)'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {sub.status === 'active' ? (
                          <span className="px-2 py-0.5 rounded-lg bg-complementary-emerald/10 text-complementary-emerald text-xs">
                            Activa
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-neutral/10 text-neutral text-xs">
                            {sub.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral">
                        {sub.currentPeriodEnd
                          ? new Date(sub.currentPeriodEnd).toLocaleDateString('es-ES')
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral">
                        {new Date(sub.createdAt).toLocaleDateString('es-ES')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden divide-y divide-neutral/10">
              {allSubscriptions.map((sub) => (
                <div key={sub.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-text-dark text-sm">{sub.displayName || sub.userId}</span>
                    {sub.status === 'active' ? (
                      <span className="px-2 py-0.5 rounded-lg bg-complementary-emerald/10 text-complementary-emerald text-xs">
                        Activa
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-neutral/10 text-neutral text-xs">
                        {sub.status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral">
                    {sub.plan === 'monthly' ? 'Mensual' : 'Anual'} · Hasta {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString('es-ES') : '-'}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
