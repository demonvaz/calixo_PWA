'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StartFocusModalProps {
  isOpen: boolean;
  focusChallenge: {
    id: number;
    title: string;
    description?: string;
    type: string;
  } | null;
  onStart: (customDuration: number) => Promise<void>;
  onClose: () => void;
}

const HOURS_OPTIONS = [1, 2, 3, 4, 5] as const;
const COINS_PER_HOUR = 1;

export function StartFocusModal({
  isOpen,
  focusChallenge,
  onStart,
  onClose,
}: StartFocusModalProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [selectedHours, setSelectedHours] = useState(1);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedHours(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await onStart(selectedHours * 60);
      onClose();
    } catch (err) {
      console.error('Error starting focus challenge:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const rewardCoins = selectedHours * COINS_PER_HOUR;

  if (!isOpen) return null;

  // Sin desafío focus en la BD
  if (!focusChallenge) {
    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto overscroll-contain bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <Card className="w-full max-w-sm my-auto shadow-2xl border-neutral/15" onClick={(e) => e.stopPropagation()}>
          <CardContent className="p-5 text-center">
            <p className="text-neutral mb-4">El modo Focus no está disponible en este momento.</p>
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain',
        'bg-black/50 backdrop-blur-sm transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleBackdropClick}
    >
      <Card
        className={cn(
          'w-full max-w-sm max-h-[calc(100dvh-1.5rem)] overflow-y-auto my-auto shadow-2xl border-neutral/15',
          'transform transition-all duration-300',
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="text-center pb-1 pt-5 sm:pt-6 px-4 sm:px-5">
          <CardTitle className="text-xl sm:text-2xl font-bold text-text-dark font-serif">
            {focusChallenge.title}
          </CardTitle>
          {focusChallenge.description && (
            <CardDescription className="text-sm mt-1.5 text-neutral">
              {focusChallenge.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="px-4 sm:px-5 pb-5 sm:pb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2 px-3 rounded-xl bg-primary/5 border border-primary/10">
            <span className="text-sm font-medium text-text">Duración</span>
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {HOURS_OPTIONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setSelectedHours(h)}
                  className={cn(
                    'min-w-[2.5rem] sm:min-w-[2.75rem] py-2 px-2 rounded-lg text-sm font-semibold transition-colors',
                    selectedHours === h
                      ? 'bg-primary text-white'
                      : 'bg-white border border-neutral/20 text-text hover:border-primary/30 hover:bg-primary/5'
                  )}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-neutral text-center">
            <span className="font-semibold text-accent-yellow-dark">{rewardCoins} monedas</span>
            {' · '}
            <span className="text-xs">+2 al compartir</span>
          </p>

          <div className="flex flex-col gap-2 pt-1">
            <Button
              onClick={handleStart}
              disabled={isStarting}
              className="w-full h-10 sm:h-11"
            >
              {isStarting ? 'Iniciando...' : 'Iniciar reto Focus'}
            </Button>
            <Button
              ref={closeButtonRef}
              variant="outline"
              onClick={onClose}
              className="w-full h-10 sm:h-11"
              disabled={isStarting}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
