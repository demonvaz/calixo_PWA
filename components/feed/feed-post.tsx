'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

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
    } | null;
    challenge: {
      id: number;
      title: string;
      type: string;
      reward: number;
    } | null;
  };
  onLike?: (feedItemId: number) => void;
  onComment?: (feedItemId: number) => void;
}

export function FeedPost({ post, onLike, onComment }: FeedPostProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.feedItem.likesCount);

  const handleLike = () => {
    if (onLike) {
      onLike(post.feedItem.id);
      setIsLiked(!isLiked);
      setLocalLikes(prev => isLiked ? prev - 1 : prev + 1);
    }
  };

  const handleComment = () => {
    if (onComment) {
      onComment(post.feedItem.id);
    }
  };

  const getEnergyEmoji = (energy: number) => {
    if (energy >= 70) return '😊';
    if (energy >= 40) return '😐';
    return '😴';
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

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
              {post.profile ? getEnergyEmoji(post.profile.avatarEnergy) : '👤'}
            </div>
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
                    ⭐ Premium
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(post.feedItem.createdAt)}
              </div>
            </div>
          </div>

          {post.challenge && (
            <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {post.challenge.type === 'daily' && '📅'}
              {post.challenge.type === 'focus' && '🎯'}
              {post.challenge.type === 'social' && '👥'}
              {' '}
              {post.challenge.title}
            </div>
          )}
        </div>
      </CardHeader>

      {/* Image */}
      {post.feedItem.imageUrl && (
        <div className="relative w-full aspect-square bg-gray-100">
          <Image
            src={post.feedItem.imageUrl}
            alt="Post image"
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Content */}
      <CardContent className="pt-4">
        {post.feedItem.note && (
          <p className="text-gray-700 whitespace-pre-wrap">
            {post.feedItem.note}
          </p>
        )}
        
        {post.challenge && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold text-yellow-600">
              🪙 +{post.challenge.reward} monedas
            </span>
          </div>
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
            {isLiked ? '❤️' : '🤍'} {localLikes}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleComment}
          >
            💬 {post.feedItem.commentsCount}
          </Button>
        </div>
        
        <Button variant="ghost" size="sm">
          🔗 Compartir
        </Button>
      </CardFooter>
    </Card>
  );
}



