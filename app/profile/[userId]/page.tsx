'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarPreview } from '@/components/avatar/avatar-preview';
import { FeedPost } from '@/components/feed/feed-post';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import { FollowersModal } from '@/components/profile/followers-modal';
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

export default function PublicProfilePage({ params }: { params: { userId: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [feedItems, setFeedItems] = useState<FeedPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<'followers' | 'following'>('followers');

  useEffect(() => {
    fetchCurrentUser();
    fetchProfile();
    fetchFeed();
  }, [params.userId]);

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
      
      const response = await fetch(`/api/profile/${params.userId}`);
      
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

  const fetchFeed = async () => {
    try {
      setLoadingFeed(true);
      
      const response = await fetch(`/api/profile/${params.userId}/feed?limit=20&offset=0`);
      
      if (!response.ok) {
        if (response.status === 403) {
          // Profile is private, don't show error for feed
          setFeedItems([]);
          return;
        }
        throw new Error('Error al cargar las publicaciones');
      }
      
      const data = await response.json();
      setFeedItems(data.feedItems || []);
    } catch (err) {
      console.error('Error fetching feed:', err);
      setFeedItems([]);
    } finally {
      setLoadingFeed(false);
    }
  };

  const handleFollow = async () => {
    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: params.userId,
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

  const handleLike = async (feedItemId: number) => {
    try {
      const response = await fetch(`/api/feed/${feedItemId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al dar like');
      }

      // Refresh feed to show updated like count
      await fetchFeed();
    } catch (err) {
      console.error('Error liking post:', err);
      toast.error('Error al dar like');
    }
  };

  const handleCommentAdded = () => {
    fetchFeed();
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

  const isOwnProfile = currentUserId === params.userId;

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header - Estilo Twitter */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex items-start gap-4">
                {/* Profile Photo */}
                {profileData.profile.profilePhotoUrl ? (
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-neutral/10 flex items-center justify-center flex-shrink-0">
                    <Image
                      src={profileData.profile.profilePhotoUrl}
                      alt={profileData.profile.displayName}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-2xl md:text-3xl flex-shrink-0">
                    {profileData.profile.displayName[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                      {profileData.profile.displayName}
                    </h1>
                    {profileData.profile.isPremium && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Premium
                      </span>
                    )}
                    {profileData.profile.isPrivate && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        🔒 Privado
                      </span>
                    )}
                  </div>
                  
                  {/* Stats */}
                  <div className="flex gap-4 md:gap-6 mt-3 text-sm">
                    <div>
                      <span className="font-semibold text-gray-900">{profileData.stats.challengesCompleted}</span>
                      <span className="text-gray-600 ml-1">Retos</span>
                    </div>
                    <button
                      onClick={() => {
                        setFollowersModalType('followers');
                        setFollowersModalOpen(true);
                      }}
                      className="hover:opacity-80 transition-opacity text-left"
                    >
                      <span className="font-semibold text-gray-900">{profileData.stats.followersCount}</span>
                      <span className="text-gray-600 ml-1">Seguidores</span>
                    </button>
                    <button
                      onClick={() => {
                        setFollowersModalType('following');
                        setFollowersModalOpen(true);
                      }}
                      className="hover:opacity-80 transition-opacity text-left"
                    >
                      <span className="font-semibold text-gray-900">{profileData.stats.followingCount}</span>
                      <span className="text-gray-600 ml-1">Siguiendo</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Follow Button */}
              {!isOwnProfile && (
                <Button
                  onClick={handleFollow}
                  variant={isFollowing ? 'outline' : 'default'}
                  className="flex-shrink-0"
                >
                  {isFollowing ? 'Dejar de seguir' : 'Seguir'}
                </Button>
              )}
              {isOwnProfile && (
                <Button
                  onClick={() => router.push('/profile')}
                  variant="outline"
                  className="flex-shrink-0"
                >
                  Editar perfil
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        <FollowersModal
          isOpen={followersModalOpen}
          type={followersModalType}
          userId={params.userId}
          onClose={() => setFollowersModalOpen(false)}
        />

        {/* Feed Posts - Estilo Twitter */}
        {loadingFeed ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : feedItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">
                {error === 'Este perfil es privado' 
                  ? 'Este perfil es privado. Sigue al usuario para ver sus publicaciones.'
                  : 'Este usuario aún no ha compartido ninguna publicación'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {feedItems.map((post) => (
              <FeedPost
                key={post.feedItem.id}
                post={post}
                currentUserId={currentUserId}
                onLike={handleLike}
                onCommentAdded={handleCommentAdded}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}






