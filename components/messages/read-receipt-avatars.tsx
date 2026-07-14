'use client';

import type { ReadReceiptUser } from '@/types';

interface ReadReceiptAvatarsProps {
  readers: ReadReceiptUser[];
  maxVisible?: number;
  size?: number;
  onClick?: () => void;
}

export function ReadReceiptAvatars({
  readers,
  maxVisible = 2,
  size = 18,
  onClick,
}: ReadReceiptAvatarsProps) {
  if (readers.length === 0) return null;

  const visible = readers.slice(0, maxVisible);
  const extraCount = readers.length > maxVisible ? readers.length - maxVisible : 0;

  const content = (
    <>
      <div className="flex items-center -space-x-1.5">
        {visible.map((reader) => (
          <div
            key={reader.userId}
            className="relative rounded-full ring-2 ring-white overflow-hidden bg-gray-200 flex-shrink-0"
            style={{ width: size, height: size }}
            title={reader.displayName}
          >
            {reader.profilePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={reader.profilePhotoUrl}
                alt={reader.displayName}
                className="object-cover w-full h-full"
              />
            ) : (
              <span
                className="flex items-center justify-center w-full h-full text-[9px] font-bold text-primary bg-primary/10"
              >
                {reader.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        ))}
      </div>
      {extraCount > 0 && (
        <span className="text-[10px] text-gray-400 ml-1 whitespace-nowrap">
          +{extraCount} más
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center ml-1 cursor-pointer hover:opacity-80"
        title={readers.map((r) => r.displayName).join(', ')}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-center ml-1" title={readers.map((r) => r.displayName).join(', ')}>
      {content}
    </div>
  );
}
