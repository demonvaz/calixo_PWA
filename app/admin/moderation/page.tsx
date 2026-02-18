import { redirect } from 'next/navigation';
import { requireModerator } from '@/lib/permissions';
import { ModerationQueue } from '@/components/admin/moderation-queue';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

export default async function AdminModerationPage() {
  const isModerator = await requireModerator();
  if (!isModerator) {
    redirect('/admin');
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Moderación" subtitle="Revisa y resuelve reportes de contenido" />
      <ModerationQueue />
    </div>
  );
}

