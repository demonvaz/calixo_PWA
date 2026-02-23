import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminEmpty } from '@/components/admin/admin-empty';

export default async function AdminChallengesPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    redirect('/admin');
  }

  const supabase = createServiceRoleClient();
  const { data: allChallenges } = await supabase
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: true });

  const challenges = allChallenges ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Retos"
        subtitle="Crea, edita y gestiona el catálogo"
        action={{ label: 'Crear reto', href: '/admin/challenges/new' }}
      />

      <div className="rounded-2xl border border-neutral/10 bg-white shadow-sm overflow-hidden">
        {challenges.length === 0 ? (
          <AdminEmpty message="No hay retos. Crea el primero." />
        ) : (
          <>
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-neutral/10 bg-neutral/5">
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Título</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Tipo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Recompensa</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Estado</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-dark"></th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.map((challenge) => (
                    <tr key={challenge.id} className="border-b border-neutral/10 hover:bg-neutral/5">
                      <td className="py-3 px-4 font-medium text-text-dark">{challenge.title}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs">
                          {challenge.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{challenge.reward} monedas</td>
                      <td className="py-3 px-4">
                        {challenge.is_active ? (
                          <span className="px-2 py-0.5 rounded-lg bg-complementary-emerald/10 text-complementary-emerald text-xs">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-neutral/10 text-neutral text-xs">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/challenges/${challenge.id}/edit`}
                          className="text-sm text-primary hover:underline"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden divide-y divide-neutral/10">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-text-dark">{challenge.title}</span>
                    {challenge.is_active ? (
                      <span className="px-2 py-0.5 rounded-lg bg-complementary-emerald/10 text-complementary-emerald text-xs">
                        Activo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-neutral/10 text-neutral text-xs">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">{challenge.type}</span>
                    {' · '}{challenge.reward} monedas
                  </p>
                  <Link
                    href={`/admin/challenges/${challenge.id}/edit`}
                    className="inline-block text-sm text-primary font-medium"
                  >
                    Editar
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
