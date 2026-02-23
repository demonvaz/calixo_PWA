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
    <div className="min-h-screen bg-neutral/5">
      <AdminSidebar role={permissions.role!} />
      <div className="lg:ml-56 min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-neutral/10 shadow-sm px-4 sm:px-6 py-3 flex items-center justify-end pt-14 lg:pt-3">
          <ModeToggle currentRole={permissions.role!} />
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

