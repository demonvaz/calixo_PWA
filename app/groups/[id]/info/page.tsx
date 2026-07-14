'use client';

import { use } from 'react';
import { GroupInfoPanel } from '@/components/groups/group-info-panel';

export default function GroupInfoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = use(params);
  return <GroupInfoPanel groupId={groupId} />;
}
