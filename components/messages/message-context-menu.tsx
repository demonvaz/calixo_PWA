'use client';

import { useState, useRef, useEffect } from 'react';

interface MessageContextMenuProps {
  isOwn: boolean;
  onInfo: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
}

export function MessageContextMenu({
  isOwn,
  onInfo,
  onDelete,
  onCopy,
}: MessageContextMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1 rounded-full opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 hover:bg-black/10 transition-opacity text-xs"
        aria-label="Opciones del mensaje"
      >
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[140px]">
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => { onInfo(); setOpen(false); }}
          >
            Info
          </button>
          {onCopy && (
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => { onCopy(); setOpen(false); }}
            >
              Copiar
            </button>
          )}
          {isOwn && onDelete && (
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={() => { onDelete(); setOpen(false); }}
            >
              Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
