'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/types';

interface MessageInfoModalProps {
  message: ChatMessage;
  isGroup?: boolean;
  onClose: () => void;
}

export function MessageInfoModal({ message, isGroup, onClose }: MessageInfoModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const sentAt = new Date(message.createdAt).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-900">Info del mensaje</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-800">
            {message.content || (message.imageUrl ? '📷 Imagen' : '—')}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Enviado</span>
              <span className="text-gray-900">{sentAt}</span>
            </div>
            {message.isOwn && !isGroup && message.status && (
              <div className="flex justify-between">
                <span className="text-gray-500">Estado</span>
                <span className="text-gray-900 capitalize">
                  {message.status === 'sent' && 'Enviado'}
                  {message.status === 'delivered' && 'Entregado'}
                  {message.status === 'seen' && 'Visto'}
                </span>
              </div>
            )}
          </div>

          {message.isOwn && message.readBy && message.readBy.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                {isGroup ? 'Leído por' : 'Visto por'}
              </p>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {message.readBy.map((reader) => (
                  <li key={reader.userId} className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {reader.profilePhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={reader.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-primary">
                          {reader.displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{reader.displayName}</p>
                      {reader.readAt && (
                        <p className="text-xs text-gray-400">
                          {new Date(reader.readAt).toLocaleString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {message.isOwn && (!message.readBy || message.readBy.length === 0) && (
            <p className="text-sm text-gray-400 text-center py-2">
              {isGroup ? 'Nadie ha leído este mensaje aún' : 'Aún no ha sido visto'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
