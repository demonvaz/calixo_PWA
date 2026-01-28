'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChallengeSuccessModal } from '@/components/challenges/challenge-success-modal';
import { ActiveChallengeBanner } from '@/components/challenges/active-challenge-banner';
import { StartChallengeModal } from '@/components/challenges/start-challenge-modal';
import { ShareChallengeModal } from '@/components/challenges/share-challenge-modal';
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
  const [selectedChallengeForModal, setSelectedChallengeForModal] = useState<Challenge | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completionData, setCompletionData] = useState<{
    coinsEarned: number;
    feedItemId?: number;
  } | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<{
    id: number;
    challengeId: number;
    challengeTitle: string;
    challengeType: string;
    status: 'in_progress' | 'finished';
    startedAt: string;
    finishedAt?: string;
    durationMinutes: number;
    reward: number;
  } | null>(null);
  
  // Estado para el formulario de compartir después de reclamar
  const [showShareFormAfterClaim, setShowShareFormAfterClaim] = useState(false);
  const [shareChallengeDataAfterClaim, setShareChallengeDataAfterClaim] = useState<{
    userChallengeId: number;
    challengeTitle: string;
    reward: number;
  } | null>(null);

  useEffect(() => {
    fetchChallenges();
    fetchActiveChallenge();
  }, []);

  const fetchActiveChallenge = async () => {
    try {
      const response = await fetch('/api/challenges/active');
      if (response.ok) {
        const data = await response.json();
        setActiveChallenge(data.activeChallenge);
      }
    } catch (err) {
      console.error('Error fetching active challenge:', err);
    }
  };

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
    setSelectedChallengeForModal(challenge);
    setShowStartModal(true);
  };

  const handleStartFocus = async (customDuration?: number) => {
    if (!selectedChallengeForModal) return;

    try {
      const response = await fetch('/api/challenges/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: selectedChallengeForModal.id,
          customDuration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      // Actualizar el banner y refrescar la lista
      await fetchActiveChallenge();
      await fetchChallenges();
      
      toast.success('Reto iniciado. El tiempo está corriendo.');
    } catch (err) {
      console.error('Error starting focus challenge:', err);
      toast.error(err instanceof Error ? err.message : 'Error al iniciar el reto');
      throw err; // Re-throw para que el modal maneje el error
    }
  };


  const handleSubmitShareAfterClaim = async (imageUrl: string, note: string) => {
    if (!shareChallengeDataAfterClaim) return;

    try {
      const response = await fetch('/api/challenges/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userChallengeId: shareChallengeDataAfterClaim.userChallengeId,
          imageUrl,
          note,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al completar el reto');
      }

      const data = await response.json();
      
      setShowShareFormAfterClaim(false);
      setCompletionData({
        coinsEarned: data.coinsEarned,
        feedItemId: data.feedItem?.id,
      });
      setShowSuccessModal(true);
      
      const bonusText = data.shareBonus > 0 ? ` (+${data.shareBonus} por compartir)` : '';
      toast.success(`¡Reto completado! Ganaste ${data.coinsEarned} monedas${bonusText}`, 5000);
      
      fetchChallenges();
      fetchActiveChallenge();
    } catch (err) {
      console.error('Error submitting share:', err);
      toast.error(err instanceof Error ? err.message : 'Error al compartir');
      throw err;
    }
  };

  const handleSkipShareAfterClaim = async () => {
    // El reto ya está completado al reclamarlo, solo cerramos el modal
    // La notificación de recordatorio se crea en el modal
    setShowShareFormAfterClaim(false);
    setShareChallengeDataAfterClaim(null);
    fetchChallenges();
    fetchActiveChallenge();
  };


  const resetState = () => {
    setShowSuccessModal(false);
    setCompletionData(null);
    setShowShareFormAfterClaim(false);
    setShareChallengeDataAfterClaim(null);
  };

  const handleBannerCancel = () => {
    fetchActiveChallenge();
    fetchChallenges();
  };

  const handleBannerClaim = async () => {
    if (!activeChallenge) return;

    try {
      // Si el reto está en 'in_progress' pero el timer terminó, primero marcarlo como finished
      if (activeChallenge.status === 'in_progress') {
        const finishResponse = await fetch('/api/challenges/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userChallengeId: activeChallenge.id,
            sessionData: {
              durationSeconds: activeChallenge.durationMinutes * 60,
              interruptions: 0,
              startTime: activeChallenge.startedAt,
              endTime: new Date().toISOString(),
            }
          }),
        });

        if (!finishResponse.ok) {
          const errorData = await finishResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Error al finalizar el reto');
        }
      }

      // Ahora reclamar el reto
      const claimResponse = await fetch('/api/challenges/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userChallengeId: activeChallenge.id }),
      });

      if (!claimResponse.ok) {
        const errorData = await claimResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al reclamar el reto');
      }

      const claimData = await claimResponse.json();
      
      // Mostrar formulario de compartir directamente
      setShareChallengeDataAfterClaim({
        userChallengeId: activeChallenge.id,
        challengeTitle: activeChallenge.challengeTitle,
        reward: activeChallenge.reward,
      });
      setShowShareFormAfterClaim(true);
      setActiveChallenge(null); // Ocultar banner
      
      // Mostrar mensaje de éxito con las monedas ganadas
      toast.success(`¡Reto completado! Ganaste ${claimData.coinsEarned} monedas. Comparte para ganar 2 monedas extra.`, 5000);
      
      // Actualizar estado
      fetchChallenges();
      fetchActiveChallenge();
    } catch (err) {
      console.error('Error claiming challenge:', err);
      toast.error(err instanceof Error ? err.message : 'Error al reclamar el reto');
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    resetState();
    fetchChallenges();
    fetchActiveChallenge();
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

  return (
    <>
      {/* Modal para iniciar reto */}
      {selectedChallengeForModal && (
        <StartChallengeModal
          isOpen={showStartModal}
          challenge={selectedChallengeForModal}
          customDuration={selectedChallengeForModal.durationMinutes}
          onStart={handleStartFocus}
          onClose={() => {
            setShowStartModal(false);
            setSelectedChallengeForModal(null);
          }}
        />
      )}

      {/* Modal de compartir después de reclamar */}
      {shareChallengeDataAfterClaim && (
        <ShareChallengeModal
          isOpen={showShareFormAfterClaim}
          challengeTitle={shareChallengeDataAfterClaim.challengeTitle}
          coinsEarned={shareChallengeDataAfterClaim.reward}
          userChallengeId={shareChallengeDataAfterClaim.userChallengeId}
          onSubmit={handleSubmitShareAfterClaim}
          onSkip={handleSkipShareAfterClaim}
          onClose={() => {
            setShowShareFormAfterClaim(false);
            setShareChallengeDataAfterClaim(null);
          }}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && completionData && (
        <ChallengeSuccessModal
          isOpen={showSuccessModal}
          challengeTitle={shareChallengeDataAfterClaim?.challengeTitle || ''}
          coinsEarned={completionData.coinsEarned}
          feedItemId={completionData.feedItemId}
          onClose={handleCloseSuccessModal}
        />
      )}

      {/* Main Content */}
      <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Active Challenge Banner */}
          {activeChallenge && (
            <ActiveChallengeBanner
              challenge={activeChallenge}
              onCancel={handleBannerCancel}
              onClaim={handleBannerClaim}
            />
          )}

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
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

        {/* Challenge Selection */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge) => (
            <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{challenge.title}</span>
                  <span className="text-yellow-600 text-sm">
                    {challenge.reward} monedas
                  </span>
                </CardTitle>
                <CardDescription>
                  Sugerido: {formatDuration(challenge.durationMinutes)}
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
                  Iniciar Reto
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {challenges.length === 0 && !loading && (
          <div className="text-center py-12">
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






