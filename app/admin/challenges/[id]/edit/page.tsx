import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { ChallengeForm } from '@/components/admin/challenge-form';

export default async function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    redirect('/admin');
  }

  const { id } = await params;
  const challengeId = parseInt(id);
  if (isNaN(challengeId)) {
    notFound();
  }

  const supabase = createServiceRoleClient();
  const { data: challenge, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single();

  if (error || !challenge) {
    notFound();
  }

  const challengeForForm = {
    id: challenge.id,
    type: challenge.type,
    title: challenge.title,
    description: challenge.description,
    reward: challenge.reward,
    durationMinutes: challenge.duration_minutes,
    isActive: challenge.is_active,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-dark font-serif">Editar reto</h1>
          <p className="text-sm text-neutral mt-0.5">{challenge.title}</p>
        </div>
        <Link
          href="/admin/challenges"
          className="text-sm text-neutral hover:text-primary transition-colors shrink-0"
        >
          ← Volver a retos
        </Link>
      </div>
      <ChallengeForm challenge={challengeForForm} />
    </div>
  );
}
