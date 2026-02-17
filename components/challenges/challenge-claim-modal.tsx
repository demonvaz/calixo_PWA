'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChallengeClaimModalProps {
  isOpen: boolean;
  challengeTitle: string;
  reward: number;
  onClaim: () => Promise<void>;
  onClose: () => void;
}

export function ChallengeClaimModal({
  isOpen,
  challengeTitle,
  reward,
  onClaim,
  onClose,
}: ChallengeClaimModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isClaiming, setIsClaiming] = useState(false);

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

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      await onClaim();
    } finally {
      setIsClaiming(false);
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
            ¡Reto Finalizado!
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Has completado: {challengeTitle}
          </CardDescription>
          <div className="flex items-center justify-center gap-2 mt-4 text-yellow-600 font-semibold text-xl">
            <span>+{reward} monedas esperando</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800 font-semibold mb-2">
              Reclama tu recompensa
            </p>
            <p className="text-sm text-blue-700">
              Después podrás compartir tu logro y ganar 2 monedas extra
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full"
              size="lg"
            >
              {isClaiming ? 'Reclamando...' : 'Reclamar Recompensa'}
            </Button>
            
            <Button
              ref={closeButtonRef}
              variant="outline"
              onClick={onClose}
              className="w-full"
              disabled={isClaiming}
            >
              Más tarde
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
