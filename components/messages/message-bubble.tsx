'use client';

import { useState } from 'react';
import { ReadReceiptAvatars } from './read-receipt-avatars';
import { MessageContextMenu } from './message-context-menu';
import { MessageInfoModal } from './message-info-modal';
import type { ChatMessage } from '@/types';

interface MessageBubbleProps {
  message: ChatMessage;
  isGroup?: boolean;
  onDelete?: (messageId: number) => void;
}

export function MessageBubble({ message, isGroup, onDelete }: MessageBubbleProps) {
  const [showInfo, setShowInfo] = useState(false);
  const { content, imageUrl, isOwn, senderName, createdAt, readBy, status } = message;

  const time = new Date(createdAt).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCopy = () => {
    if (content) navigator.clipboard.writeText(content);
  };

  const showReadAvatars = isOwn && readBy && readBy.length > 0;
  const showDeliveredPending = isOwn && !isGroup && !showReadAvatars && status === 'delivered';

  return (
    <>
      <div className={`group flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 gap-1`}>
        {!isOwn && (
          <div className="self-end opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <MessageContextMenu
              isOwn={false}
              onInfo={() => setShowInfo(true)}
              onCopy={content ? handleCopy : undefined}
            />
          </div>
        )}

        <div
          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-primary text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          }`}
        >
          {isGroup && senderName && !isOwn && (
            <p className="text-xs font-semibold text-primary mb-1">{senderName}</p>
          )}
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="rounded-lg max-w-full mb-1" />
          )}
          {content && <p className="text-sm whitespace-pre-wrap break-words">{content}</p>}
          <div className={`flex items-center justify-end gap-0.5 mt-1 flex-wrap ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
            <span className="text-[10px]">{time}</span>
            {showReadAvatars && (
              <ReadReceiptAvatars
                readers={readBy!}
                maxVisible={2}
                size={16}
                onClick={() => setShowInfo(true)}
              />
            )}
            {showDeliveredPending && (
              <span className="text-[10px] ml-1 opacity-60">Entregado</span>
            )}
          </div>
        </div>

        {isOwn && (
          <div className="self-end opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <MessageContextMenu
              isOwn
              onInfo={() => setShowInfo(true)}
              onCopy={content ? handleCopy : undefined}
              onDelete={onDelete ? () => onDelete(message.id) : undefined}
            />
          </div>
        )}
      </div>

      {showInfo && (
        <MessageInfoModal
          message={message}
          isGroup={isGroup}
          onClose={() => setShowInfo(false)}
        />
      )}
    </>
  );
}
