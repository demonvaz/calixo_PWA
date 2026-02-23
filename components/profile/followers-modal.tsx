'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

export interface FollowUser {
  userId: string;
  displayName: string;
  profilePhotoUrl: string | null;
  isPrivate: boolean;
}

interface FollowersModalProps {
  isOpen: boolean;
  type: 'followers' | 'following';
  userId?: string;
  onClose: () => void;
}

const PAGE_SIZE = 50;

export function FollowersModal({ isOpen, type, userId, onClose }: FollowersModalProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const basePath = userId ? `/api/profile/${userId}` : '/api/profile';
  const endpoint = type === 'followers' ? `${basePath}/followers` : `${basePath}/following`;

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      const url = `${endpoint}?limit=${PAGE_SIZE}&offset=${offset}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al cargar');
      }

      const newUsers = data.users || [];
      const totalVal = data.total ?? 0;
      const hasMoreVal = data.hasMore ?? false;

      if (append) {
        setUsers((prev) => {
          const existingIds = new Set(prev.map((u) => u.userId));
          const unique = newUsers.filter((u) => !existingIds.has(u.userId));
          return [...prev, ...unique];
        });
      } else {
        setUsers(newUsers);
      }

      setTotal(totalVal);
      setHasMore(hasMoreVal);
      return { users: newUsers, hasMore: hasMoreVal };
    },
    [endpoint]
  );

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';
    setSearchQuery('');
    setUsers([]);
    setTotal(0);
    setHasMore(true);
    setLoading(true);

    fetchPage(0, false)
      .catch(() => {
        setUsers([]);
        setHasMore(false);
      })
      .finally(() => setLoading(false));

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, type, userId]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || users.length >= total) return;

    setLoadingMore(true);
    fetchPage(users.length, true)
      .catch(() => setHasMore(false))
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, users.length, total, fetchPage]);

  const loadAllRemaining = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      let offset = users.length;
      let hasMoreLocal = hasMore;
      while (hasMoreLocal) {
        const url = `${endpoint}?limit=${PAGE_SIZE}&offset=${offset}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok || !data.users?.length) break;

        setUsers((prev) => {
          const existingIds = new Set(prev.map((u) => u.userId));
          const unique = (data.users || []).filter((u) => !existingIds.has(u.userId));
          return [...prev, ...unique];
        });
        hasMoreLocal = data.hasMore ?? false;
        setHasMore(hasMoreLocal);
        offset += data.users.length;
      }
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, users.length, endpoint]);

  useEffect(() => {
    if (!isOpen || !sentinelRef.current || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      { root: scrollContainerRef.current, rootMargin: '100px', threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isOpen, hasMore, loading, loadingMore, loadMore]);


  const filteredAndSortedUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let filtered = users;

    if (query) {
      filtered = users.filter((u) =>
        u.displayName?.toLowerCase().includes(query)
      );
    }

    return [...filtered].sort((a, b) => {
      const nameA = (a.displayName || '').toLowerCase();
      const nameB = (b.displayName || '').toLowerCase();
      return nameA.localeCompare(nameB, 'es');
    });
  }, [users, searchQuery]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const title = type === 'followers' ? 'Seguidores' : 'Siguiendo';

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain',
        'bg-black/70 backdrop-blur-md',
        'transition-opacity duration-300'
      )}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <Card
        className={cn(
          'w-full max-w-md max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] shadow-2xl flex flex-col my-auto overflow-hidden',
          'transform transition-all duration-300'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">
              {title}
            </CardTitle>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Cerrar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Search - busca sobre el listado completo cargado */}
          <div className="mt-3">
            <Input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              autoFocus
            />
            {!loading && total > 0 && (
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500">
                  {searchQuery.trim()
                    ? `Buscando en ${users.length}${hasMore ? ` de ${total}` : ` de ${total}`}`
                    : `${users.length} de ${total} cargados`}
                </p>
                {hasMore && (
                  <button
                    type="button"
                    onClick={loadAllRemaining}
                    disabled={loadingMore}
                    className="text-xs text-primary hover:underline disabled:opacity-50"
                  >
                    {loadingMore ? 'Cargando...' : 'Cargar todos para buscar'}
                  </button>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto pt-0 min-h-0"
        >
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filteredAndSortedUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>
                {searchQuery.trim()
                  ? 'No se encontraron resultados'
                  : type === 'followers'
                    ? 'No tienes seguidores aún'
                    : 'No sigues a nadie aún'}
              </p>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {filteredAndSortedUsers.map((user) => (
                  <li key={user.userId}>
                    <Link
                      href={`/profile/${user.userId}`}
                      onClick={onClose}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {/* Avatar - icono cuadrado con bordes redondeados */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-200">
                        {user.profilePhotoUrl ? (
                          <Image
                            src={user.profilePhotoUrl}
                            alt={user.displayName || 'Usuario'}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold text-lg">
                            {user.displayName?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>

                      {/* Nombre */}
                      <span className="flex-1 font-medium text-gray-900 truncate">
                        {user.displayName || 'Usuario'}
                      </span>

                      {/* Candado si es privado */}
                      {user.isPrivate && (
                        <span
                          className="flex-shrink-0 text-gray-500"
                          title="Perfil privado"
                          aria-label="Perfil privado"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Sentinel para infinite scroll */}
              <div ref={sentinelRef} className="h-4 flex-shrink-0" />

              {loadingMore && (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
