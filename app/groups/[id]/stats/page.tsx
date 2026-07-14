'use client';

import { use, useEffect, useState } from 'react';
import { GroupStatsPanel } from '@/components/groups/group-stats-panel';
import { Spinner } from '@/components/ui/spinner';
import type { GroupStats } from '@/types';

export default function GroupStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const [stats, setStats] = useState<GroupStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/groups/${groupId}/stats`)
      .then((r) => r.json())
      .then((data) => setStats(data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [groupId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-center text-gray-500 py-8">Error al cargar estadísticas</p>;
  }

  return <GroupStatsPanel stats={stats} />;
}
