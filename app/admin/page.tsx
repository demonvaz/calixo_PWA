import Link from 'next/link';
import { checkAdminPermissions } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminStatCard } from '@/components/admin/admin-stat-card';

export default async function AdminDashboard() {
  const permissions = await checkAdminPermissions();

  if (!permissions.isModerator) {
    return null;
  }

  const supabase = createServiceRoleClient();

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
    { label: 'Usuarios', value: totalUsers, icon: '👥' },
    { label: 'Premium', value: premiumUsers, icon: '⭐' },
    { label: 'Retos', value: totalChallenges, icon: '🎯' },
    { label: 'Posts', value: totalFeedPosts, icon: '📝' },
    { label: 'Reportes pendientes', value: pendingReports, icon: '⚠️' },
    { label: 'Subscripciones activas', value: activeSubscriptions, icon: '💳' },
  ];

  const quickLinks = [
    ...(permissions.isAdmin ? [
      { href: '/admin/challenges/new', label: 'Crear reto' },
      { href: '/admin/coupons/new', label: 'Crear cupón' },
    ] : []),
    { href: '/admin/moderation', label: 'Moderación', badge: pendingReports },
    { href: '/admin/users', label: 'Usuarios' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-dark font-serif">Dashboard</h1>
        <p className="text-sm text-neutral mt-0.5">Resumen del panel</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((s) => (
          <AdminStatCard key={s.label} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral/10 bg-white hover:border-primary hover:bg-primary/5 transition-colors text-sm font-medium text-text-dark"
          >
            {link.label}
            {link.badge != null && link.badge > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary text-white text-xs">
                {link.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
