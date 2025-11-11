'use client';

import { useMemo } from 'react';

interface AvatarPreviewProps {
  equippedItems: Record<string, string>;
  energyLevel: 'alta' | 'media' | 'baja';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-32 h-32',
  lg: 'w-48 h-48',
  xl: 'w-64 h-64',
};

const energyColors = {
  alta: '#22C55E', // green
  media: '#EAB308', // yellow
  baja: '#EF4444', // red
};

const energyEmojis = {
  alta: '😊',
  media: '😐',
  baja: '😴',
};

export function AvatarPreview({
  equippedItems,
  energyLevel,
  size = 'md',
  showLabel = false,
}: AvatarPreviewProps) {
  // Get equipped items
  const color = equippedItems.color || 'blue-sky';
  const shirt = equippedItems.shirt || 'basic';
  const hat = equippedItems.hat || 'none';
  const glasses = equippedItems.glasses || 'none';
  const background = equippedItems.background || 'simple';

  // Generate avatar representation
  const avatarEmoji = useMemo(() => {
    return energyEmojis[energyLevel];
  }, [energyLevel]);

  const backgroundColor = useMemo(() => {
    // Map item IDs to colors
    const colorMap: Record<string, string> = {
      'blue-sky': '#93C5FD',
      'soft-pink': '#FBCFE8',
      'mint-green': '#A7F3D0',
      'sun-yellow': '#FDE047',
      'purple-galaxy': '#C084FC',
    };
    return colorMap[color] || '#93C5FD';
  }, [color]);

  const borderColor = energyColors[energyLevel];

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center border-4 transition-all duration-300 shadow-lg relative overflow-hidden`}
        style={{
          backgroundColor,
          borderColor,
        }}
      >
        {/* Background layer */}
        <div className="absolute inset-0 opacity-20">
          {background === 'nature' && '🌿'}
          {background === 'city' && '🏙️'}
          {background === 'space' && '✨'}
        </div>

        {/* Avatar face */}
        <div className="relative z-10 text-5xl">
          {avatarEmoji}
        </div>

        {/* Hat layer */}
        {hat !== 'none' && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl">
            {hat === 'sport-cap' && '🧢'}
            {hat === 'sun-hat' && '👒'}
            {hat === 'royal-crown' && '👑'}
          </div>
        )}

        {/* Glasses layer */}
        {glasses !== 'none' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl">
            {glasses === 'sunglasses' && '🕶️'}
            {glasses === 'reading-glasses' && '👓'}
            {glasses === 'futuristic-glasses' && '🥽'}
          </div>
        )}

        {/* Shirt indicator (bottom corner) */}
        {shirt !== 'basic' && (
          <div className="absolute bottom-0 right-0 text-lg">
            {shirt === 'stripes' && '👕'}
            {shirt === 'sport' && '🏃'}
            {shirt === 'premium' && '✨'}
          </div>
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <div className="text-center">
          <div
            className="inline-block px-3 py-1 rounded-full text-sm font-semibold"
            style={{
              backgroundColor: `${borderColor}20`,
              color: borderColor,
            }}
          >
            Energía {energyLevel.charAt(0).toUpperCase() + energyLevel.slice(1)}
          </div>
        </div>
      )}
    </div>
  );
}



