import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { BannerForm } from '@/components/admin/banner-form';

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    redirect('/admin');
  }

  const { id } = await params;
  const bannerId = parseInt(id);
  if (isNaN(bannerId)) {
    notFound();
  }

  const supabase = createServiceRoleClient();
  const { data: banner, error } = await supabase
    .from('feed_banners')
    .select('*')
    .eq('id', bannerId)
    .single();

  if (error || !banner) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-dark font-serif">Editar banner</h1>
          <p className="text-sm text-neutral mt-0.5 line-clamp-1">{banner.phrase}</p>
        </div>
        <Link
          href="/admin/banners"
          className="text-sm text-neutral hover:text-primary transition-colors shrink-0"
        >
          ← Volver a banners
        </Link>
      </div>
      <div className="rounded-xl border border-neutral/10 bg-white p-4 sm:p-6">
        <BannerForm
          editing={{
            id: banner.id,
            phrase: banner.phrase,
            image_url: banner.image_url,
            sort_order: banner.sort_order,
            is_active: banner.is_active,
          }}
          onSuccess={() => {}}
        />
      </div>
    </div>
  );
}
