import { redirect, notFound } from 'next/navigation';
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
      <div>
        <h2 className="text-3xl font-bold text-dark-navy mb-2">Editar Reto</h2>
        <p className="text-neutral-gray">
          Modifica los detalles del reto: {challenge.title}
        </p>
      </div>
      <ChallengeForm challenge={challengeForForm} />
    </div>
  );
}
