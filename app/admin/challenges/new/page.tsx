import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/permissions';
import { ChallengeForm } from '@/components/admin/challenge-form';

export default async function NewChallengePage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    redirect('/admin');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-dark font-serif">Crear reto</h1>
          <p className="text-sm text-neutral mt-0.5">Añade un reto al catálogo</p>
        </div>
        <Link
          href="/admin/challenges"
          className="text-sm text-neutral hover:text-primary transition-colors shrink-0"
        >
          ← Volver a retos
        </Link>
      </div>
      <ChallengeForm />
    </div>
  );
}

