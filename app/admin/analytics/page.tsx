import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/permissions';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminStatCard } from '@/components/admin/admin-stat-card';
import { AdminEmpty } from '@/components/admin/admin-empty';

export default async function AdminAnalyticsPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    redirect('/admin');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/analytics`, {
    cache: 'no-store',
  });
  const analytics = response.ok ? await response.json() : {};

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Analytics" subtitle="Métricas de uso" />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <AdminStatCard label="DAU" value={analytics.users?.dau || 0} />
        <AdminStatCard label="WAU" value={analytics.users?.wau || 0} />
        <AdminStatCard label="MAU" value={analytics.users?.mau || 0} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-neutral/10 bg-white shadow-sm p-4 sm:p-5">
          <p className="text-xs text-neutral">Monedas ganadas</p>
          <p className="text-xl font-bold text-complementary-emerald font-serif mt-1">
            {(analytics.coins?.earned || 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral/10 bg-white shadow-sm p-4 sm:p-5">
          <p className="text-xs text-neutral">Monedas gastadas</p>
          <p className="text-xl font-bold text-accent-red font-serif mt-1">
            {(analytics.coins?.spent || 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral/10 bg-white shadow-sm p-4 sm:p-5">
          <p className="text-xs text-neutral">Neto</p>
          <p className="text-xl font-bold text-text-dark font-serif mt-1">
            {(analytics.coins?.net || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral/10 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral/10">
          <h3 className="text-sm font-semibold text-text-dark">Cupones más comprados</h3>
        </div>
        {analytics.topItems && analytics.topItems.length > 0 ? (
          <div className="divide-y divide-neutral/10">
            {analytics.topItems.map((item: { code: string; partnerName: string; count: number }, index: number) => (
              <div
                key={item.code}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="font-medium text-text-dark">
                  #{index + 1} {item.partnerName} <span className="font-mono text-neutral">({item.code})</span>
                </span>
                <span className="text-neutral">{item.count} compras</span>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmpty message="No hay datos de compras" />
        )}
      </div>

      <div className="rounded-2xl border border-neutral/10 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral/10">
          <h3 className="text-sm font-semibold text-text-dark">Posts más populares</h3>
        </div>
        {analytics.topPosts && analytics.topPosts.length > 0 ? (
          <div className="divide-y divide-neutral/10">
            {analytics.topPosts.map((post: { id: number; likesCount?: number }, index: number) => (
              <div
                key={post.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="font-medium text-text-dark">#{index + 1} Post ID: {post.id}</span>
                <span className="text-complementary-emerald">{(post.likesCount ?? 0)} likes</span>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmpty message="No hay datos disponibles" />
        )}
      </div>
    </div>
  );
}
