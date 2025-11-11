'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface NotificationItemProps {
  notification: {
    id: number;
    type: string;
    payload: any;
    seen: boolean;
    createdAt: Date;
  };
  onMarkRead: (id: number) => void;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return notifDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getNotificationContent = () => {
    const { type, payload } = notification;

    switch (type) {
      case 'challenge':
        if (payload?.type === 'reminder') {
          return {
            icon: '⏰',
            title: 'Recordatorio de reto',
            message: payload.message || 'Tienes un reto pendiente',
            link: '/challenges/daily',
          };
        }
        if (payload?.type === 'completed') {
          return {
            icon: '🎉',
            title: '¡Reto completado!',
            message: `Completaste: ${payload.challengeName}. +${payload.reward} monedas`,
            link: '/dashboard',
          };
        }
        break;

      case 'social':
        if (payload?.type === 'new_follower') {
          return {
            icon: '👤',
            title: 'Nuevo seguidor',
            message: 'Alguien comenzó a seguirte',
            link: '/profile',
          };
        }
        if (payload?.type === 'feed_like') {
          return {
            icon: '❤️',
            title: 'Le gustó tu post',
            message: 'A alguien le gustó tu reto completado',
            link: '/feed',
          };
        }
        if (payload?.type === 'feed_comment') {
          return {
            icon: '💬',
            title: 'Nuevo comentario',
            message: `"${payload.comment?.substring(0, 50)}..."` || 'Comentaron tu post',
            link: '/feed',
          };
        }
        break;

      case 'store':
        if (payload?.type === 'item_purchased') {
          return {
            icon: '🛍️',
            title: 'Compra exitosa',
            message: `Compraste: ${payload.itemName}`,
            link: '/avatar',
          };
        }
        break;

      case 'subscription':
        if (payload?.type === 'activated') {
          return {
            icon: '⭐',
            title: 'Premium activado',
            message: '¡Bienvenido a Premium! Disfruta de todas las funciones',
            link: '/subscription',
          };
        }
        if (payload?.type === 'expired') {
          return {
            icon: '⚠️',
            title: 'Premium expirado',
            message: 'Tu subscripción Premium ha expirado',
            link: '/pricing',
          };
        }
        break;

      case 'achievement':
        return {
          icon: '🏆',
          title: 'Nuevo logro',
          message: payload.achievement || 'Desbloqueaste un nuevo logro',
          link: '/profile',
        };

      default:
        return {
          icon: '🔔',
          title: 'Notificación',
          message: payload.message || 'Tienes una nueva notificación',
          link: '/notifications',
        };
    }
  };

  const content = getNotificationContent();

  return (
    <div
      className={`
        p-4 border rounded-lg transition-colors
        ${notification.seen ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl">{content?.icon}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {content?.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {content?.message}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {formatDate(notification.createdAt)}
              </p>
            </div>

            {!notification.seen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkRead(notification.id)}
                className="shrink-0"
              >
                Marcar leída
              </Button>
            )}
          </div>

          {content?.link && (
            <Link href={content.link}>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Ver →
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}



