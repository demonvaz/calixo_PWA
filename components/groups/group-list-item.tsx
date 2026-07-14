'use client';

import Link from 'next/link';
import type { GroupPreview } from '@/types';

interface GroupListItemProps {
  group: GroupPreview;
}

export function GroupListItem({ group }: GroupListItemProps) {
  return (
    <Link
      href={`/groups/${group.id}/chat`}
      className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b"
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-lg font-bold text-primary">
          {group.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <p className="font-semibold text-gray-900 truncate">{group.name}</p>
          {group.lastMessage && (
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              {new Date(group.lastMessage.createdAt).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 truncate">
            {group.lastMessage
              ? group.lastMessage.isOwn
                ? `Tú: ${group.lastMessage.content}`
                : group.lastMessage.content
              : `${group.memberCount} miembros`}
          </p>
          {group.unreadCount > 0 && (
            <span className="ml-2 bg-primary text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
              {group.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
