'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MessageComposerProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageComposer({ onSend, disabled }: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await onSend(trimmed);
      setContent('');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t bg-white">
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe un mensaje..."
        disabled={disabled || sending}
        className="flex-1"
        maxLength={2000}
      />
      <Button type="submit" disabled={!content.trim() || disabled || sending}>
        Enviar
      </Button>
    </form>
  );
}
