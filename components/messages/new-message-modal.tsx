'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { AvatarPreview } from '@/components/avatar/avatar-preview';
import { Spinner } from '@/components/ui/spinner';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { getEnergyLevel } from '@/lib/avatar-energy';

interface SearchResult {
  userId: string;
  displayName: string;
  avatarEnergy: number;
}

interface NewMessageModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewMessageModal({ open, onClose }: NewMessageModalProps) {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingChat, setStartingChat] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      return;
    }

    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(debouncedQuery)}`
        );
        if (!response.ok) throw new Error('Error al buscar usuarios');
        const data = await response.json();
        setResults(
          (data.users || []).map((u: SearchResult) => ({
            userId: u.userId,
            displayName: u.displayName,
            avatarEnergy: u.avatarEnergy,
          }))
        );
      } catch {
        toast.error('Error al buscar usuarios');
      } finally {
        setLoading(false);
      }
    };

    searchUsers();
  }, [debouncedQuery, open]);

  const handleStartChat = async (recipientId: string) => {
    setStartingChat(recipientId);
    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onClose();
      router.push(`/messages/${data.conversationId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al abrir chat');
    } finally {
      setStartingChat(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Nuevo mensaje</h3>
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuario..."
            autoFocus
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Spinner size="sm" />
            </div>
          )}
        </div>
        {query.length > 0 && query.length < 2 && (
          <p className="text-sm text-gray-500">Escribe al menos 2 caracteres</p>
        )}
        <ul className="max-h-64 overflow-y-auto space-y-1">
          {debouncedQuery.length >= 2 && !loading && results.length === 0 && (
            <li className="text-center py-4 text-sm text-gray-500">
              No se encontraron usuarios
            </li>
          )}
          {results.map((user) => (
            <li key={user.userId}>
              <button
                type="button"
                onClick={() => handleStartChat(user.userId)}
                disabled={startingChat !== null}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm disabled:opacity-50"
              >
                <AvatarPreview
                  energyLevel={getEnergyLevel(user.avatarEnergy)}
                  equippedItems={{}}
                  size="sm"
                />
                <span className="font-medium text-gray-900 truncate">
                  {user.displayName}
                </span>
                {startingChat === user.userId && <Spinner size="sm" />}
              </button>
            </li>
          ))}
        </ul>
        <Button variant="outline" onClick={onClose} className="w-full">
          Cerrar
        </Button>
      </div>
    </div>
  );
}
