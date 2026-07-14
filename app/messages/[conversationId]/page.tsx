'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChatThread } from '@/components/messages/chat-thread';
import { Spinner } from '@/components/ui/spinner';

export default function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params);
  const router = useRouter();
  const [otherUserName, setOtherUserName] = useState<string>('');

  useEffect(() => {
    fetch('/api/messages/conversations')
      .then((r) => r.json())
      .then((data) => {
        const conv = (data.conversations || []).find(
          (c: { id: string }) => c.id === conversationId
        );
        if (conv?.otherUser?.displayName) {
          setOtherUserName(conv.otherUser.displayName);
        }
      })
      .catch(() => {});
  }, [conversationId]);

  if (!conversationId) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] md:pt-16">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
        <button
          onClick={() => router.push('/messages')}
          className="text-primary md:hidden"
          aria-label="Volver"
        >
          ←
        </button>
        <h1 className="font-semibold text-lg">
          {otherUserName || (
            <span className="inline-block w-24 h-5 bg-gray-200 rounded animate-pulse" />
          )}
        </h1>
        {otherUserName && (
          <Link
            href={`/profile/${conversationId}`}
            className="ml-auto text-sm text-primary hidden"
          >
            Perfil
          </Link>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatThread conversationId={conversationId} otherUserName={otherUserName} />
      </div>
    </div>
  );
}
