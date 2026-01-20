'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChallengeTimer } from '@/components/challenges/challenge-timer';
import { ChallengeCompletionForm } from '@/components/challenges/challenge-completion-form';
import { ChallengeSuccessModal } from '@/components/challenges/challenge-success-modal';
import { useToast } from '@/components/ui/toast';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { Spinner } from '@/components/ui/spinner';

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
  const toast = useToast();
  const confirmDialog = useConfirmDialog();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Challenge state - simple and direct
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [userChallengeId, setUserChallengeId] = useState<number | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [completionData, setCompletionData] = useState<{
    coinsEarned: number;
    feedItemId?: number;
  } | null>(null);
  
  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/challenges?type=daily');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('API Response:', data);
      console.log('Challenges:', data.challenges);
      
      // Asegurarse de que challenges sea un array
      const challengesArray = Array.isArray(data.challenges) ? data.challenges : [];
      setChallenges(challengesArray);
      setUserProfile(data.userProfile || null);
      
      if (challengesArray.length === 0) {
        console.warn('No se encontraron retos en la respuesta de la API');
      }
    } catch (err) {
      console.error('Error fetching challenges:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChallenge = async (challenge: Challenge) => {
    if (!challenge || !challenge.id) {
      setError('Error: Reto inválido');
      return;
    }

    try {
      console.log('Starting challenge:', challenge.id);
      const response = await fetch('/api/challenges/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge.id }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('Error response:', data);
        throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setActiveChallenge(challenge);
      setUserChallengeId(data.userChallenge.id);
      setShowTimer(true);
      setShowCompletion(false);
    } catch (err) {
      console.error('Error starting challenge:', err);
      setError(err instanceof Error ? err.message : 'Error al iniciar el reto');
    }
  };

  // Simple completion handler
  const handleChallengeComplete = (data: SessionData) => {
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

      toast.error(`Reto fallido: ${reason}`, 6000);
      resetState();
      fetchChallenges();
    } catch (err) {
      console.error('Error al marcar reto como fallido:', err);
    }
  };

  const handleChallengeCancel = () => {
    confirmDialog.confirm({
      title: 'Cancelar reto',
      message: '¿Estás seguro de que quieres cancelar este reto?',
      confirmText: 'Sí, cancelar',
      cancelText: 'No, continuar',
      confirmVariant: 'destructive',
      onConfirm: async () => {
        if (!userChallengeId) {
          resetState();
          return;
        }

        try {
          await fetch('/api/challenges/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userChallengeId }),
          });
          toast.info('Reto cancelado');
        } catch (err) {
          console.error('Error al cancelar el reto:', err);
          toast.error('Error al cancelar el reto');
        } finally {
          resetState();
        }
      },
    });
  };

  const handleSubmitCompletion = async (imageUrl: string, note: string) => {
    if (!userChallengeId || !sessionData) {
      toast.error('Error: Datos del reto no encontrados');
      return;
    }

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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Error al completar el reto';
        console.error('Error completing challenge:', errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Hide completion form and show success modal
      setShowCompletion(false);
      setCompletionData({
        coinsEarned: data.coinsEarned,
        feedItemId: data.feedItem?.id,
      });
      setShowSuccessModal(true);
      
      toast.success(`¡Reto completado! Ganaste ${data.coinsEarned} monedas`, 5000);
    } catch (err) {
      console.error('Error in handleSubmitCompletion:', err);
      // Re-throw to be handled by the form, but ensure error is logged
      throw err;
    }
  };

  const handleSkipCompletion = async () => {
    if (!userChallengeId || !sessionData) {
      toast.error('Error: Datos del reto no encontrados');
      return;
    }

    try {
      const response = await fetch('/api/challenges/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userChallengeId,
          sessionData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Error al completar el reto';
        console.error('Error completing challenge:', errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Hide completion form and show success modal
      setShowCompletion(false);
      setCompletionData({
        coinsEarned: data.coinsEarned,
        feedItemId: data.feedItem?.id,
      });
      setShowSuccessModal(true);
      
      toast.success(`¡Reto completado! Ganaste ${data.coinsEarned} monedas`, 5000);
    } catch (err) {
      console.error('Error in handleSkipCompletion:', err);
      toast.error(err instanceof Error ? err.message : 'Error al completar el reto');
    }
  };

  const resetState = () => {
    setActiveChallenge(null);
    setUserChallengeId(null);
    setShowTimer(false);
    setShowCompletion(false);
    setShowSuccessModal(false);
    setSessionData(null);
    setCompletionData(null);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    resetState();
    fetchChallenges();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
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

  if (showCompletion) {
    // If activeChallenge is null, try to recover or show error
    if (!activeChallenge) {
      console.error('Error: showCompletion is true but activeChallenge is null');
      return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Error al completar el reto
              </h2>
              <p className="text-gray-600 mb-4">
                No se pudo cargar la información del reto completado.
              </p>
              <Button onClick={() => {
                resetState();
                fetchChallenges();
              }}>
                Volver a los retos
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return (
      <>
        {/* Success Modal - Show on top of completion form */}
        {showSuccessModal && completionData && (
          <ChallengeSuccessModal
            isOpen={showSuccessModal}
            challengeTitle={activeChallenge.title}
            coinsEarned={completionData.coinsEarned}
            feedItemId={completionData.feedItemId}
            onClose={handleCloseSuccessModal}
          />
        )}
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <ChallengeCompletionForm
            challengeTitle={activeChallenge.title}
            coinsEarned={activeChallenge.reward}
            onSubmit={handleSubmitCompletion}
            onSkip={handleSkipCompletion}
          />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Success Modal */}
      {showSuccessModal && activeChallenge && completionData && (
        <ChallengeSuccessModal
          isOpen={showSuccessModal}
          challengeTitle={activeChallenge.title}
          coinsEarned={completionData.coinsEarned}
          feedItemId={completionData.feedItemId}
          onClose={handleCloseSuccessModal}
        />
      )}

      {/* Main Content */}
      <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Retos Diarios
          </h1>
          <p className="text-gray-600">
            Desconéctate del mundo digital y reconecta contigo mismo
          </p>
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
            <Card key={challenge.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center justify-between">
                  <span className="line-clamp-2">{challenge.title}</span>
                  <span className="text-yellow-600 text-sm flex-shrink-0 ml-2">
                    🪙 {challenge.reward}
                  </span>
                </CardTitle>
                <CardDescription>
                  ⏱️ {challenge.durationMinutes} minutos
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col">
                <p className="text-sm text-gray-600 line-clamp-3 flex-grow">
                  {challenge.description}
                </p>
              </CardContent>
              <CardFooter className="flex-shrink-0">
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
    </>
  );
}






