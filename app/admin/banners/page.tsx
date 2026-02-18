import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminEmpty } from '@/components/admin/admin-empty';
import { BannersClient } from './banners-client';

export default async function AdminBannersPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    redirect('/admin');
  }

  const supabase = createServiceRoleClient();
  const { data: banners } = await supabase
    .from('feed_banners')
    .select('*')
    .order('sort_order', { ascending: true });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Banners del feed"
        subtitle="Frases e imágenes que aparecen cada 10 publicaciones (aleatorio)"
        action={{ label: 'Crear banner', href: '/admin/banners/new' }}
      />

      <div className="rounded-xl border border-neutral/10 bg-white overflow-hidden">
        {(!banners || banners.length === 0) ? (
          <AdminEmpty message="No hay banners. Crea el primero." />
        ) : (
          <BannersClient initialBanners={banners} />
        )}
      </div>
    </div>
  );
}
