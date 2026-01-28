import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/permissions';
import { Card } from '@/components/ui/card';

export default async function AdminAnalyticsPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    redirect('/admin');
  }

  // Fetch analytics
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/analytics`, {
    cache: 'no-store',
  });
  const analytics = response.ok ? await response.json() : {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-dark-navy mb-2">Analytics Dashboard</h2>
        <p className="text-neutral-gray">
          Métricas y estadísticas de uso de Calixo
        </p>
      </div>

      {/* User Activity */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-dark-navy mb-4">Usuarios Activos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-neutral-gray mb-1">DAU (Usuarios Activos Diarios)</div>
            <div className="text-3xl font-bold text-dark-navy">
              {analytics.users?.dau || 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-neutral-gray mb-1">WAU (Usuarios Activos Semanales)</div>
            <div className="text-3xl font-bold text-dark-navy">
              {analytics.users?.wau || 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-neutral-gray mb-1">MAU (Usuarios Activos Mensuales)</div>
            <div className="text-3xl font-bold text-dark-navy">
              {analytics.users?.mau || 0}
            </div>
          </div>
        </div>
      </Card>

      {/* Coins Analytics */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-dark-navy mb-4">Monedas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-neutral-gray mb-1">Monedas Ganadas</div>
            <div className="text-3xl font-bold text-accent-green">
              {analytics.coins?.earned?.toLocaleString() || 0} monedas
            </div>
          </div>
          <div>
            <div className="text-sm text-neutral-gray mb-1">Monedas Gastadas</div>
            <div className="text-3xl font-bold text-accent-red">
              {analytics.coins?.spent?.toLocaleString() || 0} monedas
            </div>
          </div>
          <div>
            <div className="text-sm text-neutral-gray mb-1">Neto</div>
            <div className="text-3xl font-bold text-dark-navy">
              {analytics.coins?.net?.toLocaleString() || 0} monedas
            </div>
          </div>
        </div>
      </Card>

      {/* Top Items */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-dark-navy mb-4">Items Más Comprados</h3>
        {analytics.topItems && analytics.topItems.length > 0 ? (
          <div className="space-y-2">
            {analytics.topItems.map((item: any, index: number) => (
              <div
                key={item.itemId}
                className="flex items-center justify-between p-3 bg-neutral-gray/5 rounded-lg"
              >
                <span className="font-medium text-dark-navy">
                  #{index + 1} Item ID: {item.itemId}
                </span>
                <span className="text-neutral-gray">{item.count} compras</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-gray text-center py-4">No hay datos disponibles</p>
        )}
      </Card>

      {/* Top Posts */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-dark-navy mb-4">Posts Más Populares</h3>
        {analytics.topPosts && analytics.topPosts.length > 0 ? (
          <div className="space-y-2">
            {analytics.topPosts.map((post: any, index: number) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-3 bg-neutral-gray/5 rounded-lg"
              >
                <span className="font-medium text-dark-navy">
                  #{index + 1} Post ID: {post.id}
                </span>
                <span className="text-accent-green">{post.likesCount} likes</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-gray text-center py-4">No hay datos disponibles</p>
        )}
      </Card>
    </div>
  );
}

