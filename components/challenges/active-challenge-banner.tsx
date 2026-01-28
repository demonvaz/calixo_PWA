'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ActiveChallenge {
  id: number;
  challengeId: number;
  challengeTitle: string;
  challengeType: string;
  status: 'in_progress' | 'finished';
  startedAt: string;
  finishedAt?: string;
  durationMinutes: number;
  reward: number;
}

interface ActiveChallengeBannerProps {
  challenge: ActiveChallenge;
  onCancel: () => void;
  onClaim?: () => void;
}

export function ActiveChallengeBanner({ challenge, onCancel, onClaim }: ActiveChallengeBannerProps) {
  const toast = useToast();
  const confirmDialog = useConfirmDialog();
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isFinished = challenge.status === 'finished';

  // Update time every second for real-time countdown (only if active)
  useEffect(() => {
    if (isFinished) return;
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [isFinished]);

  const calculateElapsedTime = () => {
    const startTime = new Date(challenge.startedAt);
    const elapsedMs = currentTime.getTime() - startTime.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
    return { minutes: elapsedMinutes, seconds: elapsedSeconds };
  };

  const calculateRemainingTime = () => {
    const totalSeconds = challenge.durationMinutes * 60;
    const elapsed = calculateElapsedTime();
    const elapsedTotalSeconds = elapsed.minutes * 60 + elapsed.seconds;
    const remainingSeconds = Math.max(0, totalSeconds - elapsedTotalSeconds);
    
    const hours = Math.floor(remainingSeconds / 3600);
    const mins = Math.floor((remainingSeconds % 3600) / 60);
    const secs = remainingSeconds % 60;
    
    return { hours, minutes: mins, seconds: secs };
  };

  const formatTime = (hours: number, minutes: number, seconds: number) => {
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCancel = () => {
    confirmDialog.confirm({
      title: 'Cancelar reto activo',
      message: `¿Estás seguro de que quieres cancelar "${challenge.challengeTitle}"? El progreso se perderá.`,
      confirmText: 'Sí, cancelar',
      cancelText: 'No, continuar',
      confirmVariant: 'destructive',
      onConfirm: async () => {
        setIsCancelling(true);
        try {
          const response = await fetch('/api/challenges/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userChallengeId: challenge.id }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Error al cancelar el reto');
          }

          toast.info('Reto cancelado');
          onCancel();
        } catch (err) {
          console.error('Error canceling challenge:', err);
          toast.error(err instanceof Error ? err.message : 'Error al cancelar el reto');
        } finally {
          setIsCancelling(false);
        }
      },
    });
  };

  const handleClaim = async () => {
    if (!onClaim) return;
    
    setIsClaiming(true);
    try {
      await onClaim();
    } catch (err) {
      console.error('Error claiming challenge:', err);
      toast.error('Error al reclamar el reto');
    } finally {
      setIsClaiming(false);
    }
  };

  const remaining = isFinished ? { hours: 0, minutes: 0, seconds: 0 } : calculateRemainingTime();
  const elapsed = isFinished ? { minutes: challenge.durationMinutes, seconds: 0 } : calculateElapsedTime();
  
  // Check if timer has finished even if status is still 'in_progress'
  const timerFinished = !isFinished && remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0;
  const shouldShowClaim = isFinished || timerFinished;
  
  const progress = shouldShowClaim 
    ? 100 
    : Math.min(
        ((elapsed.minutes * 60 + elapsed.seconds) / (challenge.durationMinutes * 60)) * 100,
        100
      );

  return (
    <Card className={cn(
      "mb-4 border border-primary/20 shadow-sm transition-all",
      shouldShowClaim 
        ? "bg-gradient-to-r from-amber-100/70 to-orange-100/70" 
        : "bg-gradient-to-r from-[#ff7f7f]/15 to-[#ff9f9f]/10"
    )}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Icono pequeño */}
          <div className="flex-shrink-0">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              shouldShowClaim
                ? "bg-gradient-to-br from-amber-400 to-orange-500"
                : "bg-gradient-to-br from-primary to-primary-dark"
            )}>
              <span className="text-xl">
                {shouldShowClaim ? '✓' : ''}
              </span>
            </div>
          </div>

          {/* Contenido principal compacto */}
          <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "text-sm font-bold font-serif",
                  shouldShowClaim ? "text-amber-700" : "text-primary-dark"
                )}>
                  {shouldShowClaim ? 'Finalizado' : 'Activo'}
                </span>
                <span className="text-xs text-neutral">•</span>
                <p className="text-sm font-medium text-text-dark break-words line-clamp-2">
                  {challenge.challengeTitle}
                </p>
              </div>
              
              {/* Barra de progreso fina */}
              <div className="mb-1">
                <div className="w-full bg-white/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-1000 ease-linear rounded-full",
                      shouldShowClaim
                        ? "bg-gradient-to-r from-amber-400 to-orange-500"
                        : "bg-gradient-to-r from-primary to-primary-dark"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Info compacta en línea */}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-neutral">
                  {shouldShowClaim ? 'Completado' : `${formatTime(remaining.hours, remaining.minutes, remaining.seconds)} restante`}
                </span>
                <span className="text-neutral">•</span>
                <span className="text-accent-yellow-dark font-semibold">
                  {challenge.reward} monedas
                </span>
              </div>
            </div>

            {/* Botón de acción compacto */}
            {shouldShowClaim ? (
              <Button
                onClick={handleClaim}
                disabled={isClaiming}
                className="bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm rounded-lg h-9 px-4 text-sm transition-all flex-shrink-0"
              >
                {isClaiming ? '...' : 'Reclamar'}
              </Button>
            ) : (
              <Button
                onClick={handleCancel}
                variant="ghost"
                className="text-accent-red-DEFAULT hover:bg-accent-red-light/10 font-medium rounded-lg h-9 px-3 text-sm transition-all flex-shrink-0"
                disabled={isCancelling}
              >
                {isCancelling ? '...' : 'Cancelar'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
