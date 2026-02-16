import { checkAdminPermissions } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';

export default async function AdminDashboard() {
  const permissions = await checkAdminPermissions();

  if (!permissions.isModerator) {
    return null;
  }

  const supabase = createServiceRoleClient();

  // Obtener estadísticas con Supabase
  const [usersRes, premiumRes, challengesRes, feedRes, reportsRes, subsRes] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_premium', true),
    supabase.from('challenges').select('*', { count: 'exact', head: true }),
    supabase.from('feed_items').select('*', { count: 'exact', head: true }),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  const totalUsers = usersRes.count ?? 0;
  const premiumUsers = premiumRes.count ?? 0;
  const totalChallenges = challengesRes.count ?? 0;
  const totalFeedPosts = feedRes.count ?? 0;
  const pendingReports = reportsRes.count ?? 0;
  const activeSubscriptions = subsRes.count ?? 0;

  const stats = [
    {
      title: 'Usuarios Totales',
      value: totalUsers,
      icon: '👥',
      color: 'text-complementary-emerald',
    },
    {
      title: 'Usuarios Premium',
      value: premiumUsers,
      icon: '⭐',
      color: 'text-primary',
    },
    {
      title: 'Retos Totales',
      value: totalChallenges,
      icon: '🎯',
      color: 'text-primary',
    },
    {
      title: 'Posts en Feed',
      value: totalFeedPosts,
      icon: '📝',
      color: 'text-accent-red',
    },
    {
      title: 'Reportes Pendientes',
      value: pendingReports,
      icon: '⚠️',
      color: 'text-orange-500',
    },
    {
      title: 'Subscripciones Activas',
      value: activeSubscriptions,
      icon: '💳',
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-text-dark font-serif mb-2">
          Dashboard de Administración
        </h2>
        <p className="text-neutral">
          Bienvenido al panel de administración de Calixo
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-text-dark font-serif">{stat.value}</p>
              </div>
              <div className={`text-4xl ${stat.color}`}>{stat.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-text-dark font-serif mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {permissions.isAdmin && (
            <>
              <a
                href="/admin/challenges"
                className="p-4 border border-neutral/20 rounded-xl hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="font-medium text-text-dark font-serif">Crear Reto</div>
                <div className="text-sm text-neutral">Añadir nuevo reto al catálogo</div>
              </a>
              <a
                href="/admin/coupons"
                className="p-4 border border-neutral/20 rounded-xl hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="text-2xl mb-2">🎫</div>
                <div className="font-medium text-text-dark font-serif">Crear Cupón</div>
                <div className="text-sm text-neutral">Generar código de descuento</div>
              </a>
            </>
          )}
          <a
            href="/admin/moderation"
            className="p-4 border border-neutral/20 rounded-xl hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <div className="font-medium text-text-dark font-serif">Revisar Reportes</div>
            <div className="text-sm text-neutral">
              {pendingReports} pendientes
            </div>
          </a>
          <a
            href="/admin/users"
            className="p-4 border border-neutral/20 rounded-xl hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <div className="font-medium text-text-dark font-serif">Gestionar Usuarios</div>
            <div className="text-sm text-neutral">Ver y administrar usuarios</div>
          </a>
        </div>
      </Card>
    </div>
  );
}

