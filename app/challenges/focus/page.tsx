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
}

interface SessionData {
  durationSeconds: number;
  interruptions: number;
  startTime: string;
  endTime?: string;
}

export default function FocusModePage() {
  const router = useRouter();
  const toast = useToast();
  const confirmDialog = useConfirmDialog();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Focus mode state
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [customDuration, setCustomDuration] = useState<number>(60); // minutes
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
      const response = await fetch('/api/challenges?type=focus');
      if (!response.ok) {
        throw new Error('Error al cargar los retos');
      }
      const data = await response.json();
      setChallenges(data.challenges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setCustomDuration(challenge.durationMinutes);
  };

  const handleStartFocus = async () => {
    if (!selectedChallenge || !selectedChallenge.id) {
      setError('Error: Reto inválido');
      return;
    }

    // Validate duration (max 23 hours)
    if (customDuration > 23 * 60) {
      setError('La duración máxima es de 23 horas');
      return;
    }

    if (customDuration < 1) {
      setError('La duración mínima es de 1 minuto');
      return;
    }

    try {
      console.log('Starting focus challenge:', selectedChallenge.id, 'duration:', customDuration);
      const response = await fetch('/api/challenges/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: selectedChallenge.id,
          customDuration,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('Error response:', data);
        throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setUserChallengeId(data.userChallenge.id);
      setShowTimer(true);
    } catch (err) {
      console.error('Error starting focus challenge:', err);
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

      toast.error(`Reto fallido: ${reason}. No te preocupes, puedes intentarlo de nuevo.`, 6000);
      resetState();
      fetchChallenges();
    } catch (err) {
      console.error('Error al marcar reto como fallido:', err);
    }
  };

  const handleChallengeCancel = () => {
    confirmDialog.confirm({
      title: 'Cancelar reto',
      message: '¿Estás seguro de que quieres cancelar este reto de enfoque?',
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
    setSelectedChallenge(null);
    setUserChallengeId(null);
    setShowTimer(false);
    setShowCompletion(false);
    setShowSuccessModal(false);
    setSessionData(null);
    setCompletionData(null);
    setCustomDuration(60);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    resetState();
    fetchChallenges();
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (showTimer && selectedChallenge) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <ChallengeTimer
          durationMinutes={customDuration}
          challengeTitle={selectedChallenge.title}
          onComplete={handleChallengeComplete}
          onFail={handleChallengeFail}
          onCancel={handleChallengeCancel}
        />
      </div>
    );
  }

  if (showCompletion && selectedChallenge) {
    return (
      <>
        {/* Success Modal - Show on top of completion form */}
        {showSuccessModal && completionData && (
          <ChallengeSuccessModal
            isOpen={showSuccessModal}
            challengeTitle={selectedChallenge.title}
            coinsEarned={completionData.coinsEarned}
            feedItemId={completionData.feedItemId}
            onClose={handleCloseSuccessModal}
          />
        )}
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <ChallengeCompletionForm
            challengeTitle={selectedChallenge.title}
            coinsEarned={selectedChallenge.reward}
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
      {showSuccessModal && selectedChallenge && completionData && (
        <ChallengeSuccessModal
          isOpen={showSuccessModal}
          challengeTitle={selectedChallenge.title}
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
              Modo Enfoque
            </h1>
          <p className="text-gray-600">
            Concéntrate sin distracciones en lo que realmente importa
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {selectedChallenge ? (
          /* Custom Duration Form */
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>{selectedChallenge.title}</CardTitle>
              <CardDescription>{selectedChallenge.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Duration Slider */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Duración: {formatDuration(customDuration)}
                </label>
                <input
                  type="range"
                  min="1"
                  max={23 * 60}
                  step="5"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 min</span>
                  <span>23 horas</span>
                </div>
              </div>

              {/* Quick Options */}
              <div>
                <p className="text-sm font-medium mb-2">Opciones rápidas:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[25, 60, 90, 120, 180, 240].map((mins) => (
                    <Button
                      key={mins}
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomDuration(mins)}
                      className={customDuration === mins ? 'bg-blue-50 border-blue-500' : ''}
                    >
                      {formatDuration(mins)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Reward Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Recompensa:</span>
                  <span className="text-lg font-bold text-yellow-600">
                    🪙 {selectedChallenge.reward} monedas
                  </span>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                ⚠️ <strong>Importante:</strong> No minimices la ventana ni cambies de pestaña.
                Si lo haces, el reto fallará automáticamente.
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedChallenge(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleStartFocus}
                className="flex-1"
              >
                Comenzar 🚀
              </Button>
            </CardFooter>
          </Card>
        ) : (
          /* Challenge Selection */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{challenge.title}</span>
                    <span className="text-yellow-600 text-sm">
                      🪙 {challenge.reward}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    ⏱️ Sugerido: {formatDuration(challenge.durationMinutes)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {challenge.description}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleSelectChallenge(challenge)}
                    className="w-full"
                  >
                    Seleccionar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {challenges.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No hay retos de enfoque disponibles
            </h2>
            <p className="text-gray-600">
              Consulta con el administrador para agregar nuevos retos
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}






