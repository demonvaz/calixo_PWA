'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FeedPost } from '@/components/feed/feed-post';
import { useToast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
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

export function FeedPage() {
  const router = useRouter();
  const toast = useToast();
  const [feedData, setFeedData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedType, setFeedType] = useState<'following' | 'global'>('following');
  const [offset, setOffset] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [feedType]);

  const fetchFeed = async (loadMore = false) => {
    try {
      const currentOffset = loadMore ? offset : 0;
      const response = await fetch(
        `/api/feed?type=${feedType}&limit=20&offset=${currentOffset}`
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
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

  const handleLike = async (feedItemId: number) => {
    try {
      const response = await fetch(`/api/feed/${feedItemId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al dar like');
      }

      // Refresh feed to show updated like count
      await fetchFeed();
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleCommentAdded = async () => {
    // Refresh feed to update comments count
    await fetchFeed();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Feed Content */}
      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Feed Type Toggle */}
          <div className="mb-6 flex gap-2">
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
              {feedData.feedItems.map((post) => (
                <FeedPost
                  key={post.feedItem.id}
                  post={post}
                  currentUserId={currentUserId || undefined}
                  onLike={handleLike}
                  onCommentAdded={handleCommentAdded}
                />
              ))}

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
    </div>
  );
}
