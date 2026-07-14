'use client';

import { useEffect, useState } from 'react';
import { ConversationList } from '@/components/messages/conversation-list';
import { NewMessageModal } from '@/components/messages/new-message-modal';
import { Spinner } from '@/components/ui/spinner';
import type { ConversationPreview } from '@/types';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessageOpen, setNewMessageOpen] = useState(false);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-8 pt-4 md:pt-20">
      <div className="px-4 mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
        <button
          type="button"
          onClick={() => setNewMessageOpen(true)}
          className="p-2 rounded-full hover:bg-gray-100 text-primary transition-colors"
          aria-label="Nuevo mensaje"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <ConversationList
          conversations={conversations}
          onStartChat={() => setNewMessageOpen(true)}
        />
      )}
      <NewMessageModal
        open={newMessageOpen}
        onClose={() => setNewMessageOpen(false)}
      />
    </div>
  );
}
