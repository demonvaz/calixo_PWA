import { redirect } from 'next/navigation';
import { checkAdminPermissions } from '@/lib/permissions';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { ModeToggle } from '@/components/admin/mode-toggle';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const permissions = await checkAdminPermissions();

  if (!permissions.isModerator) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar role={permissions.role!} />

        {/* Main Content */}
        <div className="flex-1 lg:ml-64 min-h-screen">
          {/* Top Bar */}
          <div className="bg-white border-b border-neutral/20 px-4 md:px-6 py-4 flex items-center justify-between pt-14 lg:pt-4">
            <h1 className="text-xl md:text-2xl font-bold text-text-dark font-serif">Panel de Administración</h1>
            <ModeToggle currentRole={permissions.role!} />
          </div>

          {/* Page Content */}
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

