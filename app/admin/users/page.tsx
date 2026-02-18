import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/permissions';
import { UserTable } from '@/components/admin/user-table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

export default async function AdminUsersPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    redirect('/');
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Usuarios"
        subtitle="Gestiona Premium. El Premium permanece activo hasta que lo desactives."
      />
      <UserTable />
    </div>
  );
}

