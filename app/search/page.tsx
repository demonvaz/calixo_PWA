'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { AvatarPreview } from '@/components/avatar/avatar-preview';
import Link from 'next/link';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { getEnergyLevel } from '@/lib/avatar-energy';
import { Spinner } from '@/components/ui/spinner';

interface SearchResult {
  userId: string;
  displayName: string;
  avatarEnergy: number;
  isPremium: boolean;
  isPrivate: boolean;
  streak: number;
  coins: number;
  isFollowing: boolean;
  hasPendingRequest?: boolean;
  pendingRequestId?: number | null;
  followersCount: number;
}

export default function SearchPage() {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [followersCounts, setFollowersCounts] = useState<Record<string, number>>({});
  const [pendingRequests, setPendingRequests] = useState<Record<string, boolean>>({});

  // Debounce search query
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchUsers(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const searchUsers = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Error al buscar usuarios');
      }

      const data = await response.json();
      setResults(data.users || []);
      
      // Initialize following states
      const states = (data.users || []).reduce((acc: Record<string, boolean>, user: SearchResult) => {
        acc[user.userId] = user.isFollowing;
        return acc;
      }, {});
      setFollowingStates(states);

      // Initialize followers counts
      const counts = (data.users || []).reduce((acc: Record<string, number>, user: SearchResult) => {
        acc[user.userId] = user.followersCount;
        return acc;
      }, {});
      setFollowersCounts(counts);

      // Initialize pending requests
      const requests = (data.users || []).reduce((acc: Record<string, boolean>, user: SearchResult) => {
        if (user.hasPendingRequest) {
          acc[user.userId] = true;
        }
        return acc;
      }, {});
      setPendingRequests(requests);
    } catch (err) {
      console.error('Error searching:', err);
      toast.error('Error al buscar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string, currentState: boolean, hasPending: boolean) => {
    try {
      // If there's a pending request, cancel it
      if (hasPending) {
        const user = results.find(u => u.userId === userId);
        if (user?.pendingRequestId) {
          const response = await fetch(`/api/follow/requests/${user.pendingRequestId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Error al cancelar la solicitud');
          }

          setPendingRequests(prev => {
            const newState = { ...prev };
            delete newState[userId];
            return newState;
          });

          // Update results
          setResults(prev => prev.map(u => 
            u.userId === userId 
              ? { ...u, hasPendingRequest: false, pendingRequestId: null }
              : u
          ));

          toast.success('Solicitud cancelada');
          return;
        }
      }

      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: currentState ? 'unfollow' : 'follow',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al seguir');
      }

      const data = await response.json();

      // Update following state
      setFollowingStates(prev => ({
        ...prev,
        [userId]: !currentState && !data.requiresApproval,
      }));

      // Update pending request state if it requires approval
      if (data.requiresApproval) {
        setPendingRequests(prev => ({
          ...prev,
          [userId]: true,
        }));

        // Update results
        setResults(prev => prev.map(u => 
          u.userId === userId 
            ? { ...u, hasPendingRequest: true, pendingRequestId: data.requestId }
            : u
        ));
      }

      // Update followers count if provided
      if (data.followersCount !== undefined) {
        setFollowersCounts(prev => ({
          ...prev,
          [userId]: data.followersCount,
        }));

        // Also update in results array
        setResults(prev => prev.map(user => 
          user.userId === userId 
            ? { ...user, followersCount: data.followersCount }
            : user
        ));
      }

      const message = data.requiresApproval 
        ? 'Solicitud de seguimiento enviada'
        : currentState 
          ? 'Dejaste de seguir al usuario' 
          : 'Ahora sigues a este usuario';
      toast.success(message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al seguir');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
            Buscar Personas
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Encuentra y conecta con otros usuarios
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-4 md:mb-6">
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar por nombre..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 md:py-3 text-sm md:text-base"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Spinner size="sm" />
              </div>
            )}
          </div>
          {query.length > 0 && query.length < 2 && (
            <p className="mt-2 text-sm text-gray-500">
              Escribe al menos 2 caracteres para buscar
            </p>
          )}
        </div>

        {/* Results */}
        {debouncedQuery.length >= 2 && (
          <div className="space-y-4">
            {results.length === 0 && !loading ? (
              <Card>
                <CardContent className="py-8 md:py-12 px-4 md:px-6 text-center">
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
                    No se encontraron resultados
                  </h2>
                  <p className="text-sm md:text-base text-gray-600">
                    Intenta con otro término de búsqueda
                  </p>
                </CardContent>
              </Card>
            ) : (
              results.map((user) => (
                <Card key={user.userId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
                      {/* Avatar */}
                      <Link href={`/profile/${user.userId}`} className="flex-shrink-0">
                        <AvatarPreview
                          energyLevel={getEnergyLevel(user.avatarEnergy)}
                          equippedItems={{}}
                          size="sm"
                        />
                      </Link>

                      {/* User Info */}
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <Link href={`/profile/${user.userId}`}>
                          <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate hover:text-primary transition-colors">
                            {user.displayName}
                            {user.isPremium && (
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                Premium
                              </span>
                            )}
                          </h3>
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1 text-xs md:text-sm text-gray-600">
                          <span>{user.streak} racha</span>
                          <span>{followersCounts[user.userId] !== undefined ? followersCounts[user.userId] : user.followersCount} seguidores</span>
                          {user.isPrivate && (
                            <span className="text-gray-400">🔒 Privado</span>
                          )}
                        </div>
                      </div>

                      {/* Follow Button */}
                      <div className="flex-shrink-0 w-full sm:w-auto">
                        {pendingRequests[user.userId] || user.hasPendingRequest ? (
                          <Button
                            variant="outline"
                            onClick={() => handleFollow(user.userId, false, true)}
                            className="w-full sm:w-auto sm:min-w-[120px] text-xs md:text-sm"
                          >
                            Solicitud enviada
                          </Button>
                        ) : (
                          <Button
                            variant={followingStates[user.userId] ? 'outline' : 'default'}
                            onClick={() => handleFollow(
                              user.userId, 
                              followingStates[user.userId] || false,
                              false
                            )}
                            className="w-full sm:w-auto sm:min-w-[100px] text-xs md:text-sm"
                          >
                            {followingStates[user.userId] ? 'Siguiendo' : 'Seguir'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Empty State */}
        {debouncedQuery.length < 2 && (
          <Card>
            <CardContent className="py-8 md:py-12 px-4 md:px-6 text-center">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
                Busca personas
              </h2>
              <p className="text-sm md:text-base text-gray-600">
                Escribe el nombre de la persona que quieres encontrar
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
