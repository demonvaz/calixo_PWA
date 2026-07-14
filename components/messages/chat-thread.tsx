'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MessageBubble } from './message-bubble';
import { MessageComposer } from './message-composer';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import type { ChatMessage } from '@/types';

interface ChatThreadProps {
  conversationId: string;
  otherUserName?: string;
}

export function ChatThread({ conversationId, otherUserName }: ChatThreadProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);

        const lastMsg = data.messages?.[data.messages.length - 1];
        if (lastMsg) {
          await fetch(`/api/messages/conversations/${conversationId}/messages`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lastReadMessageId: lastMsg.id }),
          });
          window.dispatchEvent(new Event('messages-updated'));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (content: string) => {
    const response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (response.ok) {
      const data = await response.json();
      setMessages((prev) => [...prev, { ...data.message, readBy: [] }]);
      window.dispatchEvent(new Event('messages-updated'));
    }
  };

  const handleDelete = async (messageId: number) => {
    try {
      const response = await fetch(
        `/api/messages/conversations/${conversationId}/messages/${messageId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success('Mensaje eliminado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">
            Inicia la conversación con {otherUserName || 'este usuario'}
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onDelete={handleDelete}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <MessageComposer onSend={handleSend} />
    </div>
  );
}
