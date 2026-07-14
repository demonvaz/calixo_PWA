'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GroupTabs } from '@/components/groups/group-tabs';
import { GroupInviteButton } from '@/components/groups/group-invite-button';
import { Spinner } from '@/components/ui/spinner';

export default function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = use(params);
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/groups/${groupId}`)
      .then((r) => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then((data) => {
        setGroupName(data.group?.name || 'Grupo');
      })
      .catch(() => router.push('/groups'))
      .finally(() => setLoading(false));
  }, [groupId, router]);

  if (loading) {
    return (
      <div className="flex justify-center py-12 md:pt-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] md:pt-16">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
        <button
          onClick={() => router.push('/groups')}
          className="text-primary"
          aria-label="Volver"
        >
          ←
        </button>
        <h1 className="font-semibold text-lg truncate">{groupName}</h1>
        <GroupInviteButton groupId={groupId} />
      </div>
      <GroupTabs groupId={groupId} />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
