'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface FocusModeBannerProps {
  isPremium: boolean;
  focusChallenge: { id: number; title: string; description?: string; type: string } | null;
  onOpenModal: () => void;
}

export function FocusModeBanner({ isPremium, focusChallenge, onOpenModal }: FocusModeBannerProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!isPremium) return;
    onOpenModal();
  };

  // Usuario no premium: mostrar banner con CTA para upgrade
  if (!isPremium) {
    return (
      <Link href="/pricing">
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl p-6 md:p-8',
            'bg-gradient-to-br from-slate-800 via-indigo-900/90 to-purple-900/90',
            'border border-indigo-500/30 shadow-xl',
            'cursor-pointer transition-all duration-300',
            'hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/20'
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400/10 via-transparent to-transparent" />
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-8 translate-y-8 rounded-full bg-purple-500/10 blur-2xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <svg
                  className="h-7 w-7 text-indigo-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white font-serif">
                  MODO FOCUS
                </h3>
                <p className="text-sm text-indigo-200/90 mt-0.5">
                  Solo premium • Concéntrate hasta 5 horas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
                🔒 Premium
              </span>
              <span className="text-sm font-medium text-white/90">
                Actualiza para desbloquear
              </span>
              <span className="text-indigo-300">→</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Usuario premium: banner clickeable para abrir modal
  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 md:p-8',
        'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800',
        'border border-indigo-400/40 shadow-xl',
        'cursor-pointer transition-all duration-300',
        isHovered && 'scale-[1.02] shadow-2xl shadow-indigo-500/30'
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
      <div className="absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-12 rounded-full bg-white/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-12 translate-y-12 rounded-full bg-purple-400/20 blur-3xl" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <svg
              className="h-7 w-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white font-serif">
              MODO FOCUS
            </h3>
            <p className="text-sm text-white/90 mt-0.5">
              Hasta 5 horas • 1 moneda/hora + 2 al compartir
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            Iniciar
          </Button>
        </div>
      </div>
    </div>
  );
}
