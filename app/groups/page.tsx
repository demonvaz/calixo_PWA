'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GroupListItem } from '@/components/groups/group-list-item';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { GroupPreview } from '@/types';

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
    const interval = setInterval(fetchGroups, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-8 pt-4 md:pt-20">
      <div className="px-4 mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Grupos</h1>
        <Link href="/groups/new">
          <Button size="sm">Nuevo grupo</Button>
        </Link>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 text-gray-500 px-4">
          <p className="text-lg font-medium mb-2">Sin grupos</p>
          <p className="text-sm mb-4">Crea un grupo e invita a tus amigos</p>
          <Link href="/groups/new">
            <Button>Crear grupo</Button>
          </Link>
        </div>
      ) : (
        groups.map((group) => <GroupListItem key={group.id} group={group} />)
      )}
    </div>
  );
}
