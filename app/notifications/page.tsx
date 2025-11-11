'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationItem } from '@/components/notifications/notification-item';

interface Notification {
  id: number;
  type: string;
  payload: any;
  seen: boolean;
  createdAt: Date;
}

interface NotificationsData {
  notifications: Notification[];
  unseenCount: number;
  total: number;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [data, setData] = useState<NotificationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams();
      if (filter === 'unread') params.append('unseenOnly', 'true');
      
      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }
      
      const notificationsData = await response.json();
      setData(notificationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al marcar notificación');
      }

      // Refresh notifications
      await fetchNotifications();
    } catch (err) {
      console.error('Error marking notification:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al marcar todas');
      }

      alert('✅ Todas las notificaciones marcadas como leídas');
      await fetchNotifications();
    } catch (err) {
      alert('Error al marcar notificaciones');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔔</div>
          <p className="text-gray-600">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            ← Volver
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🔔 Notificaciones
              </h1>
              <p className="text-gray-600">
                {data?.unseenCount ? `${data.unseenCount} sin leer` : 'Al día con todo'}
              </p>
            </div>

            {data && data.unseenCount > 0 && (
              <Button
                variant="outline"
                onClick={handleMarkAllRead}
              >
                Marcar todas leídas
              </Button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todas ({data?.total || 0})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Sin leer ({data?.unseenCount || 0})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        {!data || data.notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {filter === 'unread' 
                  ? 'No tienes notificaciones sin leer'
                  : 'No tienes notificaciones'}
              </h2>
              <p className="text-gray-600 mb-4">
                {filter === 'unread'
                  ? '¡Estás al día con todo!'
                  : 'Las notificaciones aparecerán aquí cuando tengas actividad'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => router.push('/challenges/daily')}>
                  🎯 Hacer Retos
                </Button>
                {filter === 'unread' && (
                  <Button 
                    variant="outline"
                    onClick={() => setFilter('all')}
                  >
                    Ver Todas
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



