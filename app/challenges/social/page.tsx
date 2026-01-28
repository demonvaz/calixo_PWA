'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';

interface Challenge {
  id: number;
  type: string;
  title: string;
  description: string;
  reward: number;
  durationMinutes: number;
}

interface SocialSession {
  id: number;
  inviterId: string;
  inviteeId: string;
  challengeId: number;
  status: string;
  acceptedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export default function SocialChallengesPage() {
  const router = useRouter();
  const toast = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [sessions, setSessions] = useState<SocialSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [challengesRes, sessionsRes] = await Promise.all([
        fetch('/api/challenges?type=social'),
        fetch('/api/challenges/social'),
      ]);

      if (!challengesRes.ok || !sessionsRes.ok) {
        throw new Error('Error al cargar los datos');
      }

      const challengesData = await challengesRes.json();
      const sessionsData = await sessionsRes.json();

      setChallenges(challengesData.challenges);
      setSessions(sessionsData.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChallenge || !inviteeEmail) return;

    setIsCreating(true);
    setError('');

    try {
      // TODO: Get user ID from email
      // For now, this is a placeholder
      const response = await fetch('/api/challenges/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteeId: inviteeEmail, // In production, this would be the user ID
          challengeId: selectedChallenge.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear la invitación');
      }

      toast.success('Invitación enviada');
      setShowCreateForm(false);
      setSelectedChallenge(null);
      setInviteeEmail('');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la invitación');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAcceptInvitation = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/challenges/social/${sessionId}/accept`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al aceptar la invitación');
      }

      toast.success('Invitación aceptada. ¡Prepárate para el reto!');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aceptar');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
            Retos Sociales
          </h1>
          <p className="text-gray-600">
            Desconéctate junto a tus amigos y familia
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Create Button */}
        {!showCreateForm && (
          <div className="mb-8">
            <Button
              onClick={() => setShowCreateForm(true)}
              className="w-full md:w-auto"
            >
              ➕ Crear Nuevo Reto Social
            </Button>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Crear Reto Social</CardTitle>
              <CardDescription>
                Invita a un amigo a desconectarse contigo
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateInvitation}>
              <CardContent className="space-y-4">
                {/* Challenge Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Selecciona un reto:
                  </label>
                  <div className="grid gap-3">
                    {challenges.map((challenge) => (
                      <div
                        key={challenge.id}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedChallenge?.id === challenge.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedChallenge(challenge)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{challenge.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {challenge.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {challenge.durationMinutes} min • {challenge.reward} monedas
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email del amigo:
                  </label>
                  <input
                    type="email"
                    value={inviteeEmail}
                    onChange={(e) => setInviteeEmail(e.target.value)}
                    placeholder="amigo@ejemplo.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tu amigo recibirá una notificación para unirse al reto
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setSelectedChallenge(null);
                    setInviteeEmail('');
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedChallenge || !inviteeEmail || isCreating}
                  className="flex-1"
                >
                  {isCreating ? 'Enviando...' : 'Enviar Invitación'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Sessions List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Tus Retos Sociales</h2>
          
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No tienes retos sociales
              </h3>
              <p className="text-gray-600 mb-4">
                Crea un nuevo reto e invita a tus amigos
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => {
                const challenge = challenges.find((c) => c.id === session.challengeId);
                return (
                  <Card key={session.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {challenge?.title || 'Reto Social'}
                      </CardTitle>
                      <CardDescription>
                        {session.status === 'pending' && 'Esperando respuesta...'}
                        {session.status === 'in_progress' && 'En progreso'}
                        {session.status === 'completed' && 'Completado'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Duración:</span> {challenge?.durationMinutes} minutos
                        </p>
                        <p>
                          <span className="font-medium">Recompensa:</span> {challenge?.reward} monedas
                        </p>
                        <p>
                          <span className="font-medium">Creado:</span>{' '}
                          {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                    {session.status === 'pending' && (
                      <CardFooter>
                        <Button
                          onClick={() => handleAcceptInvitation(session.id)}
                          className="w-full"
                        >
                          Aceptar Invitación
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}






