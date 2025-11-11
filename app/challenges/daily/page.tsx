'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChallengeTimer } from '@/components/challenges/challenge-timer';
import { ChallengeCompletionForm } from '@/components/challenges/challenge-completion-form';

interface Challenge {
  id: number;
  type: string;
  title: string;
  description: string;
  reward: number;
  durationMinutes: number;
  canStart: boolean;
  reason: string;
}

interface UserProfile {
  isPremium: boolean;
  maxDailyChallenges: number;
  todaysChallengesCount: number;
}

interface SessionData {
  durationSeconds: number;
  interruptions: number;
  startTime: string;
  endTime?: string;
}

export default function DailyChallengesPage() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Challenge state
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [userChallengeId, setUserChallengeId] = useState<number | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/challenges?type=daily');
      if (!response.ok) {
        throw new Error('Error al cargar los retos');
      }
      const data = await response.json();
      setChallenges(data.challenges);
      setUserProfile(data.userProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChallenge = async (challenge: Challenge) => {
    try {
      const response = await fetch('/api/challenges/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al iniciar el reto');
      }

      const data = await response.json();
      setActiveChallenge(challenge);
      setUserChallengeId(data.userChallenge.id);
      setShowTimer(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar el reto');
    }
  };

  const handleChallengeComplete = async (data: SessionData) => {
    setSessionData(data);
    setShowTimer(false);
    setShowCompletion(true);
  };

  const handleChallengeFail = async (data: SessionData, reason: string) => {
    if (!userChallengeId) return;

    try {
      await fetch('/api/challenges/fail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userChallengeId,
          reason,
          sessionData: data,
        }),
      });

      alert(`❌ Reto fallido: ${reason}`);
      resetState();
      fetchChallenges();
    } catch (err) {
      console.error('Error al marcar reto como fallido:', err);
    }
  };

  const handleChallengeCancel = () => {
    if (confirm('¿Estás seguro de que quieres cancelar este reto?')) {
      resetState();
    }
  };

  const handleSubmitCompletion = async (imageUrl: string, note: string) => {
    if (!userChallengeId || !sessionData) return;

    try {
      const response = await fetch('/api/challenges/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userChallengeId,
          imageUrl,
          note,
          sessionData,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al completar el reto');
      }

      const data = await response.json();
      alert(`🎉 ¡Reto completado! Ganaste ${data.coinsEarned} monedas`);
      resetState();
      router.push('/dashboard');
    } catch (err) {
      throw err; // Re-throw to be handled by the form
    }
  };

  const handleSkipCompletion = async () => {
    if (!userChallengeId || !sessionData) return;

    try {
      await fetch('/api/challenges/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userChallengeId,
          sessionData,
        }),
      });

      router.push('/dashboard');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const resetState = () => {
    setActiveChallenge(null);
    setUserChallengeId(null);
    setShowTimer(false);
    setShowCompletion(false);
    setSessionData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando retos...</p>
        </div>
      </div>
    );
  }

  if (showTimer && activeChallenge) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <ChallengeTimer
          durationMinutes={activeChallenge.durationMinutes}
          challengeTitle={activeChallenge.title}
          onComplete={handleChallengeComplete}
          onFail={handleChallengeFail}
          onCancel={handleChallengeCancel}
        />
      </div>
    );
  }

  if (showCompletion && activeChallenge) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <ChallengeCompletionForm
          challengeTitle={activeChallenge.title}
          coinsEarned={activeChallenge.reward}
          onSubmit={handleSubmitCompletion}
          onSkip={handleSkipCompletion}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            ← Volver
          </Button>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Retos Diarios
          </h1>
          <p className="text-gray-600">
            Desconéctate del mundo digital y reconecta contigo mismo
          </p>

          {userProfile && (
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                {userProfile.isPremium ? '⭐ Premium' : '🆓 Gratis'}
              </div>
              <div className="text-gray-600">
                Retos de hoy: {userProfile.todaysChallengesCount} / {userProfile.maxDailyChallenges}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Challenges Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge) => (
            <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{challenge.title}</span>
                  <span className="text-yellow-600 text-sm">
                    🪙 {challenge.reward}
                  </span>
                </CardTitle>
                <CardDescription>
                  ⏱️ {challenge.durationMinutes} minutos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {challenge.description}
                </p>
              </CardContent>
              <CardFooter>
                {challenge.canStart ? (
                  <Button
                    onClick={() => handleStartChallenge(challenge)}
                    className="w-full"
                  >
                    Iniciar Reto
                  </Button>
                ) : (
                  <div className="w-full">
                    <Button
                      disabled
                      className="w-full mb-2"
                    >
                      No disponible
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      {challenge.reason}
                    </p>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {challenges.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😴</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No hay retos disponibles
            </h2>
            <p className="text-gray-600">
              Vuelve mañana para nuevos retos diarios
            </p>
          </div>
        )}
      </div>
    </div>
  );
}



