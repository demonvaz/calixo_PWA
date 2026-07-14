'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function MessagesBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const isAuthOrAdminPage = pathname?.startsWith('/auth') || pathname?.startsWith('/admin');
    if (isAuthOrAdminPage) return;

    fetchUnread();
    const interval = setInterval(fetchUnread, pathname?.startsWith('/messages') ? 15000 : 30000);

    const handleUpdate = () => fetchUnread();
    window.addEventListener('messages-updated', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('messages-updated', handleUpdate);
    };
  }, [pathname]);

  const fetchUnread = async () => {
    try {
      const response = await fetch('/api/messages/unread-count');
      if (response.status === 401) {
        setUnreadCount(0);
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      setUnreadCount(0);
    }
  };

  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-gradient-to-br from-primary to-primary-dark text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5 shadow-lg ring-2 ring-white/95 leading-none">
      {unreadCount > 99 ? '99+' : unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
}
