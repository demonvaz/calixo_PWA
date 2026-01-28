import { checkAdminPermissions } from '@/lib/permissions';
import { db } from '@/db';
import { challenges, userChallenges, users, profiles, feedItems, reports, subscriptions } from '@/db/schema';
import { count, eq, sql, and, gte } from 'drizzle-orm';
import { Card } from '@/components/ui/card';

export default async function AdminDashboard() {
  const permissions = await checkAdminPermissions();

  if (!permissions.isModerator) {
    return null;
  }

  // Get statistics
  const [
    totalChallenges,
    totalUsers,
    totalFeedPosts,
    pendingReports,
    activeSubscriptions,
    challengesCompletedToday,
  ] = await Promise.all([
    db.select({ count: count() }).from(challenges),
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(feedItems),
    db.select({ count: count() }).from(reports).where(eq(reports.status, 'pending')),
    db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.status, 'active')),
    db
      .select({ count: count() })
      .from(userChallenges)
      .where(
        and(
          eq(userChallenges.status, 'completed'),
          gte(userChallenges.completedAt, sql`CURRENT_DATE`)
        )
      ),
  ]);

  const stats = [
    {
      title: 'Retos Totales',
      value: totalChallenges[0]?.count || 0,
      icon: '',
      color: 'text-primary',
    },
    {
      title: 'Usuarios Totales',
      value: totalUsers[0]?.count || 0,
      icon: '',
      color: 'text-complementary-emerald',
    },
    {
      title: 'Posts en Feed',
      value: totalFeedPosts[0]?.count || 0,
      icon: '',
      color: 'text-accent-red',
    },
    {
      title: 'Reportes Pendientes',
      value: pendingReports[0]?.count || 0,
      icon: '',
      color: 'text-orange-500',
    },
    {
      title: 'Subscripciones Activas',
      value: activeSubscriptions[0]?.count || 0,
      icon: '💳',
      color: 'text-purple-500',
    },
    {
      title: 'Retos Completados Hoy',
      value: challengesCompletedToday[0]?.count || 0,
      icon: '✅',
      color: 'text-complementary-emerald',
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
              {pendingReports[0]?.count || 0} pendientes
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

