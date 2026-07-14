'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

interface GroupInviteButtonProps {
  groupId: string;
}

export function GroupInviteButton({ groupId }: GroupInviteButtonProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ userId: string; displayName: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const search = async () => {
    if (query.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults((data.users || []).map((u: { userId: string; displayName: string }) => ({
        userId: u.userId,
        displayName: u.displayName,
      })));
    } finally {
      setLoading(false);
    }
  };

  const invite = async (inviteeId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Invitación enviada');
      setOpen(false);
      setQuery('');
      setResults([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al invitar');
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-primary ml-auto"
        type="button"
      >
        Invitar
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-4 space-y-3">
        <h3 className="font-semibold">Invitar al grupo</h3>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuario..."
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
          <Button onClick={search} disabled={loading} size="sm">
            Buscar
          </Button>
        </div>
        <ul className="max-h-48 overflow-y-auto space-y-1">
          {results.map((u) => (
            <li key={u.userId}>
              <button
                type="button"
                onClick={() => invite(u.userId)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm"
              >
                {u.displayName}
              </button>
            </li>
          ))}
        </ul>
        <Button variant="outline" onClick={() => setOpen(false)} className="w-full">
          Cerrar
        </Button>
      </div>
    </div>
  );
}
