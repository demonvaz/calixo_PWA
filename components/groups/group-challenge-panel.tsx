'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GroupChallengeTimer } from './group-challenge-timer';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import type { GroupChallenge } from '@/types';

interface GroupChallengePanelProps {
  groupId: string;
  activeChallenge: GroupChallenge | null;
  onRefresh: () => void;
  canStart: boolean;
}

export function GroupChallengePanel({
  groupId,
  activeChallenge,
  onRefresh,
  canStart,
}: GroupChallengePanelProps) {
  const [duration, setDuration] = useState(30);
  const [betAmount, setBetAmount] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleCreate = async () => {
    setCreating(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/challenges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMinutes: duration }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      toast.success('Reto grupal creado');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear reto');
    } finally {
      setCreating(false);
    }
  };

  const handleBet = async () => {
    const amount = parseInt(betAmount, 10);
    if (!amount || amount < 1) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/groups/${groupId}/challenges/${activeChallenge!.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'bet', amount }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      toast.success(`Apostaste ${amount} monedas`);
      setBetAmount('');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al apostar');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/groups/${groupId}/challenges/${activeChallenge!.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      toast.success('¡Reto iniciado!');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al iniciar');
    } finally {
      setLoading(false);
    }
  };

  if (activeChallenge?.status === 'in_progress') {
    return (
      <GroupChallengeTimer
        durationMinutes={activeChallenge.durationMinutes}
        challengeId={activeChallenge.id}
        groupId={groupId}
        onComplete={() => {
          toast.success('¡Reto completado!');
          onRefresh();
        }}
        onFail={onRefresh}
      />
    );
  }

  if (activeChallenge) {
    const baseReward = Math.floor(activeChallenge.durationMinutes / 30);

    return (
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Reto grupal — {activeChallenge.durationMinutes} min</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Premio base: <strong>{baseReward} monedas</strong> · Bote total:{' '}
              <strong>{activeChallenge.totalPot} monedas</strong>
            </p>
            <p className="text-sm text-gray-500">
              Estado: {activeChallenge.status === 'betting' ? 'Apuestas abiertas' : activeChallenge.status}
            </p>

            {activeChallenge.status === 'betting' && (
              <>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Monedas a apostar"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                  />
                  <Button onClick={handleBet} disabled={loading}>
                    Apostar
                  </Button>
                </div>

                {canStart && (
                  <Button onClick={handleStart} disabled={loading} className="w-full">
                    Iniciar reto
                  </Button>
                )}
              </>
            )}

            <div>
              <p className="text-sm font-medium mb-2">Participantes</p>
              <ul className="space-y-1">
                {(activeChallenge.participants || []).map((p) => (
                  <li key={p.userId} className="text-sm flex justify-between">
                    <span>{p.displayName}{p.isMe ? ' (tú)' : ''}</span>
                    <span className="text-gray-500">
                      {p.betAmount > 0 ? `${p.betAmount} 🪙` : ''} · {p.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Crear reto grupal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Duración mínima 30 min. Premio: 1 moneda por cada 30 minutos.
            Los que no cojan el móvil se reparten el bote.
          </p>
          <div>
            <label className="text-sm font-medium">Duración (minutos)</label>
            <Input
              type="number"
              min={30}
              step={30}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10) || 30)}
              className="mt-1"
            />
          </div>
          <p className="text-sm text-gray-500">
            Premio base: {Math.floor(duration / 30)} monedas
          </p>
          <Button onClick={handleCreate} disabled={creating} className="w-full">
            {creating ? <Spinner className="w-4 h-4" /> : 'Crear reto grupal'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
