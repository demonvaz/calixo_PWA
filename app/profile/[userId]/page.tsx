'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfilePostCard } from '@/components/profile/profile-post-card';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import { FollowersModal } from '@/components/profile/followers-modal';
import { EnergyBanner } from '@/components/profile/energy-banner';
import { PremiumBadge } from '@/components/profile/premium-badge';
import Image from 'next/image';

interface UserProfile {
  profile: {
    userId: string;
    displayName: string;
    avatarEnergy: number;
    isPrivate: boolean;
    isPremium: boolean;
    createdAt: Date;
    profilePhotoUrl: string | null;
  };
  stats: {
    challengesCompleted: number;
    followersCount: number;
    followingCount: number;
  };
  isFollowing: boolean;
  canView: boolean;
}

interface FeedPostData {
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
    sessionData: any;
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
}

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [feedItems, setFeedItems] = useState<FeedPostData[]>([]);
  const [totalPosts, setTotalPosts] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<'followers' | 'following'>('followers');

  useEffect(() => {
    fetchCurrentUser();
    fetchProfile();
    fetchFeed();
  }, [userId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.profile?.userId);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/profile/${userId}`, { cache: 'no-store' });
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Usuario no encontrado');
        } else if (response.status === 403) {
          setError('Este perfil es privado');
        } else {
          throw new Error('Error al cargar el perfil');
        }
        return;
      }
      
      const data = await response.json();
      setProfileData(data);
      setIsFollowing(data.isFollowing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const PAGE_SIZE = 10;

  const fetchFeed = async (offset = 0, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoadingFeed(true);
      }
      const response = await fetch(
        `/api/profile/${userId}/feed?limit=${PAGE_SIZE}&offset=${offset}`
      );
      if (!response.ok) {
        if (response.status === 403) {
          setFeedItems([]);
          return;
        }
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

  const loadMore = () => fetchFeed(feedItems.length, true);

  const handleFollow = async () => {
    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: isFollowing ? 'unfollow' : 'follow',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al seguir');
      }

      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? 'Dejaste de seguir al usuario' : 'Ahora sigues a este usuario');
      
      // Refresh profile to update follower count
      await fetchProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al seguir');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={() => router.push('/feed')}>
                  Ir al Feed
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Volver
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  const isOwnProfile = currentUserId === userId;

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Botón volver - solo cuando ves perfil de otro */}
        {!isOwnProfile && (
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mb-2 gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Button>
        )}

        {/* Header - mismo layout que /profile (sin monedas) */}
        <div className="mb-6 relative">
          {/* Fila superior: foto + info */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
            {/* Foto - solo visualización, sin "Cambiar" */}
            <div className="flex flex-col items-center sm:items-start gap-3 flex-shrink-0">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-neutral/20 bg-gray-100">
                {profileData.profile.profilePhotoUrl ? (
                  <Image
                    src={profileData.profile.profilePhotoUrl}
                    alt={profileData.profile.displayName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary font-semibold text-2xl sm:text-3xl">
                    {profileData.profile.displayName[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>

            {/* Nombre + badge + botón acción + stats */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                    {profileData.profile.displayName}
                  </h1>
                  {profileData.profile.isPremium && (
                    <PremiumBadge size={20} className="flex-shrink-0" />
                  )}
                  {profileData.profile.isPrivate && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                      Privado
                    </span>
                  )}
                </div>
                {/* Botón Seguir / Editar perfil */}
                <div className="flex justify-center sm:justify-end">
                  {!isOwnProfile ? (
                    <Button
                      onClick={handleFollow}
                      variant={isFollowing ? 'outline' : 'default'}
                      className="flex-shrink-0"
                    >
                      {isFollowing ? 'Dejar de seguir' : 'Seguir'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => router.push('/profile')}
                      variant="outline"
                      className="flex-shrink-0"
                    >
                      Editar perfil
                    </Button>
                  )}
                </div>
              </div>

              {/* Stats: Retos, Seguidores, Siguiendo - compactos en móvil */}
              <div className="flex justify-center sm:justify-start gap-6 sm:gap-8 mt-4 text-sm">
                <div className="flex flex-col items-center sm:items-start gap-0.5">
                  <span className="font-semibold text-gray-900 text-base">
                    {profileData.stats.challengesCompleted}
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
                    {profileData.stats.followersCount}
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
                    {profileData.stats.followingCount}
                  </span>
                  <span className="text-gray-600 text-xs sm:text-sm">Siguiendo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Banner de energía (de esa persona); sin CTA de retos cuando no es tu perfil) */}
        <EnergyBanner
          energy={profileData.profile.avatarEnergy}
          showChallengesCta={isOwnProfile}
        />

        <FollowersModal
          isOpen={followersModalOpen}
          type={followersModalType}
          userId={userId}
          onClose={() => setFollowersModalOpen(false)}
        />

        {/* Timeline de publicaciones - grid simple */}
        <div className="mt-8 sm:mt-10">
          {loadingFeed ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : feedItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">
                  {error === 'Este perfil es privado'
                    ? 'Este perfil es privado. Sigue al usuario para ver sus publicaciones.'
                    : isOwnProfile
                      ? 'Aún no has compartido ninguna publicación.'
                      : 'Este usuario aún no ha compartido ninguna publicación.'}
                </p>
                {isOwnProfile && (
                  <>
                    <p className="text-sm text-gray-500 mt-2">
                      Completa retos y comparte tus logros para ver aquí tu timeline.
                    </p>
                    <Button asChild className="mt-4">
                      <a href="/challenges">Ir a retos</a>
                    </Button>
                  </>
                )}
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
    </div>
  );
}






