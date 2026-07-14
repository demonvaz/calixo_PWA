'use client';

import Link from 'next/link';
import { AvatarPreview } from '@/components/avatar/avatar-preview';
import type { ConversationPreview } from '@/types';

interface ConversationListProps {
  conversations: ConversationPreview[];
}

export function ConversationList({ conversations }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium mb-2">Sin mensajes</p>
        <p className="text-sm">Busca usuarios y envíales un mensaje</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/messages/${conv.id}`}
          className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="relative flex-shrink-0">
            <AvatarPreview energyLevel="alta" size={48} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <p className="font-semibold text-gray-900 truncate">
                {conv.otherUser?.displayName || 'Usuario'}
              </p>
              {conv.lastMessage && (
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                  {new Date(conv.lastMessage.createdAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500 truncate">
                {conv.lastMessage
                  ? conv.lastMessage.isOwn
                    ? `Tú: ${conv.lastMessage.content}`
                    : conv.lastMessage.content
                  : 'Sin mensajes'}
              </p>
              {conv.unreadCount > 0 && (
                <span className="ml-2 bg-primary text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {conv.unreadCount}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
