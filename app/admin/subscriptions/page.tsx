import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';

export default async function AdminSubscriptionsPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    redirect('/admin');
  }

  // Fetch stats
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/admin/subscriptions/stats`, {
    cache: 'no-store',
  });
  const stats = response.ok ? await response.json() : {};

  // Fetch all subscriptions with user display_name
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
    currentPeriodStart: sub.current_period_start,
    currentPeriodEnd: sub.current_period_end,
    createdAt: sub.created_at,
    displayName: userNames[sub.user_id] || sub.user_id,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-dark-navy mb-2">Dashboard de Subscripciones</h2>
        <p className="text-neutral-gray">
          Estadísticas y gestión de subscripciones Stripe
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="text-sm text-neutral-gray mb-1">Subscripciones Activas</div>
          <div className="text-3xl font-bold text-dark-navy">{stats.totalActive || 0}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-neutral-gray mb-1">Canceladas</div>
          <div className="text-3xl font-bold text-dark-navy">{stats.totalCanceled || 0}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-neutral-gray mb-1">MRR (Ingresos Mensuales)</div>
          <div className="text-3xl font-bold text-dark-navy">
            ${(stats.mrr || 0).toFixed(2)}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-neutral-gray mb-1">ARR (Ingresos Anuales)</div>
          <div className="text-3xl font-bold text-dark-navy">
            ${(stats.arr || 0).toFixed(2)}
          </div>
        </Card>
      </div>

      {/* Subscriptions List */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-dark-navy mb-4">Todas las Subscripciones</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-gray/20">
                <th className="text-left py-3 px-4 font-medium text-dark-navy">Usuario</th>
                <th className="text-left py-3 px-4 font-medium text-dark-navy">Plan</th>
                <th className="text-left py-3 px-4 font-medium text-dark-navy">Estado</th>
                <th className="text-left py-3 px-4 font-medium text-dark-navy">Válido Hasta</th>
                <th className="text-left py-3 px-4 font-medium text-dark-navy">Creada</th>
              </tr>
            </thead>
            <tbody>
              {allSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-neutral-gray">
                    No hay subscripciones
                  </td>
                </tr>
              ) : (
                allSubscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-neutral-gray/10">
                    <td className="py-3 px-4">{sub.displayName || sub.userId}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-soft-blue/10 text-soft-blue rounded-lg text-sm">
                        {sub.plan === 'monthly' ? 'Mensual ($4.99)' : 'Anual ($49.99)'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {sub.status === 'active' ? (
                        <span className="px-2 py-1 bg-accent-green/10 text-accent-green rounded-lg text-sm">
                          Activa
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-neutral-gray/10 text-neutral-gray rounded-lg text-sm">
                          {sub.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-gray">
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString('es-ES')
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-neutral-gray">
                      {new Date(sub.createdAt).toLocaleDateString('es-ES')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
