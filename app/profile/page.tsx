'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { ProfilePhotoModal } from '@/components/profile/profile-photo-modal';
import { ProfileSettingsModal } from '@/components/profile/profile-settings-modal';
import { FollowersModal } from '@/components/profile/followers-modal';
import { EnergyBanner } from '@/components/profile/energy-banner';
import { PremiumBadge } from '@/components/profile/premium-badge';
import { ProfilePostCard } from '@/components/profile/profile-post-card';
import Image from 'next/image';

type Profile = {
  userId: string;
  displayName: string;
  avatarEnergy: number;
  isPrivate: boolean;
  isPremium: boolean;
  coins: number;
  createdAt: Date;
  updatedAt: Date;
  profilePhotoUrl?: string | null;
  profilePhotoPath?: string | null;
  email?: string | null;
  gender?: string | null;
  birthDate?: string | null;
};

type ProfileStats = {
  challengesCompleted: number;
  followersCount: number;
  followingCount: number;
};

type FeedPostData = {
  feedItem: {
    id: number;
    imageUrl: string | null;
    note: string | null;
    likesCount: number;
    commentsCount: number;
    createdAt: Date;
  };
  profile: {
    userId: string;
    displayName: string;
    avatarEnergy: number;
    isPremium: boolean;
    profilePhotoUrl: string | null;
  } | null;
  userChallenge: {
    id: number;
    userId: string;
    challengeId: number;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    failedAt: string | null;
    sessionData: unknown;
    createdAt: string;
  } | null;
  challenge: {
    id: number;
    type: string;
    title: string;
    description: string;
    reward: number;
    durationMinutes: number;
    isActive: boolean;
    createdAt: string;
  } | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<FeedPostData[]>([]);
  const [totalPosts, setTotalPosts] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<'followers' | 'following'>('followers');

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile?.userId) {
      fetchFeed();
    }
  }, [profile?.userId]);

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
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const PAGE_SIZE = 10;

  const fetchFeed = async (offset = 0, append = false) => {
    if (!profile?.userId) return;
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoadingFeed(true);
      }
      const response = await fetch(
        `/api/profile/${profile.userId}/feed?limit=${PAGE_SIZE}&offset=${offset}`
      );

      if (!response.ok) {
        if (response.status === 401) return;
        throw new Error('Error al cargar las publicaciones');
      }

      const data = await response.json();
      const items = data.feedItems || [];

      if (append) {
        setFeedItems((prev) => [...prev, ...items]);
      } else {
        setFeedItems(items);
      }
      if (data.total !== undefined) setTotalPosts(data.total);
      setHasMore(data.hasMore ?? false);
    } catch (err) {
      console.error('Error fetching feed:', err);
      if (!append) setFeedItems([]);
    } finally {
      setLoadingFeed(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    fetchFeed(feedItems.length, true);
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

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header - Layout optimizado para móvil y desktop */}
        <div className="mb-6 relative">
          {/* Botón ajustes - esquina superior derecha en móvil */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="absolute top-0 right-0 p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:hidden z-10"
            aria-label="Ajustes del perfil"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Fila superior: foto + info en móvil, todo en línea en desktop */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
            {/* Foto - monedas debajo solo en móvil */}
            <div className="flex flex-col items-center sm:items-start gap-3 flex-shrink-0">
              <button
                onClick={() => setIsPhotoModalOpen(true)}
                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-neutral/20 hover:border-primary/50 transition-colors cursor-pointer bg-gray-100"
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
                  <div className="w-full h-full flex items-center justify-center text-gray-400" />
                )}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="text-white text-xs font-medium opacity-0 hover:opacity-100 transition-opacity">
                    Cambiar
                  </span>
                </div>
              </button>
              {/* Monedas debajo de la foto - solo móvil */}
              <div className="flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-primary font-semibold text-sm">{profile.coins}</span>
                <span className="text-neutral text-xs">monedas</span>
              </div>
            </div>

            {/* Nombre + badge + ajustes + monedas (desktop) + stats */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  {profile.displayName}
                </h1>
                {profile.isPremium && (
                  <PremiumBadge size={20} className="flex-shrink-0" />
                )}
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="hidden sm:flex p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Ajustes del perfil"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
                </div>
                {/* Monedas a la derecha - solo desktop */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 flex-shrink-0">
                  <span className="text-primary font-semibold text-base">{profile.coins}</span>
                  <span className="text-neutral text-sm">monedas</span>
                </div>
              </div>

              {/* Stats: Retos, Seguidores, Siguiendo - compactos en móvil */}
              <div className="flex justify-center sm:justify-start gap-6 sm:gap-8 mt-4 text-sm">
                <div className="flex flex-col items-center sm:items-start gap-0.5">
                  <span className="font-semibold text-gray-900 text-base">
                    {stats?.challengesCompleted ?? 0}
                  </span>
                  <span className="text-gray-600 text-xs sm:text-sm">Retos</span>
                </div>
                <button
                  onClick={() => {
                    setFollowersModalType('followers');
                    setFollowersModalOpen(true);
                  }}
                  className="hover:opacity-80 transition-opacity flex flex-col items-center sm:items-start gap-0.5"
                >
                  <span className="font-semibold text-gray-900 text-base">
                    {stats?.followersCount ?? 0}
                  </span>
                  <span className="text-gray-600 text-xs sm:text-sm">Seguidores</span>
                </button>
                <button
                  onClick={() => {
                    setFollowersModalType('following');
                    setFollowersModalOpen(true);
                  }}
                  className="hover:opacity-80 transition-opacity flex flex-col items-center sm:items-start gap-0.5"
                >
                  <span className="font-semibold text-gray-900 text-base">
                    {stats?.followingCount ?? 0}
                  </span>
                  <span className="text-gray-600 text-xs sm:text-sm">Siguiendo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Banner de energía */}
        <EnergyBanner energy={profile.avatarEnergy} />

        {/* Profile Photo Modal */}
        <ProfilePhotoModal
          isOpen={isPhotoModalOpen}
          currentPhotoUrl={profile.profilePhotoUrl || null}
          onClose={() => setIsPhotoModalOpen(false)}
          onPhotoUpdated={(newPhotoUrl) => {
            // Update profile immediately if URL is provided
            if (newPhotoUrl !== undefined) {
              setProfile(prev => prev ? { ...prev, profilePhotoUrl: newPhotoUrl || null } : null);
            }
            // Always refresh profile to get latest data
            fetchProfile();
            setIsPhotoModalOpen(false);
          }}
        />

        {/* Profile Settings Modal */}
        <ProfileSettingsModal
          isOpen={isSettingsModalOpen}
          currentProfile={{
            displayName: profile.displayName,
            email: profile.email || null,
            gender: profile.gender || null,
            birthDate: profile.birthDate || null,
            isPrivate: profile.isPrivate,
          }}
          onClose={() => setIsSettingsModalOpen(false)}
          onProfileUpdated={() => {
            fetchProfile();
            setIsSettingsModalOpen(false);
          }}
        />

        <FollowersModal
          isOpen={followersModalOpen}
          type={followersModalType}
          onClose={() => setFollowersModalOpen(false)}
        />

        {/* Error Message */}
        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Timeline de publicaciones - grid simple */}
        {loadingFeed ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : feedItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">
                Aún no has compartido ninguna publicación.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Completa retos y comparte tus logros para ver aquí tu timeline.
              </p>
              <Button asChild className="mt-4">
                <a href="/challenges">Ir a retos</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {totalPosts !== null && (
              <p className="text-sm text-neutral-500 mb-3">
                {totalPosts === 1
                  ? '1 publicación'
                  : `${totalPosts} publicaciones`}
              </p>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
              {feedItems.map((post) => (
                <ProfilePostCard
                  key={post.feedItem.id}
                  feedItem={post.feedItem}
                  challenge={post.challenge}
                />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center pt-6">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="min-w-[140px]"
                >
                  {loadingMore ? (
                    <Spinner size="sm" />
                  ) : (
                    'Cargar más'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

