'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ProfilePostCardProps {
  feedItem: {
    id: number;
    imageUrl: string | null;
    note: string | null;
    likesCount: number;
    commentsCount: number;
    createdAt: Date;
  };
  challenge?: {
    title: string;
  } | null;
}

export function ProfilePostCard({ feedItem, challenge }: ProfilePostCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/feed/${feedItem.id}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'group relative w-full aspect-square rounded-xl overflow-hidden',
        'bg-neutral-100 hover:bg-neutral-200/80 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
        'cursor-pointer'
      )}
    >
      {feedItem.imageUrl ? (
        <Image
          src={feedItem.imageUrl}
          alt=""
          fill
          className="object-cover transition-transform group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 200px"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-[#fe4b5b]">
          <p className="text-sm text-white font-medium line-clamp-3 text-center">
            {feedItem.note || challenge?.title || 'Publicación'}
          </p>
        </div>
      )}

      {/* Overlay sutil con stats - solo si hay imagen */}
      {feedItem.imageUrl && (feedItem.likesCount > 0 || feedItem.commentsCount > 0) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-8">
          <div className="flex items-center gap-3 text-white/90 text-xs font-medium">
            {feedItem.likesCount > 0 && (
              <span>❤️ {feedItem.likesCount}</span>
            )}
            {feedItem.commentsCount > 0 && (
              <span>💬 {feedItem.commentsCount}</span>
            )}
          </div>
        </div>
      )}
    </button>
  );
}
