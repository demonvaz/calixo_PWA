'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FeedPost } from '@/components/feed/feed-post';
import { CalixoFeedCard } from '@/components/feed/calixo-feed-card';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';

interface FeedPost {
  feedItem: {
    id: number;
    imageUrl: string | null;
    note: string | null;
    likesCount: number;
    commentsCount: number;
    createdAt: Date;
  };
  profile: {
    userId: string;
    displayName: string;
    avatarEnergy: number;
    isPremium: boolean;
  } | null;
  userChallenge: {
    id: number;
    userId: string;
    challengeId: number;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    failedAt: string | null;
    sessionData: any;
    createdAt: string;
  } | null;
  challenge: {
    id: number;
    type: string;
    title: string;
    description: string;
    reward: number;
    durationMinutes: number;
    isActive: boolean;
    createdAt: string;
  } | null;
}

interface FeedData {
  feedItems: FeedPost[];
  hasMore: boolean;
  total: number;
}

export default function FeedPage() {
  const router = useRouter();
  const toast = useToast();
  const [feedData, setFeedData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedType, setFeedType] = useState<'following' | 'global'>('following');
  const [offset, setOffset] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  useEffect(() => {
    fetchCurrentUser();
    fetchFeed();
  }, [feedType]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.profile?.userId);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchFeed = async (loadMore = false) => {
    try {
      const currentOffset = loadMore ? offset : 0;
      const response = await fetch(
        `/api/feed?type=${feedType}&limit=20&offset=${currentOffset}`
      );
      
      if (!response.ok) {
        throw new Error('Error al cargar el feed');
      }
      
      const data = await response.json();
      
      if (loadMore && feedData) {
        setFeedData({
          ...data,
          feedItems: [...feedData.feedItems, ...data.feedItems],
        });
      } else {
        setFeedData(data);
      }
      
      if (loadMore) {
        setOffset(currentOffset + 20);
      } else {
        setOffset(20);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (_feedItemId: number) => {
    // No recargar: FeedPost ya actualiza su estado con la respuesta del API
    // Recargar aquí causaba que el like desapareciera y mala UX
  };

  const handleCommentAdded = () => {
    // No recargar: FeedPost ya actualiza el contador localmente
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
            Feed Social
          </h1>

          {/* Feed Type Toggle */}
          <div className="flex gap-2">
            <Button
              variant={feedType === 'following' ? 'default' : 'outline'}
              onClick={() => {
                setFeedType('following');
                setOffset(0);
              }}
            >
              Siguiendo
            </Button>
            <Button
              variant={feedType === 'global' ? 'default' : 'outline'}
              onClick={() => {
                setFeedType('global');
                setOffset(0);
              }}
            >
              Global
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Feed */}
        {!feedData || feedData.feedItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {feedType === 'following' 
                  ? 'No hay posts de usuarios que sigues'
                  : 'No hay posts disponibles'}
              </h2>
              <p className="text-gray-600 mb-4">
                {feedType === 'following'
                  ? 'Sigue a otros usuarios o completa retos para ver contenido aquí'
                  : 'Completa retos y comparte tus logros'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => router.push('/challenges')}>
                  Hacer Retos
                </Button>
                {feedType === 'following' && (
                  <Button 
                    variant="outline"
                    onClick={() => setFeedType('global')}
                  >
                    Ver Feed Global
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {feedData.feedItems.flatMap((post, index) => {
              const items: React.ReactNode[] = [];
              // Insertar CalixoFeedCard cada 10 publicaciones (después de la 10ª, 20ª, etc.)
              if (index > 0 && index % 10 === 0) {
                items.push(
                  <CalixoFeedCard key={`calixo-${index}`} />
                );
              }
              items.push(
                <FeedPost
                  key={post.feedItem.id}
                  post={post}
                  currentUserId={currentUserId}
                  onLike={handleLike}
                  onCommentAdded={handleCommentAdded}
                />
              );
              return items;
            })}

            {/* Load More */}
            {feedData.hasMore && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => fetchFeed(true)}
                >
                  Cargar más
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}






