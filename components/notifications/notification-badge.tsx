'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function NotificationBadge() {
  const [unseenCount, setUnseenCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    // Solo hacer fetch si no estamos en páginas de auth o admin
    const isAuthOrAdminPage = pathname?.startsWith('/auth') || pathname?.startsWith('/admin');
    
    if (!isAuthOrAdminPage) {
      fetchUnseenCount();
      
      // Poll every 30 seconds
      const interval = setInterval(fetchUnseenCount, 30000);
      
      // Escuchar eventos de actualización de notificaciones
      const handleNotificationUpdate = () => {
        fetchUnseenCount();
      };
      
      window.addEventListener('notification-updated', handleNotificationUpdate);
      window.addEventListener('notifications-marked-read', handleNotificationUpdate);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('notification-updated', handleNotificationUpdate);
        window.removeEventListener('notifications-marked-read', handleNotificationUpdate);
      };
    }
  }, [pathname]);

  const fetchUnseenCount = async () => {
    try {
      const response = await fetch('/api/notifications?unseenOnly=true&limit=100');
      
      // Si es 401, el usuario no está autenticado, simplemente no mostrar badge
      if (response.status === 401) {
        setUnseenCount(0);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setUnseenCount(data.unseenCount || 0);
      }
    } catch (error) {
      // Silenciar errores de red, solo loggear en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching unseen count:', error);
      }
      setUnseenCount(0);
    }
  };

  if (unseenCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-gradient-to-br from-primary to-primary-dark text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5 shadow-lg ring-2 ring-white/95 leading-none">
      {unseenCount > 99 ? '99+' : unseenCount > 9 ? '9+' : unseenCount}
    </span>
  );
}






