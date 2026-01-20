'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarPreview } from '@/components/avatar/avatar-preview';
import { FeedPost } from '@/components/feed/feed-post';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';

interface UserProfile {
  profile: {
    userId: string;
    displayName: string;
    avatarEnergy: number;
    isPrivate: boolean;
    isPremium: boolean;
    streak: number;
    createdAt: Date;
  };
  stats: {
    challengesCompleted: number;
    followersCount: number;
    followingCount: number;
  };
  isFollowing: boolean;
  canView: boolean;
  feedItems: any[];
  equippedItems: Record<string, string>;
}

export default function PublicProfilePage({ params }: { params: { userId: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [params.userId]);

  const fetchProfile = async () => {
    try {
      // In a real app, this would be a proper endpoint
      // For now, we simulate it
      setError('Funcionalidad de perfiles públicos próximamente');
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al seguir');
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Error/Coming Soon Message */}
        <Card>
          <CardHeader>
            <CardTitle>🚧 Próximamente</CardTitle>
            <CardDescription>
              Los perfiles públicos estarán disponibles en una futura actualización
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {error || 'Esta funcionalidad incluirá:'}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Ver el avatar y stats del usuario</li>
              <li>Ver sus posts completados</li>
              <li>Seguir/dejar de seguir</li>
              <li>Ver racha y logros</li>
              <li>Perfiles privados (solo para seguidores)</li>
            </ul>
            
            <div className="mt-6 flex gap-2">
              <Button onClick={() => router.push('/feed')}>
                Ir al Feed
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/profile')}
              >
                Ver mi perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






