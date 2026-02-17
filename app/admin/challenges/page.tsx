import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { ChallengeForm } from '@/components/admin/challenge-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-text-dark font-serif mb-2">Gestión de Retos</h2>
          <p className="text-neutral">
            Crea, edita y gestiona los retos del catálogo
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/challenges/new">Crear Nuevo Reto</Link>
        </Button>
      </div>

      {/* Challenges List */}
      <Card className="p-6">
        <div className="space-y-4">
          {(!allChallenges || allChallenges.length === 0) ? (
            <p className="text-neutral text-center py-8">
              No hay retos en el catálogo. Crea el primero.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral/20">
                    <th className="text-left py-3 px-4 font-medium text-text-dark font-serif">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-text-dark font-serif">Título</th>
                    <th className="text-left py-3 px-4 font-medium text-text-dark font-serif">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-text-dark font-serif">Recompensa</th>
                    <th className="text-left py-3 px-4 font-medium text-text-dark font-serif">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-text-dark font-serif">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {allChallenges.map((challenge) => (
                    <tr key={challenge.id} className="border-b border-neutral/10">
                      <td className="py-3 px-4 text-neutral">{challenge.id}</td>
                      <td className="py-3 px-4 font-medium text-text-dark font-serif">
                        {challenge.title}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-sm">
                          {challenge.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">{challenge.reward} monedas</td>
                      <td className="py-3 px-4">
                        {challenge.is_active ? (
                          <span className="px-2 py-1 bg-complementary-emerald/10 text-complementary-emerald rounded-lg text-sm">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-neutral-gray/10 text-neutral rounded-lg text-sm">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/challenges/${challenge.id}/edit`}
                          className="text-primary hover:underline text-sm"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
