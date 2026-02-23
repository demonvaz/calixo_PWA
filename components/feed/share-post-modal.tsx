'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface SharePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postUrl: string;
  postTitle?: string;
  postImage?: string | null;
}

export function SharePostModal({ isOpen, onClose, postUrl, postTitle, postImage }: SharePostModalProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareTitle = postTitle || 'Mira esta publicación en Calixo';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast.success('Enlace copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Error al copiar el enlace');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareTitle,
          url: postUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain',
        'bg-black/70 backdrop-blur-md',
        'transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle>Compartir publicación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={postUrl}
              readOnly
              className="flex-1 bg-gray-50"
            />
            <Button
              onClick={handleCopyLink}
              variant={copied ? 'default' : 'outline'}
              className="flex-shrink-0"
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </Button>
          </div>

          {'share' in navigator && typeof navigator.share === 'function' && (
            <Button
              onClick={handleShare}
              className="w-full"
              variant="default"
            >
              Compartir
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
