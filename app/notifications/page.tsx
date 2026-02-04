'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationItem } from '@/components/notifications/notification-item';
import { ShareChallengeModal } from '@/components/challenges/share-challenge-modal';
import { ChallengeSuccessModal } from '@/components/challenges/challenge-success-modal';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';

interface Notification {
  id: number;
  type: string;
  title?: string;
  message?: string;
  payload: any;
  seen: boolean;
  createdAt: Date | string;
}

interface NotificationsData {
  notifications: Notification[];
  unseenCount: number;
  readCount?: number;
  total: number;
  hasMore?: boolean;
  totalCount?: number;
}

export default function NotificationsPage() {
  const router = useRouter();
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const NOTIFICATIONS_PER_PAGE = 10;
  
  // Estado para el modal de compartir desde notificación
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareNotificationId, setShareNotificationId] = useState<number | null>(null);
  const [shareChallengeData, setShareChallengeData] = useState<{
    userChallengeId: number;
    challengeTitle: string;
    reward: number;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completionData, setCompletionData] = useState<{
    coinsEarned: number;
    feedItemId?: number;
  } | null>(null);

  const fetchNotifications = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        limit: NOTIFICATIONS_PER_PAGE.toString(),
        offset: currentOffset.toString(),
      });
      
      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }
      
      const notificationsData = await response.json();
      
      if (reset) {
        setNotifications(notificationsData.notifications || []);
        setOffset(NOTIFICATIONS_PER_PAGE);
      } else {
        setNotifications(prev => [...prev, ...(notificationsData.notifications || [])]);
        setOffset(prev => prev + NOTIFICATIONS_PER_PAGE);
      }
      
      setHasMore(notificationsData.hasMore || false);
      setTotalCount(notificationsData.totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await fetchNotifications(false);
  };

  // Marcar automáticamente todas las notificaciones como leídas al entrar a la página
  useEffect(() => {
    const markAllAsRead = async () => {
      try {
        const response = await fetch('/api/notifications/read-all', {
          method: 'POST',
        });

        if (response.ok) {
          // Disparar evento para actualizar el badge
          window.dispatchEvent(new CustomEvent('notifications-marked-read'));
        }
        // Refrescar las notificaciones después de marcarlas como leídas (o si falla)
        await fetchNotifications(true);
      } catch (err) {
        console.error('Error al marcar notificaciones como leídas:', err);
        // Aún así cargar las notificaciones aunque falle el marcado
        await fetchNotifications(true);
      }
    };

    markAllAsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo se ejecuta una vez al montar el componente


  const handleShareFromNotification = async (notification: Notification) => {
    const payload = notification.payload || {};
    if (payload.type === 'share_reminder' && payload.userChallengeId && payload.challengeTitle) {
      try {
        // Obtener el reward del reto desde el userChallenge
        const response = await fetch(`/api/challenges/active`);
        let reward = 0;
        if (response.ok) {
          const challengeData = await response.json();
          if (challengeData.activeChallenge && challengeData.activeChallenge.id === payload.userChallengeId) {
            reward = challengeData.activeChallenge.reward || 0;
          } else {
            // Si no está activo, obtenerlo directamente del reto completado
            // El reto ya está completado, así que podemos usar un valor por defecto o hacer otra consulta
            // Por ahora usamos 0 y se mostrará correctamente en el modal
            reward = 0;
          }
        }
        
        setShareChallengeData({
          userChallengeId: payload.userChallengeId,
          challengeTitle: payload.challengeTitle,
          reward: reward,
        });
        setShareNotificationId(notification.id);
        setShowShareModal(true);
      } catch (err) {
        console.error('Error opening share modal:', err);
        toast.error('Error al abrir el modal de compartir');
      }
    }
  };

  const handleSubmitShare = async (imageUrl: string, note: string) => {
    if (!shareChallengeData) return;

    try {
      const response = await fetch('/api/challenges/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userChallengeId: shareChallengeData.userChallengeId,
          imageUrl,
          note,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al compartir');
      }

      const data = await response.json();
      
      // Eliminar la notificación después de compartir exitosamente
      if (shareNotificationId) {
        try {
          await fetch(`/api/notifications/${shareNotificationId}`, {
            method: 'DELETE',
          });
        } catch (deleteErr) {
          console.error('Error deleting notification:', deleteErr);
          // No fallar si no se puede eliminar la notificación
        }
      }
      
      setShowShareModal(false);
      setCompletionData({
        coinsEarned: data.coinsEarned,
        feedItemId: data.feedItem?.id,
      });
      setShowSuccessModal(true);
      
      const bonusText = data.shareBonus > 0 ? ` (+${data.shareBonus} por compartir)` : '';
      toast.success(`¡Compartido! Ganaste ${data.coinsEarned} monedas extra${bonusText}`, 5000);
      
      // Actualizar notificaciones
      await fetchNotifications(true);
      
      // Disparar evento para actualizar el badge
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (err) {
      console.error('Error submitting share:', err);
      toast.error(err instanceof Error ? err.message : 'Error al compartir');
      throw err;
    }
  };

  const handleSkipShare = async () => {
    // Cerrar el modal sin compartir
    setShowShareModal(false);
    setShareChallengeData(null);
    setShareNotificationId(null);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setCompletionData(null);
    setShareChallengeData(null);
    setShareNotificationId(null);
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pb-20 md:pb-0">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      {/* Modal de compartir desde notificación */}
      {shareChallengeData && (
        <ShareChallengeModal
          isOpen={showShareModal}
          challengeTitle={shareChallengeData.challengeTitle}
          coinsEarned={shareChallengeData.reward}
          userChallengeId={shareChallengeData.userChallengeId}
          onSubmit={handleSubmitShare}
          onSkip={handleSkipShare}
          onClose={handleSkipShare}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && completionData && shareChallengeData && (
        <ChallengeSuccessModal
          isOpen={showSuccessModal}
          challengeTitle={shareChallengeData.challengeTitle}
          coinsEarned={completionData.coinsEarned}
          feedItemId={completionData.feedItemId}
          onClose={handleCloseSuccessModal}
        />
      )}

      <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4 md:px-6 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">
                Notificaciones
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                {totalCount > 0 ? `${totalCount} notificaciones` : 'No hay notificaciones'}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-8 md:py-12 px-4 md:px-6 text-center">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
                No tienes notificaciones
              </h2>
              <p className="text-sm md:text-base text-gray-600 mb-4">
                ¡Estás al día con todo!
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={() => router.push('/challenges/daily')} className="w-full sm:w-auto">
                  Hacer Retos
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-2 md:space-y-3">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRefresh={() => fetchNotifications(true)}
                  onShareChallenge={handleShareFromNotification}
                />
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {loadingMore ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Cargando...
                    </>
                  ) : (
                    'Cargar más'
                  )}
                </Button>
              </div>
            )}
            
            {/* End of notifications banner */}
            {!hasMore && notifications.length > 0 && (
              <Card className="mt-6">
                <CardContent className="py-4 px-4 md:px-6 text-center">
                  <p className="text-sm md:text-base text-gray-600">
                    Has visto todas las notificaciones
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
        </div>
      </div>
    </>
  );
}






