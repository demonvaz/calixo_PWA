'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChallengeSuccessModal } from '@/components/challenges/challenge-success-modal';
import { ActiveChallengeBanner } from '@/components/challenges/active-challenge-banner';
import { StartChallengeModal } from '@/components/challenges/start-challenge-modal';
import { StartFocusModal } from '@/components/challenges/start-focus-modal';
import { FocusModeBanner } from '@/components/challenges/focus-mode-banner';
import { ShareChallengeModal } from '@/components/challenges/share-challenge-modal';
import { useToast } from '@/components/ui/toast';
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

export default function ChallengesPage() {
  const toast = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [focusChallenge, setFocusChallenge] = useState<{ id: number; title: string; description?: string; type: string } | null>(null);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completionData, setCompletionData] = useState<{
    coinsEarned: number;
    feedItemId?: number;
  } | null>(null);
  const [activeChallengeBanner, setActiveChallengeBanner] = useState<{
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
        setActiveChallengeBanner(data.activeChallenge);
      }
    } catch (err) {
      console.error('Error fetching active challenge:', err);
    }
  };

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/challenges?type=daily');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const challengesArray = Array.isArray(data.challenges) ? data.challenges : [];
      setChallenges(challengesArray);
      setUserProfile(data.userProfile || null);
      setFocusChallenge(data.focusChallenge || null);
    } catch (err) {
      console.error('Error fetching challenges:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChallengeClick = (challenge: Challenge) => {
    if (!challenge?.id) {
      setError('Error: Reto inválido');
      return;
    }
    setSelectedChallenge(challenge);
    setShowStartModal(true);
  };

  const handleStartChallenge = async (customDuration?: number) => {
    if (!selectedChallenge) return;
    try {
      const response = await fetch('/api/challenges/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: selectedChallenge.id, customDuration }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      await fetchActiveChallenge();
      await fetchChallenges();
      toast.success('Reto iniciado. El tiempo está corriendo.');
    } catch (err) {
      console.error('Error starting challenge:', err);
      toast.error(err instanceof Error ? err.message : 'Error al iniciar el reto');
      throw err;
    }
  };

  const handleStartFocus = async (customDuration: number) => {
    if (!focusChallenge) return;
    try {
      const response = await fetch('/api/challenges/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: focusChallenge.id, customDuration }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      await fetchActiveChallenge();
      await fetchChallenges();
      setShowFocusModal(false);
      toast.success('Modo Focus iniciado. El tiempo está corriendo.');
    } catch (err) {
      console.error('Error starting focus challenge:', err);
      toast.error(err instanceof Error ? err.message : 'Error al iniciar el modo focus');
      throw err;
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
      setCompletionData({ coinsEarned: data.coinsEarned, feedItemId: data.feedItem?.id });
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
    if (!activeChallengeBanner) return;
    try {
      if (activeChallengeBanner.status === 'in_progress') {
        const finishResponse = await fetch('/api/challenges/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userChallengeId: activeChallengeBanner.id,
            sessionData: {
              durationSeconds: activeChallengeBanner.durationMinutes * 60,
              interruptions: 0,
              startTime: activeChallengeBanner.startedAt,
              endTime: new Date().toISOString(),
            },
          }),
        });
        if (!finishResponse.ok) {
          const errorData = await finishResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Error al finalizar el reto');
        }
      }
      const claimResponse = await fetch('/api/challenges/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userChallengeId: activeChallengeBanner.id }),
      });
      if (!claimResponse.ok) {
        const errorData = await claimResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al reclamar el reto');
      }
      const claimData = await claimResponse.json();
      setShareChallengeDataAfterClaim({
        userChallengeId: activeChallengeBanner.id,
        challengeTitle: activeChallengeBanner.challengeTitle,
        reward: claimData.coinsEarned ?? activeChallengeBanner.reward,
      });
      setShowShareFormAfterClaim(true);
      setActiveChallengeBanner(null);
      toast.success(`¡Reto completado! Ganaste ${claimData.coinsEarned} monedas. Comparte para ganar 2 monedas extra.`, 5000);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      {selectedChallenge && (
        <StartChallengeModal
          isOpen={showStartModal}
          challenge={selectedChallenge}
          onStart={handleStartChallenge}
          onClose={() => { setShowStartModal(false); setSelectedChallenge(null); }}
        />
      )}

      <StartFocusModal
        isOpen={showFocusModal}
        focusChallenge={focusChallenge}
        onStart={handleStartFocus}
        onClose={() => setShowFocusModal(false)}
      />

      {shareChallengeDataAfterClaim && (
        <ShareChallengeModal
          isOpen={showShareFormAfterClaim}
          challengeTitle={shareChallengeDataAfterClaim.challengeTitle}
          coinsEarned={shareChallengeDataAfterClaim.reward}
          userChallengeId={shareChallengeDataAfterClaim.userChallengeId}
          onSubmit={handleSubmitShareAfterClaim}
          onSkip={handleSkipShareAfterClaim}
          onClose={() => { setShowShareFormAfterClaim(false); setShareChallengeDataAfterClaim(null); }}
        />
      )}

      {showSuccessModal && completionData && (
        <ChallengeSuccessModal
          isOpen={showSuccessModal}
          challengeTitle={shareChallengeDataAfterClaim?.challengeTitle || ''}
          coinsEarned={completionData.coinsEarned}
          feedItemId={completionData.feedItemId}
          onClose={handleCloseSuccessModal}
        />
      )}

      <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          {activeChallengeBanner && (
            <ActiveChallengeBanner
              challenge={activeChallengeBanner}
              onCancel={handleBannerCancel}
              onClaim={handleBannerClaim}
            />
          )}

          <div className="mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">Retos</h1>
            <p className="text-gray-600">Desconéctate del mundo digital y reconecta contigo mismo</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center justify-between">
                    <span className="line-clamp-2">{challenge.title}</span>
                    <span className="text-yellow-600 text-sm flex-shrink-0 ml-2">{challenge.reward} monedas</span>
                  </CardTitle>
                  <CardDescription>{challenge.durationMinutes} minutos</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                  <p className="text-sm text-gray-600 line-clamp-3 flex-grow">{challenge.description}</p>
                </CardContent>
                <CardFooter className="flex-shrink-0">
                  {challenge.canStart ? (
                    <Button onClick={() => handleStartChallengeClick(challenge)} className="w-full">Iniciar Reto</Button>
                  ) : (
                    <div className="w-full">
                      <Button disabled className="w-full mb-2">No disponible</Button>
                      <p className="text-xs text-gray-500 text-center">{challenge.reason}</p>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {!(activeChallengeBanner?.challengeType === 'focus') && (
            <div className="mt-8">
              <FocusModeBanner
                isPremium={userProfile?.isPremium ?? false}
                focusChallenge={focusChallenge}
                onOpenModal={() => setShowFocusModal(true)}
              />
            </div>
          )}

          {challenges.length === 0 && !loading && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">No hay retos disponibles</h2>
              <p className="text-gray-600">Vuelve mañana para nuevos retos diarios</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
