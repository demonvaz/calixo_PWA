'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const DEFAULT_IMAGE = '/photos/back.PNG';

interface BannerPreviewProps {
  phrase: string;
  imageUrl?: string | null;
}

/**
 * Vista previa del banner tal como se verá en el feed.
 * Replica el diseño de CalixoFeedCard.
 */
export function BannerPreview({ phrase, imageUrl }: BannerPreviewProps) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);
  const imgSrc = (imageUrl && !imgError) ? imageUrl : DEFAULT_IMAGE;
  const displayPhrase = phrase.trim() ? phrase.toUpperCase() : 'Tu frase aquí';

  return (
    <div className="rounded-xl overflow-hidden border border-neutral/10 shadow-sm">
      <p className="text-xs text-neutral px-3 py-2 border-b border-neutral/10 bg-neutral/5">
        Vista previa
      </p>
      <div
        className="overflow-hidden"
        style={{ backgroundColor: '#fe4b5b' }}
      >
        {/* Header */}
        <div className="pb-3 border-b border-white/20 px-4 pt-4" style={{ backgroundColor: '#fe4b5b' }}>
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
              <span className="font-semibold text-white">CALIXO</span>
              <div className="text-xs text-white/80">Siempre contigo</div>
            </div>
          </div>
        </div>

        {/* Image + phrase */}
        <div className="relative w-full aspect-square bg-white/10 overflow-hidden">
          <Image
            src={imgSrc}
            alt=""
            fill
            className="object-cover scale-105"
            style={{ filter: 'blur(2px) brightness(0.85)' }}
            unoptimized={imgSrc.startsWith('http')}
            onError={() => setImgError(true)}
          />
          <div
            className="absolute inset-0 flex items-center justify-center p-6"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.75) 100%)',
            }}
          >
            <p
              className="text-white text-center text-sm sm:text-base font-semibold tracking-wide whitespace-pre-wrap z-10 max-w-[90%]"
              style={{
                fontFamily: "'Libre Caslon Text', Georgia, serif",
                textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 4px 16px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.4)',
              }}
            >
              {displayPhrase}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 pb-4 px-4 border-t border-white/20" style={{ backgroundColor: '#fe4b5b' }}>
          <p className="text-white/95 text-center text-xs">¡Completa retos y gana recompensas!</p>
        </div>
      </div>
    </div>
  );
}
