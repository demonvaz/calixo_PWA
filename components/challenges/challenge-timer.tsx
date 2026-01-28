'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChallengeTimerProps {
  durationMinutes: number;
  challengeTitle: string;
  onComplete: (sessionData: SessionData) => void;
  onFail: (sessionData: SessionData, reason: string) => void;
  onCancel?: () => void;
}

interface SessionData {
  durationSeconds: number;
  interruptions: number;
  startTime: string;
  endTime?: string;
}

export function ChallengeTimer({
  durationMinutes,
  challengeTitle,
  onComplete,
  onFail,
  onCancel,
}: ChallengeTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const startTimeRef = useRef<string>(new Date().toISOString());
  const intervalRef = useRef<NodeJS.Timeout>();
  const onCompleteRef = useRef(onComplete);
  
  // Keep callback ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const totalSeconds = durationMinutes * 60;
  const progress = Math.min((elapsedSeconds / totalSeconds) * 100, 100);
  const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionData = useCallback((): SessionData => {
    return {
      durationSeconds: elapsedSeconds,
      interruptions: 0, // Ya no rastreamos interrupciones en sistema de confianza
      startTime: startTimeRef.current,
      endTime: new Date().toISOString(),
    };
  }, [elapsedSeconds]);

  // Timer effect - Sistema de confianza: siempre cuenta, sin pausas
  useEffect(() => {
    if (isCompleted) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    // El timer siempre corre, independientemente de si la pestaña está visible o no
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        
        // When timer completes, defer the callback to avoid setState during render
        if (next >= totalSeconds) {
          setIsCompleted(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = undefined;
          }
          
          // Use setTimeout to defer callback until after render
          setTimeout(() => {
            const sessionData: SessionData = {
              durationSeconds: next,
              interruptions: 0,
              startTime: startTimeRef.current,
              endTime: new Date().toISOString(),
            };
            onCompleteRef.current(sessionData);
          }, 0);
          
          return next;
        }
        
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [isCompleted, totalSeconds]);

  const handleCancel = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (onCancel) {
      onCancel();
    }
  };

  if (isCompleted) {
    return null; // Parent component will handle the completion UI
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{challengeTitle}</CardTitle>
        <CardDescription>
          Sistema de confianza activo - El tiempo sigue contando siempre
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatTime(elapsedSeconds)}</span>
            <span>{formatTime(remainingSeconds)} restantes</span>
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center">
          <div className="text-6xl font-bold text-blue-600">
            {formatTime(remainingSeconds)}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Tiempo restante
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-around text-center border-t pt-4">
          <div>
            <div className="text-2xl font-semibold">{Math.floor(progress)}%</div>
            <div className="text-xs text-gray-500">Progreso</div>
          </div>
        </div>

        {/* Info sobre sistema de confianza */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
          Sistema de confianza - El tiempo sigue contando aunque cambies de pantalla o uses otras apps
        </div>

        {/* Cancel Button */}
        <Button
          variant="outline"
          onClick={handleCancel}
          className="w-full"
        >
          Cancelar Reto
        </Button>

        {/* Info */}
        <p className="text-xs text-center text-gray-500">
          Confiamos en ti - El tiempo sigue contando siempre, incluso si usas otras apps
        </p>
      </CardContent>
    </Card>
  );
}






