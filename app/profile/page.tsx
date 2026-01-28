'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { ProfilePhotoModal } from '@/components/profile/profile-photo-modal';
import Image from 'next/image';

type Profile = {
  userId: string;
  displayName: string;
  avatarEnergy: number;
  isPrivate: boolean;
  isPremium: boolean;
  coins: number;
  streak: number;
  createdAt: Date;
  updatedAt: Date;
  profilePhotoUrl?: string | null;
  profilePhotoPath?: string | null;
};

type UserChallenge = {
  id: number;
  challengeId: number;
  challengeTitle: string;
  challengeType: string;
  reward: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'canceled';
  statusDate: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    fetchUserChallenges();
  }, [currentPage]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error('Error al cargar el perfil');
      }

      const data = await response.json();
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserChallenges = async () => {
    try {
      setLoadingChallenges(true);
      const response = await fetch(`/api/profile/challenges?page=${currentPage}&limit=5`);
      
      if (!response.ok) {
        if (response.status === 401) {
          return;
        }
        throw new Error('Error al cargar los retos');
      }

      const data = await response.json();
      setUserChallenges(data.challenges || []);
      setPagination(data.pagination || {
        page: 1,
        limit: 5,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
    } catch (err) {
      console.error('Error fetching challenges:', err);
    } finally {
      setLoadingChallenges(false);
    }
  };

  const getChallengeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: 'Diario',
      focus: 'Enfoque',
      social: 'Social',
    };
    return labels[type] || type;
  };

  const getChallengeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      daily: 'bg-blue-100 text-blue-800',
      focus: 'bg-purple-100 text-purple-800',
      social: 'bg-green-100 text-green-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      in_progress: 'En Progreso',
      completed: 'Completado',
      failed: 'Fallido',
      canceled: 'Cancelado',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      canceled: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusDateLabel = (challenge: UserChallenge) => {
    if (challenge.status === 'completed' && challenge.completedAt) {
      return 'Completado el';
    } else if (challenge.status === 'failed' && challenge.failedAt) {
      return 'Fallido el';
    } else if (challenge.status === 'canceled' && challenge.failedAt) {
      return 'Cancelado el';
    } else if (challenge.startedAt) {
      return 'Iniciado el';
    }
    return 'Creado el';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-red-600">
                {error || 'No se pudo cargar el perfil'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const energyLevel = 
    profile.avatarEnergy >= 70 ? 'Alta' :
    profile.avatarEnergy >= 40 ? 'Media' : 'Baja';

  const energyColor =
    profile.avatarEnergy >= 70 ? 'text-green-600' :
    profile.avatarEnergy >= 40 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
            <p className="text-gray-600 text-lg">@{profile.displayName}</p>
          </div>
          {/* Profile Photo */}
          <button
            onClick={() => setIsPhotoModalOpen(true)}
            className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-gray-300 hover:border-blue-500 transition-colors cursor-pointer bg-gray-100 flex-shrink-0"
            aria-label="Cambiar foto de perfil"
          >
            {profile.profilePhotoUrl ? (
              <Image
                src={profile.profilePhotoUrl}
                alt="Foto de perfil"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="text-white text-xs font-medium opacity-0 hover:opacity-100 transition-opacity">
                Cambiar
              </span>
            </div>
          </button>
        </div>

        {/* Profile Photo Modal */}
        <ProfilePhotoModal
          isOpen={isPhotoModalOpen}
          currentPhotoUrl={profile.profilePhotoUrl || null}
          onClose={() => setIsPhotoModalOpen(false)}
          onPhotoUpdated={() => {
            fetchProfile();
            setIsPhotoModalOpen(false);
          }}
        />

        {/* Error Message */}
        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
            <CardDescription>
              Tu progreso en Calixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{profile.coins}</p>
                <p className="text-sm text-gray-600">Monedas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{profile.streak}</p>
                <p className="text-sm text-gray-600">Racha (días)</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${energyColor}`}>
                  {profile.avatarEnergy}
                </p>
                <p className="text-sm text-gray-600">Energía ({energyLevel})</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {profile.isPremium ? 'Sí' : 'No'}
                </p>
                <p className="text-sm text-gray-600">
                  {profile.isPremium ? 'Premium' : 'Gratuito'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mis Retos</CardTitle>
            <CardDescription>
              Historial de todos tus retos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingChallenges ? (
              <div className="text-center py-8">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            ) : userChallenges.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No has iniciado ningún reto aún.</p>
                <p className="text-sm mt-2">¡Comienza un reto para verlo aquí!</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {userChallenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getChallengeTypeColor(challenge.challengeType)}`}>
                            {getChallengeTypeLabel(challenge.challengeType)}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(challenge.status)}`}>
                            {getStatusLabel(challenge.status)}
                          </span>
                          <h3 className="font-semibold text-gray-900">
                            {challenge.challengeTitle}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500">
                          {getStatusDateLabel(challenge)} {new Date(challenge.statusDate).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {challenge.status === 'completed' && (
                        <div className="ml-4 text-right">
                          <p className="text-lg font-bold text-green-600">
                            +{challenge.reward}
                          </p>
                          <p className="text-xs text-gray-500">monedas</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Paginación */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Mostrando {((currentPage - 1) * pagination.limit) + 1} - {Math.min(currentPage * pagination.limit, pagination.total)} de {pagination.total} retos
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={!pagination.hasPrevPage || loadingChallenges}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-gray-600 px-2">
                        Página {currentPage} de {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={!pagination.hasNextPage || loadingChallenges}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

