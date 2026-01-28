'use client';

import Image from 'next/image';

// Emojis que flotarán alrededor de la imagen
const emojis: string[] = [];

export function AuthHeroSection() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-white items-center justify-center">
      {/* Imagen principal posicionada como Instagram - formato 9:16 */}
      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div 
          className="relative rounded-2xl overflow-visible shadow-2xl"
          style={{
            width: 'min(420px, 85vw)',
            maxHeight: '90vh',
            aspectRatio: '9/16',
            transform: 'rotate(-3deg)',
            transition: 'transform 0.3s ease',
          }}
        >
          <div className="relative w-full h-full rounded-2xl overflow-hidden">
            <Image
              src="/photos/back.PNG"
              alt="Calixo"
              fill
              className="object-cover"
              quality={90}
              sizes="(max-width: 768px) 100vw, 420px"
              priority
            />
          </div>

          {/* Emojis flotantes alrededor de la imagen */}
          {emojis.map((emoji, index) => {
            const positions = [
              { top: '-5%', left: '10%', delay: 0, anim: 'animate-float' },
              { top: '20%', right: '-10%', delay: 1.5, anim: 'animate-float-slow' },
              { bottom: '-5%', left: '50%', delay: 3, anim: 'animate-float-fast' },
              { top: '50%', left: '-10%', delay: 4.5, anim: 'animate-float' },
            ];
            
            const pos = positions[index];
            
            return (
              <div
                key={index}
                className={`absolute text-4xl lg:text-5xl ${pos.anim} opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-default z-10`}
                style={{
                  top: pos.top,
                  bottom: pos.bottom,
                  left: pos.left,
                  right: pos.right,
                  animationDelay: `${pos.delay}s`,
                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
                }}
              >
                {emoji}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
