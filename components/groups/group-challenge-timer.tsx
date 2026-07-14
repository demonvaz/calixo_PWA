'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

interface GroupChallengeTimerProps {
  durationMinutes: number;
  challengeId: string;
  groupId: string;
  onComplete: () => void;
  onFail: () => void;
}

export function GroupChallengeTimer({
  durationMinutes,
  challengeId,
  groupId,
  onComplete,
  onFail,
}: GroupChallengeTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [failed, setFailed] = useState(false);
  const startTimeRef = useRef(new Date().toISOString());
  const failedRef = useRef(false);
  const toast = useToast();

  const totalSeconds = durationMinutes * 60;
  const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);
  const progress = Math.min((elapsedSeconds / totalSeconds) * 100, 100);

  const reportFailure = useCallback(async (reason: string) => {
    if (failedRef.current) return;
    failedRef.current = true;
    setFailed(true);

    await fetch(`/api/groups/${groupId}/challenges/${challengeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'report-failure', reason }),
    });

    toast.error('Has cogido el móvil. Has fallado el reto.');
    onFail();
  }, [groupId, challengeId, onFail, toast]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        reportFailure('visibilitychange');
      }
    };

    const handlePageHide = () => reportFailure('pagehide');
    const handleBlur = () => {
      if (document.visibilityState === 'hidden') {
        reportFailure('blur');
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleBlur);
    };
  }, [reportFailure]);

  useEffect(() => {
    if (failed) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= totalSeconds) {
          clearInterval(interval);
          fetch(`/api/groups/${groupId}/challenges/${challengeId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'finish',
              sessionData: {
                durationSeconds: next,
                startTime: startTimeRef.current,
                endTime: new Date().toISOString(),
              },
            }),
          }).then(() => onComplete());
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [failed, totalSeconds, groupId, challengeId, onComplete]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (failed) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-8 text-center">
          <p className="text-red-600 font-semibold text-lg">Has fallado el reto</p>
          <p className="text-red-500 text-sm mt-2">Saliste de la aplicación durante el reto grupal</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reto grupal en curso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-5xl font-bold text-primary">{formatTime(remainingSeconds)}</div>
          <p className="text-sm text-gray-500 mt-1">Tiempo restante</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          No salgas de la app ni bloquees la pantalla. Si coges el móvil, fallarás el reto.
        </div>
      </CardContent>
    </Card>
  );
}
