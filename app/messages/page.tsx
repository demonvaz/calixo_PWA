'use client';

import { useEffect, useState } from 'react';
import { ConversationList } from '@/components/messages/conversation-list';
import { Spinner } from '@/components/ui/spinner';
import type { ConversationPreview } from '@/types';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="px-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <ConversationList conversations={conversations} />
      )}
    </div>
  );
}
