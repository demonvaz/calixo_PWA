'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
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
  const pathname = usePathname();
  const isInfoPage = pathname?.endsWith('/info');
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

  const handleBack = () => {
    if (isInfoPage) {
      router.push(`/groups/${groupId}/chat`);
    } else {
      router.push('/groups');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] md:pt-16">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
        <button
          onClick={handleBack}
          className="text-primary"
          aria-label="Volver"
        >
          ←
        </button>
        {isInfoPage ? (
          <h1 className="font-semibold text-lg truncate">Info del grupo</h1>
        ) : (
          <Link
            href={`/groups/${groupId}/info`}
            className="font-semibold text-lg truncate hover:text-primary transition-colors flex-1 min-w-0"
          >
            {groupName}
          </Link>
        )}
        {!isInfoPage && <GroupInviteButton groupId={groupId} />}
      </div>
      {!isInfoPage && <GroupTabs groupId={groupId} />}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
