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
  const [interruptions, setInterruptions] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const startTimeRef = useRef<string>(new Date().toISOString());
  const intervalRef = useRef<NodeJS.Timeout>();
  const wasHiddenRef = useRef(false);
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
      interruptions,
      startTime: startTimeRef.current,
      endTime: new Date().toISOString(),
    };
  }, [elapsedSeconds, interruptions]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Tab became hidden
      wasHiddenRef.current = true;
      setIsPaused(true);
      
      // Increment interruptions
      setInterruptions((prev) => prev + 1);
      
      // Show notification that challenge was interrupted
      console.log('Challenge interrupted: tab hidden');
    } else {
      // Tab became visible again
      if (wasHiddenRef.current && !isCompleted) {
        // Challenge was interrupted, mark as failed
        setIsCompleted(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        // Use setTimeout to defer the callback to avoid setState during render
        setTimeout(() => {
          const sessionData = getSessionData();
          onFail(sessionData, 'Tab fue ocultado o minimizado');
        }, 0);
      }
    }
  }, [getSessionData, onFail, isCompleted]);

  // Timer effect - simple and direct
  useEffect(() => {
    if (isPaused || isCompleted) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

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
              interruptions,
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
  }, [isPaused, isCompleted, totalSeconds, interruptions]);

  // Visibility change listener
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

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
          {isPaused ? '⚠️ Reto pausado - Tab oculto' : 'Mantén esta pestaña visible'}
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
          <div>
            <div className="text-2xl font-semibold text-red-500">{interruptions}</div>
            <div className="text-xs text-gray-500">Interrupciones</div>
          </div>
        </div>

        {/* Warning */}
        {interruptions > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            ⚠️ Has tenido {interruptions} interrupción{interruptions > 1 ? 'es' : ''}. 
            Si ocultas la pestaña otra vez, el reto fallará automáticamente.
          </div>
        )}

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
          💡 No minimices la ventana ni cambies de pestaña durante el reto
        </p>
      </CardContent>
    </Card>
  );
}






