import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/permissions';
import { ConfigForm } from '@/components/admin/config-form';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

export default async function AdminConfigPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    redirect('/admin');
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Configuración" subtitle="Parámetros globales de Calixo" />
      <ConfigForm />
    </div>
  );
}

