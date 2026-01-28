'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ChallengeCompletionForm } from './challenge-completion-form';
import { cn } from '@/lib/utils';

interface ShareChallengeModalProps {
  isOpen: boolean;
  challengeTitle: string;
  coinsEarned: number;
  userChallengeId: number;
  onSubmit: (imageUrl: string, note: string) => Promise<void>;
  onSkip?: () => void;
  onClose: () => void;
}

export function ShareChallengeModal({
  isOpen,
  challengeTitle,
  coinsEarned,
  userChallengeId,
  onSubmit,
  onSkip,
  onClose,
}: ShareChallengeModalProps) {
  const [hasInteracted, setHasInteracted] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Reset hasInteracted when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasInteracted(false);
    }
  }, [isOpen]);

  const createReminderNotification = useCallback(async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'challenge',
          title: '¿Olvidaste compartir tu desconexión?',
          message: `Comparte "${challengeTitle}" para ganar 2 monedas extra`,
          payload: {
            type: 'share_reminder',
            userChallengeId: userChallengeId,
            challengeTitle: challengeTitle,
          },
        }),
      });
    } catch (error) {
      console.error('Error creating reminder notification:', error);
    }
  }, [challengeTitle, userChallengeId]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = async (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !hasInteracted) {
        // Si se cierra con ESC sin interactuar, crear notificación de recordatorio
        await createReminderNotification();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, hasInteracted, createReminderNotification]);

  // Focus close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleBackdropClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !hasInteracted) {
      // Si se cierra sin interactuar, crear notificación de recordatorio
      await createReminderNotification();
      onClose();
    }
  };

  const handleSubmit = async (imageUrl: string, note: string) => {
    setHasInteracted(true);
    await onSubmit(imageUrl, note);
    onClose();
  };

  const handleSkip = async () => {
    setHasInteracted(true);
    if (onSkip) {
      onSkip();
    }
    // Crear notificación de recordatorio cuando se salta
    await createReminderNotification();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex items-center justify-center p-4',
        'bg-black/50 backdrop-blur-sm',
        'transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          'w-full max-w-md max-h-[90vh] overflow-y-auto',
          'transform transition-all duration-300',
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-gray-900 font-serif">
              Compartir tu logro
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {challengeTitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChallengeCompletionForm
              challengeTitle={challengeTitle}
              coinsEarned={coinsEarned}
              onSubmit={handleSubmit}
              onSkip={handleSkip}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
