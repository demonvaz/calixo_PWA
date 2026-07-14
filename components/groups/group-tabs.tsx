'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface GroupTabsProps {
  groupId: string;
}

const tabs = [
  { href: 'chat', label: 'Chat' },
  { href: 'challenge', label: 'Reto' },
  { href: 'stats', label: 'Estadísticas' },
];

export function GroupTabs({ groupId }: GroupTabsProps) {
  const pathname = usePathname();

  return (
    <div className="flex border-b bg-white">
      {tabs.map((tab) => {
        const href = `/groups/${groupId}/${tab.href}`;
        const isActive = pathname?.includes(`/${tab.href}`);
        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              'flex-1 py-3 text-center text-sm font-medium transition-colors',
              isActive
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
