import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/permissions';
import { UserTable } from '@/components/admin/user-table';

export default async function AdminUsersPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    redirect('/');
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-text-dark font-serif mb-2">
          Gestión de Usuarios y Premium
        </h2>
        <p className="text-neutral">
          Administra usuarios y otorga o revoca el estado Premium. El Premium permanece activo hasta que lo desactives.
        </p>
      </div>
      <UserTable />
    </div>
  );
}

