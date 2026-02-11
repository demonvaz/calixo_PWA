'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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

const MAX_MINUTES = 5 * 60; // 5 horas
const COINS_PER_HOUR = 1;

export function StartFocusModal({
  isOpen,
  focusChallenge,
  onStart,
  onClose,
}: StartFocusModalProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [customDuration, setCustomDuration] = useState(60); // 1 hora por defecto
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomDuration(60);
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
      await onStart(customDuration);
      onClose();
    } catch (err) {
      console.error('Error starting focus challenge:', err);
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

  const rewardCoins = Math.floor(customDuration / 60) * COINS_PER_HOUR;

  if (!isOpen) return null;

  // Sin desafío focus en la BD
  if (!focusChallenge) {
    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <Card className="w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">El modo Focus no está disponible en este momento.</p>
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
        'fixed inset-0 z-[200] flex items-center justify-center p-4',
        'bg-black/50 backdrop-blur-sm transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleBackdropClick}
    >
      <Card
        className={cn(
          'w-full max-w-md shadow-2xl',
          'transform transition-all duration-300',
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="text-center pb-2">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
            </span>
            Premium
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 font-serif">
            {focusChallenge.title}
          </CardTitle>
          {focusChallenge.description && (
            <CardDescription className="text-base mt-2">
              {focusChallenge.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
              <div className="text-xs text-neutral mb-1 font-medium">Duración</div>
              <div className="text-lg font-bold text-indigo-700 font-serif">
                {formatDuration(customDuration)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
              <div className="text-xs text-neutral mb-1 font-medium">Recompensa</div>
              <div className="text-lg font-bold text-accent-yellow-dark flex items-center gap-1 font-serif">
                {rewardCoins} monedas
                <span className="text-xs font-normal text-gray-500">+2 al compartir</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Duración: {formatDuration(customDuration)}
              </label>
              <input
                type="range"
                min="15"
                max={MAX_MINUTES}
                step="15"
                value={customDuration}
                onChange={(e) => setCustomDuration(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>15 min</span>
                <span>5 horas</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Opciones rápidas:</p>
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 120, 180, 240, 300].map((mins) => (
                  <Button
                    key={mins}
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomDuration(mins)}
                    className={cn(
                      customDuration === mins && 'bg-indigo-600 text-white border-indigo-600'
                    )}
                  >
                    {formatDuration(mins)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleStart}
              disabled={isStarting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg rounded-xl h-11 text-base transition-all"
            >
              {isStarting ? 'Iniciando...' : 'Iniciar Modo Focus'}
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
