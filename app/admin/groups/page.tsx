import { checkAdminPermissions } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminGroupsPage() {
  const permissions = await checkAdminPermissions();
  if (!permissions.isModerator) return null;

  const supabase = createServiceRoleClient();

  const [groupsRes, challengesRes] = await Promise.all([
    supabase.from('chat_groups').select('id, name, created_at, created_by').order('created_at', { ascending: false }).limit(50),
    supabase
      .from('group_challenges')
      .select('id, group_id, duration_minutes, status, total_pot, created_at')
      .in('status', ['betting', 'in_progress', 'finished'])
      .order('created_at', { ascending: false }),
  ]);

  const groups = groupsRes.data || [];
  const activeChallenges = challengesRes.data || [];

  const groupMap = Object.fromEntries(groups.map((g) => [g.id, g.name]));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-primary hover:underline">
          ← Dashboard
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-text-dark font-serif mt-2">Grupos</h1>
        <p className="text-sm text-neutral mt-0.5">Grupos y retos grupales activos</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Retos activos ({activeChallenges.length})</h2>
        {activeChallenges.length === 0 ? (
          <p className="text-sm text-neutral">No hay retos grupales activos</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-neutral/10 rounded-xl overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Grupo</th>
                  <th className="text-left p-3">Duración</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="text-left p-3">Bote</th>
                </tr>
              </thead>
              <tbody>
                {activeChallenges.map((c) => (
                  <tr key={c.id} className="border-t border-neutral/10">
                    <td className="p-3">{groupMap[c.group_id] || c.group_id}</td>
                    <td className="p-3">{c.duration_minutes} min</td>
                    <td className="p-3">{c.status}</td>
                    <td className="p-3">{c.total_pot} 🪙</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Grupos ({groups.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-neutral/10 rounded-xl overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Creado</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} className="border-t border-neutral/10">
                  <td className="p-3">{g.name}</td>
                  <td className="p-3">{new Date(g.created_at).toLocaleDateString('es-ES')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
