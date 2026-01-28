'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { FeedComments } from './feed-comments';
import { cn } from '@/lib/utils';

interface FeedPostProps {
  post: {
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
  };
  currentUserId?: string;
  onLike?: (feedItemId: number) => void;
  onCommentAdded?: () => void;
}

export function FeedPost({ post, currentUserId, onLike, onCommentAdded }: FeedPostProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.feedItem.likesCount);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.feedItem.commentsCount);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const handleLike = () => {
    if (onLike) {
      onLike(post.feedItem.id);
      setIsLiked(!isLiked);
      setLocalLikes(prev => isLiked ? prev - 1 : prev + 1);
    }
  };

  const handleCommentAdded = () => {
    setLocalCommentsCount(prev => prev + 1);
    if (onCommentAdded) {
      onCommentAdded();
    }
  };

  // Handle ESC key to close image modal
  useEffect(() => {
    if (!isImageModalOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImageModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isImageModalOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isImageModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isImageModalOpen]);

  const getEnergyEmoji = (energy: number) => {
    return '';
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return postDate.toLocaleDateString('es-ES', { 
      day: 'numeric',
      month: 'short'
    });
  };

  const calculateDuration = () => {
    if (!post.userChallenge?.startedAt || !post.userChallenge?.completedAt) {
      return null;
    }

    const start = new Date(post.userChallenge.startedAt);
    const end = new Date(post.userChallenge.completedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} min`;
    } else if (diffHours < 24) {
      const remainingMins = diffMins % 60;
      return remainingMins > 0 ? `${diffHours}h ${remainingMins}min` : `${diffHours}h`;
    } else {
      const remainingHours = diffHours % 24;
      return remainingHours > 0 ? `${diffDays}d ${remainingHours}h` : `${diffDays}d`;
    }
  };

  const getChallengeTypeIcon = (type: string) => {
    return '';
  };

  const getChallengeTypeColor = (type: string) => {
    switch (type) {
      case 'daily':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'focus':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'social':
        return 'bg-green-50 border-green-200 text-green-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {post.profile?.profilePhotoUrl ? (
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral/10 flex items-center justify-center">
                <Image
                  src={post.profile.profilePhotoUrl}
                  alt={post.profile.displayName || 'Usuario'}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                {post.profile?.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <Link 
                  href={`/profile/${post.profile?.userId}`}
                  className="font-semibold hover:underline"
                >
                  {post.profile?.displayName || 'Usuario'}
                </Link>
                {post.profile?.isPremium && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    Premium
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(post.feedItem.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Challenge Info - Minimalist */}
      {post.challenge && (
        <div className="px-6 pt-2 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-base">{getChallengeTypeIcon(post.challenge.type)}</span>
            <span className="font-medium text-gray-900">{post.challenge.title}</span>
            <span className="text-gray-400">•</span>
            {calculateDuration() && (
              <>
                <span className="text-xs">{calculateDuration()}</span>
                <span className="text-gray-400">•</span>
              </>
            )}
            <span className="text-xs font-medium text-yellow-600">+{post.challenge.reward} monedas</span>
          </div>
        </div>
      )}

      {/* Image */}
      {post.feedItem.imageUrl && (
        <>
          <div 
            className="relative w-full md:max-w-md md:mx-auto aspect-square bg-gray-100 cursor-pointer"
            onClick={() => setIsImageModalOpen(true)}
          >
            <Image
              src={post.feedItem.imageUrl}
              alt="Post image"
              fill
              className="object-cover"
            />
          </div>

          {/* Image Modal */}
          {isImageModalOpen && (
            <div
              className={cn(
                'fixed z-[9999] flex items-center justify-center',
                'bg-black/90 backdrop-blur-sm',
                'transition-opacity duration-300',
                'opacity-100'
              )}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
              }}
              onClick={(e) => {
                // Cerrar solo si se hace clic directamente en el backdrop
                if (e.target === e.currentTarget) {
                  setIsImageModalOpen(false);
                }
              }}
              onTouchStart={(e) => {
                // En móvil, detectar si el toque es en el backdrop
                const target = e.target as HTMLElement;
                if (target === e.currentTarget || target.classList.contains('modal-backdrop')) {
                  setIsImageModalOpen(false);
                }
              }}
            >
              {/* Contenedor de la imagen - no ocupa todo el espacio, solo lo necesario */}
              <div 
                className="relative flex items-center justify-center pointer-events-none"
                style={{
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                }}
              >
                <div 
                  className="relative pointer-events-auto"
                  style={{
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <img
                    src={post.feedItem.imageUrl}
                    alt="Post image ampliada"
                    className="object-contain"
                    style={{
                      maxWidth: '90vw',
                      maxHeight: '90vh',
                      width: 'auto',
                      height: 'auto',
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageModalOpen(false);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setIsImageModalOpen(false);
                }}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white border-white/20 z-10 pointer-events-auto"
                aria-label="Cerrar imagen"
              >
                ✕
              </Button>
            </div>
          )}
        </>
      )}

      {/* Content */}
      <CardContent className="pt-4">
        {post.feedItem.note && (
          <p className="text-gray-700 whitespace-pre-wrap">
            {post.feedItem.note}
          </p>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter className="flex justify-between border-t pt-3">
        <div className="flex gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={isLiked ? 'text-red-600' : ''}
          >
            {isLiked ? 'Me gusta' : 'Me gusta'} {localLikes}
          </Button>
          <Button
            variant="ghost"
            size="sm"
          >
            {localCommentsCount} comentarios
          </Button>
        </div>
        
        <Button variant="ghost" size="sm">
          🔗 Compartir
        </Button>
      </CardFooter>

      {/* Comments Section */}
      {currentUserId && (
        <div className="px-6 pb-4">
          <FeedComments
            feedItemId={post.feedItem.id}
            currentUserId={currentUserId}
            onCommentAdded={handleCommentAdded}
          />
        </div>
      )}
    </Card>
  );
}






