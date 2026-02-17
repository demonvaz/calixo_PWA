'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StartChallengeModalProps {
  isOpen: boolean;
  challenge: {
    id: number;
    title: string;
    description?: string;
    reward: number;
    durationMinutes: number;
    type: string;
  };
  customDuration?: number;
  onStart: (customDuration?: number) => Promise<void>;
  onClose: () => void;
}

export function StartChallengeModal({
  isOpen,
  challenge,
  customDuration: initialCustomDuration,
  onStart,
  onClose,
}: StartChallengeModalProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [customDuration, setCustomDuration] = useState(initialCustomDuration || challenge.durationMinutes);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Reset custom duration when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomDuration(initialCustomDuration || challenge.durationMinutes);
    }
  }, [isOpen, initialCustomDuration, challenge.durationMinutes]);

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

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const duration = challenge.type === 'focus' ? customDuration : undefined;
      await onStart(duration);
      onClose();
    } catch (err) {
      console.error('Error starting challenge:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
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
          <CardTitle className="text-2xl font-bold text-gray-900 font-serif">
            {challenge.title}
          </CardTitle>
          {challenge.description && (
            <CardDescription className="text-base mt-2">
              {challenge.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información del reto */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
              <div className="text-xs text-neutral mb-1 font-medium">Duración</div>
              <div className="text-lg font-bold text-primary-dark font-serif">
                {formatDuration(challenge.type === 'focus' ? customDuration : challenge.durationMinutes)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
              <div className="text-xs text-neutral mb-1 font-medium">Recompensa</div>
              <div className="text-lg font-bold text-accent-yellow-dark flex items-center gap-1 font-serif">
                {challenge.reward} monedas
              </div>
            </div>
          </div>

          {/* Selector de duración para retos de enfoque */}
          {challenge.type === 'focus' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Duración: {formatDuration(customDuration)}
                </label>
                <input
                  type="range"
                  min="1"
                  max={23 * 60}
                  step="5"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 min</span>
                  <span>23 horas</span>
                </div>
              </div>

              {/* Opciones rápidas */}
              <div>
                <p className="text-sm font-medium mb-2">Opciones rápidas:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[25, 60, 90, 120, 180, 240].map((mins) => (
                    <Button
                      key={mins}
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomDuration(mins)}
                      className={customDuration === mins ? 'bg-primary text-white border-primary' : ''}
                    >
                      {formatDuration(mins)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleStart}
              disabled={isStarting}
              className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary-darker text-white font-semibold shadow-lg rounded-xl h-11 text-base transition-all"
            >
              {isStarting ? 'Iniciando...' : 'Iniciar Reto'}
            </Button>
            
            <Button
              ref={closeButtonRef}
              variant="outline"
              onClick={onClose}
              className="w-full rounded-xl h-11 text-base"
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
