import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/permissions';
import { BannerForm } from '@/components/admin/banner-form';

export default async function NewBannerPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    redirect('/admin');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-dark font-serif">Crear banner</h1>
          <p className="text-sm text-neutral mt-0.5">Frase e imagen para el feed</p>
        </div>
        <Link
          href="/admin/banners"
          className="text-sm text-neutral hover:text-primary transition-colors shrink-0"
        >
          ← Volver a banners
        </Link>
      </div>
      <div className="rounded-xl border border-neutral/10 bg-white p-4 sm:p-6">
        <BannerForm onSuccess={() => {}} />
      </div>
    </div>
  );
}
