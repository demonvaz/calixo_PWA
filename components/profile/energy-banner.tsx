'use client';

import Link from 'next/link';
import { getEnergyLevel, getEnergyMessage } from '@/lib/avatar-energy';

interface EnergyBannerProps {
  energy: number;
  /** Si false, solo muestra la barra de energía (sin mensaje ni CTA). Para perfiles ajenos. */
  showChallengesCta?: boolean;
}

export function EnergyBanner({ energy, showChallengesCta = true }: EnergyBannerProps) {
  const level = getEnergyLevel(energy);

  const bannerStyles = {
    alta: {
      gradient: 'from-complementary-emerald/20 via-complementary-emerald/10 to-transparent',
      border: 'border-complementary-emerald/30',
      text: 'text-complementary-emerald-dark',
      cta: 'bg-complementary-emerald hover:bg-complementary-emerald-dark',
      barBg: 'bg-complementary-emerald/30',
      barFill: 'bg-complementary-emerald',
    },
    media: {
      gradient: 'from-accent-yellow/20 via-accent-yellow/10 to-transparent',
      border: 'border-accent-yellow/40',
      text: 'text-accent-yellow-dark',
      cta: 'bg-accent-yellow hover:bg-accent-yellow-dark',
      barBg: 'bg-accent-yellow/30',
      barFill: 'bg-accent-yellow',
    },
    baja: {
      gradient: 'from-accent-red/20 via-accent-red/10 to-transparent',
      border: 'border-accent-red/30',
      text: 'text-accent-red-dark',
      cta: 'bg-accent-red hover:bg-accent-red-dark',
      barBg: 'bg-accent-red/30',
      barFill: 'bg-accent-red',
    },
  };

  const style = bannerStyles[level];
  const ctaText =
    level === 'alta'
      ? 'Sigue completando retos'
      : level === 'media'
        ? 'Completa retos para recuperar energía'
        : '¡Completa retos para subir tu energía!';

  return (
    <div
      className={`rounded-2xl border ${style.border} bg-gradient-to-r ${style.gradient} p-4 md:p-5 transition-all duration-300`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className={`h-2 flex-1 max-w-[120px] rounded-full ${style.barBg} overflow-hidden`}
              role="progressbar"
              aria-valuenow={energy}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full ${style.barFill} rounded-full transition-all duration-500`}
                style={{ width: `${energy}%` }}
              />
            </div>
            <span className={`text-sm font-semibold ${style.text}`}>
              {energy}% energía
            </span>
          </div>
          {showChallengesCta && (
            <p className="text-gray-700 text-sm md:text-base mt-2">{getEnergyMessage(level)}</p>
          )}
        </div>
        {showChallengesCta && (
          <Link
            href="/challenges"
            className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors flex-shrink-0 ${style.cta}`}
          >
            {ctaText}
          </Link>
        )}
      </div>
    </div>
  );
}
