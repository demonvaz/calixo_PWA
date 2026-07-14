'use client';

import { use } from 'react';
import { GroupChatThread } from '@/components/groups/group-chat-thread';

export default function GroupChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  return <GroupChatThread groupId={groupId} />;
}
