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
  const shareText = `${shareTitle} - ${postUrl}`;

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

  const handleShare = async (platform: string) => {
    const encodedUrl = encodeURIComponent(postUrl);
    const encodedTitle = encodeURIComponent(shareTitle);
    const encodedText = encodeURIComponent(shareText);

    let shareUrl = '';

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedText}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareTitle,
          url: postUrl,
        });
      } catch (err) {
        // User cancelled or error occurred
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center',
        'bg-black/50 backdrop-blur-sm',
        'transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md mx-4 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle>Compartir publicación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Copy Link */}
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

          {/* Native Share (Mobile) */}
          {navigator.share && (
            <Button
              onClick={handleNativeShare}
              className="w-full"
              variant="default"
            >
              Compartir (nativo)
            </Button>
          )}

          {/* Social Media Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              onClick={() => handleShare('whatsapp')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <span>📱</span> WhatsApp
            </Button>
            <Button
              onClick={() => handleShare('twitter')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <span>🐦</span> Twitter
            </Button>
            <Button
              onClick={() => handleShare('facebook')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <span>📘</span> Facebook
            </Button>
            <Button
              onClick={() => handleShare('telegram')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <span>✈️</span> Telegram
            </Button>
            <Button
              onClick={() => handleShare('linkedin')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <span>💼</span> LinkedIn
            </Button>
            <Button
              onClick={() => handleShare('reddit')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <span>🤖</span> Reddit
            </Button>
            <Button
              onClick={() => handleShare('email')}
              variant="outline"
              className="flex items-center gap-2 col-span-2"
            >
              <span>📧</span> Email
            </Button>
          </div>

          {/* Note about Instagram */}
          <div className="pt-2 border-t text-xs text-gray-500 text-center">
            💡 Para compartir en Instagram, copia el enlace y pégalo en tu historia o publicación
          </div>

          {/* Close Button */}
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full mt-2"
          >
            Cerrar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
