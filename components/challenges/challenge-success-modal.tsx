'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ChallengeSuccessModalProps {
  isOpen: boolean;
  challengeTitle: string;
  coinsEarned: number;
  feedItemId?: number;
  onClose: () => void;
}

export function ChallengeSuccessModal({
  isOpen,
  challengeTitle,
  coinsEarned,
  feedItemId,
  onClose,
}: ChallengeSuccessModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain',
        'bg-black/50 backdrop-blur-sm',
        'transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleBackdropClick}
    >
      <Card
        className={cn(
          'w-full max-w-md max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto my-auto shadow-2xl',
          'transform transition-all duration-300',
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            ¡Reto Completado!
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Has completado: {challengeTitle}
          </CardDescription>
          <div className="flex items-center justify-center gap-2 mt-4 text-yellow-600 font-semibold text-xl">
            <span>+{coinsEarned} monedas ganadas</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedItemId ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-semibold mb-2">
                Publicación compartida en el Feed
              </p>
              <p className="text-sm text-green-700">
                Tu logro ya está visible para todos tus seguidores
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-blue-800 font-semibold mb-2">
                ¡Sigue así!
              </p>
              <p className="text-sm text-blue-700">
                Puedes compartir tus logros en el Feed cuando quieras
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {feedItemId ? (
              <Link href="/feed" className="w-full">
                <Button className="w-full" variant="default">
                  Ver en el Feed →
                </Button>
              </Link>
            ) : (
              <Link href="/feed" className="w-full">
                <Button className="w-full" variant="default">
                  Ver Feed
                </Button>
              </Link>
            )}
            
            <Button
              ref={closeButtonRef}
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
