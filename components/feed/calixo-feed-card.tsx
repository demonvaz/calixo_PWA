'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const CALIXO_PHRASES = [
  'Quizás sea mejor que dejes de scrollear, y salgas a acumular momentos',
  'Tienes muchos retos por hacer, desconecta un poco',
  'La vida está ahí fuera esperándote',
  'Tu dedo merece un descanso, ¿qué tal un reto?',
  'Menos scroll, más momentos memorables',
];

function getRandomPhrase() {
  const phrase = CALIXO_PHRASES[Math.floor(Math.random() * CALIXO_PHRASES.length)];
  return phrase.toUpperCase();
}

export function CalixoFeedCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [phrase] = useState(() => getRandomPhrase());
  const [hasBounced, setHasBounced] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const fullyVisible = entry.intersectionRatio >= 0.9;
          if (fullyVisible && !hasBounced) {
            setHasBounced(true);
          }
        });
      },
      {
        threshold: [0, 0.5, 0.9, 1],
        rootMargin: '0px',
      }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, [hasBounced]);

  return (
    <Card
      ref={cardRef}
      className={cn(
        'overflow-hidden transition-shadow border-0',
        hasBounced && 'animate-calixo-bounce-in'
      )}
      style={{
        backgroundColor: '#fe4b5b',
      }}
    >
      {/* Header - CALIXO con logo */}
      <CardHeader
        className="pb-3 border-b border-white/20"
        style={{ backgroundColor: '#fe4b5b' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0">
              <Image
                src="/icons/icon.svg"
                alt="CALIXO"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">CALIXO</span>
              </div>
              <div className="text-xs text-white/80">Siempre contigo</div>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Image - back.PNG con blur, overlay oscuro y texto estilizado */}
      <div className="relative w-full md:max-w-md md:mx-auto aspect-square bg-white/10 overflow-hidden">
        <Image
          src="/photos/back.PNG"
          alt="Desconecta y vive"
          fill
          className="object-cover scale-105"
          style={{ filter: 'blur(2px) brightness(0.85)' }}
          priority
        />
        {/* Overlay oscurecido para legibilidad + gradiente suave */}
        <div
          className="absolute inset-0 flex items-center justify-center p-8"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.75) 100%)',
          }}
        >
          <p
            className="text-white text-center text-base sm:text-lg font-semibold tracking-wide whitespace-pre-wrap z-10 max-w-[90%]"
            style={{
              fontFamily: "'Libre Caslon Text', Georgia, serif",
              textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 4px 16px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.4)',
            }}
          >
            {phrase}
          </p>
        </div>
      </div>

      {/* Content */}
      <CardContent
        className="pt-4"
        style={{ backgroundColor: '#fe4b5b' }}
      >
        <p className="text-white/95 text-center text-sm">
          ¡Completa retos y gana recompensas!
        </p>
      </CardContent>

      {/* Footer */}
      <CardFooter
        className="flex justify-center border-t border-white/20 pt-3"
        style={{ backgroundColor: '#fe4b5b' }}
      >
        <Link href="/challenges">
          <Button
            variant="outline"
            size="sm"
            className="border-white text-white hover:bg-white/20 hover:text-white"
          >
            Ir a Retos →
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
