'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FeedPost } from '@/components/feed/feed-post';
import { SharePostModal } from '@/components/feed/share-post-modal';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';

interface FeedPostData {
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
    profilePhotoUrl: string | null;
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

export default function PostPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const [post, setPost] = useState<FeedPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchCurrentUser();
  }, [params.id]);

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

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/feed/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Publicación no encontrada');
        } else {
          throw new Error('Error al cargar la publicación');
        }
        return;
      }
      
      const data = await response.json();
      setPost(data.post);
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

      // Refresh post to show updated like count
      await fetchPost();
    } catch (err) {
      console.error('Error liking post:', err);
      toast.error('Error al dar like');
    }
  };

  const handleCommentAdded = () => {
    fetchPost();
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const getPostTitle = () => {
    if (!post) return 'Publicación en Calixo';
    if (post.challenge) {
      return `${post.profile?.displayName || 'Usuario'} completó: ${post.challenge.title}`;
    }
    return `${post.profile?.displayName || 'Usuario'} compartió una publicación`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-bold text-gray-900">Error</h1>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                {error || 'No se pudo cargar la publicación'}
              </p>
              <div className="flex gap-2">
                <Button onClick={() => router.push('/feed')}>
                  Volver al Feed
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Volver
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            ← Volver
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Publicación
          </h1>
        </div>

        {/* Post */}
        <FeedPost
          post={post}
          currentUserId={currentUserId}
          onLike={handleLike}
          onCommentAdded={handleCommentAdded}
        />

        {/* Share button */}
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={handleShare}
            className="w-full md:w-auto"
          >
            🔗 Compartir publicación
          </Button>
        </div>

        {/* Share Modal */}
        <SharePostModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          postUrl={window.location.href}
          postTitle={getPostTitle()}
          postImage={post.feedItem.imageUrl}
        />
      </div>
    </div>
  );
}
