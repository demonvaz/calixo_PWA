'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { MAX_GROUP_MEMBERS } from '@/lib/groups/constants';
import type { FollowUser } from '@/components/profile/followers-modal';

const PAGE_SIZE = 50;
type Step = 'members' | 'details';

type SelectableUser = FollowUser;

function toSelectableUser(user: {
  userId: string;
  displayName: string;
  profilePhotoUrl?: string | null;
  isPrivate?: boolean;
}): SelectableUser {
  return {
    userId: user.userId,
    displayName: user.displayName,
    profilePhotoUrl: user.profilePhotoUrl ?? null,
    isPrivate: user.isPrivate ?? false,
  };
}

function UserAvatar({ user, size = 48 }: { user: SelectableUser; size?: number }) {
  return (
    <div
      className="rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200"
      style={{ width: size, height: size }}
    >
      {user.profilePhotoUrl ? (
        <Image
          src={user.profilePhotoUrl}
          alt={user.displayName || 'Usuario'}
          width={size}
          height={size}
          className="object-cover w-full h-full"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-gray-500 font-semibold"
          style={{ fontSize: size * 0.4 }}
        >
          {user.displayName?.[0]?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  );
}

function CheckIcon({ selected }: { selected: boolean }) {
  return (
    <div
      className={cn(
        'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
        selected ? 'bg-primary border-primary' : 'border-gray-300'
      )}
    >
      {selected && (
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );
}

export function CreateGroupFlow() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<Step>('members');
  const [selected, setSelected] = useState<Map<string, SelectableUser>>(new Map());
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const [followers, setFollowers] = useState<SelectableUser[]>([]);
  const [searchResults, setSearchResults] = useState<SelectableUser[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchQuery.trim(), 300);
  const isGlobalSearch = debouncedSearch.length >= 2;

  const maxSelectable = MAX_GROUP_MEMBERS - 1;
  const selectedList = useMemo(() => Array.from(selected.values()), [selected]);

  const fetchFollowersPage = useCallback(async (offset: number, append: boolean) => {
    const url = `/api/profile/followers?limit=${PAGE_SIZE}&offset=${offset}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al cargar');

    const newUsers: SelectableUser[] = (data.users || []).map(toSelectableUser);
    const totalVal = data.total ?? 0;
    const hasMoreVal = data.hasMore ?? false;

    if (append) {
      setFollowers((prev) => {
        const existingIds = new Set(prev.map((u) => u.userId));
        const unique = newUsers.filter((u) => !existingIds.has(u.userId));
        return [...prev, ...unique];
      });
    } else {
      setFollowers(newUsers);
    }

    setTotal(totalVal);
    setHasMore(hasMoreVal);
  }, []);

  useEffect(() => {
    setLoadingFollowers(true);
    fetchFollowersPage(0, false)
      .catch(() => setFollowers([]))
      .finally(() => setLoadingFollowers(false));
  }, [fetchFollowersPage]);

  useEffect(() => {
    if (!isGlobalSearch) {
      setSearchResults([]);
      setLoadingSearch(false);
      return;
    }

    let cancelled = false;
    setLoadingSearch(true);

    fetch(`/api/users/search?q=${encodeURIComponent(debouncedSearch)}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) throw new Error(data.error || 'Error al buscar');
        setSearchResults(
          (data.users || []).map((u: { userId: string; displayName: string; isPrivate?: boolean }) =>
            toSelectableUser(u)
          )
        );
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSearch(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, isGlobalSearch]);

  const loadMore = useCallback(() => {
    if (isGlobalSearch || loadingMore || !hasMore || followers.length >= total) return;
    setLoadingMore(true);
    fetchFollowersPage(followers.length, true)
      .catch(() => setHasMore(false))
      .finally(() => setLoadingMore(false));
  }, [isGlobalSearch, loadingMore, hasMore, followers.length, total, fetchFollowersPage]);

  useEffect(() => {
    if (isGlobalSearch || !sentinelRef.current || !scrollContainerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingFollowers && !loadingMore) {
          loadMore();
        }
      },
      { root: scrollContainerRef.current, rootMargin: '100px', threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isGlobalSearch, hasMore, loadingFollowers, loadingMore, loadMore]);

  const displayedUsers = useMemo(() => {
    if (isGlobalSearch) {
      return [...searchResults].sort((a, b) =>
        (a.displayName || '').localeCompare(b.displayName || '', 'es')
      );
    }

    const query = searchQuery.trim().toLowerCase();
    let list = followers;
    if (query) {
      list = followers.filter((u) => u.displayName?.toLowerCase().includes(query));
    }
    return [...list].sort((a, b) =>
      (a.displayName || '').localeCompare(b.displayName || '', 'es')
    );
  }, [isGlobalSearch, searchResults, followers, searchQuery]);

  const isLoadingList = isGlobalSearch ? loadingSearch : loadingFollowers;

  const followerIds = useMemo(() => new Set(followers.map((f) => f.userId)), [followers]);

  const toggleUser = (user: SelectableUser) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(user.userId)) {
        next.delete(user.userId);
      } else if (next.size < maxSelectable) {
        next.set(user.userId, user);
      } else {
        toast.error(`Máximo ${maxSelectable} participantes`);
      }
      return next;
    });
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('members');
    } else {
      router.push('/groups');
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          inviteIds: selectedList.map((u) => u.userId),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success('Grupo creado');
      router.push(`/groups/${data.group.id}/chat`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear grupo');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] md:h-[calc(100dvh-5rem)] md:max-w-lg md:mx-auto md:border-x md:border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b bg-white flex-shrink-0">
        <button
          onClick={handleBack}
          className="p-2 -ml-1 text-primary hover:bg-gray-50 rounded-full transition-colors"
          aria-label="Volver"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-lg text-gray-900">Nuevo grupo</h1>
          {step === 'members' && selected.size > 0 && (
            <p className="text-xs text-gray-500">
              {selected.size} de {maxSelectable} seleccionados
            </p>
          )}
        </div>

        {step === 'members' ? (
          <button
            onClick={() => setStep('details')}
            disabled={selected.size === 0}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              selected.size > 0
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            Siguiente
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              name.trim() && !creating
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {creating ? 'Creando...' : 'Crear'}
          </button>
        )}
      </div>

      {step === 'members' ? (
        <>
          {/* Búsqueda */}
          <div className="px-4 py-3 bg-white border-b flex-shrink-0">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar personas..."
                className="pl-9 bg-gray-50 border-gray-200 rounded-xl"
              />
            </div>
            {!isGlobalSearch && followers.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Mostrando tus seguidores · escribe 2+ letras para buscar a cualquiera
              </p>
            )}
            {isGlobalSearch && !loadingSearch && (
              <p className="text-xs text-gray-500 mt-2">
                Resultados para &ldquo;{debouncedSearch}&rdquo;
              </p>
            )}
          </div>

          {/* Seleccionados */}
          {selectedList.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-b flex-shrink-0">
              <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                {selectedList.map((user) => (
                  <button
                    key={user.userId}
                    onClick={() => toggleUser(user)}
                    className="flex flex-col items-center gap-1 flex-shrink-0 group"
                  >
                    <div className="relative">
                      <UserAvatar user={user} size={52} />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs group-hover:bg-primary transition-colors">
                        ×
                      </span>
                    </div>
                    <span className="text-xs text-gray-600 max-w-[56px] truncate">
                      {user.displayName?.split(' ')[0] || 'Usuario'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lista de personas */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-white">
            {isLoadingList ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : displayedUsers.length === 0 ? (
              <div className="text-center py-16 px-4 text-gray-500">
                <p className="font-medium mb-1">
                  {isGlobalSearch ? 'Sin resultados' : searchQuery.trim() ? 'Sin resultados' : 'Sin seguidores'}
                </p>
                <p className="text-sm">
                  {isGlobalSearch
                    ? 'Prueba con otro nombre'
                    : searchQuery.trim()
                      ? 'Prueba con otro nombre'
                      : 'Escribe al menos 2 letras para buscar más personas'}
                </p>
              </div>
            ) : (
              <>
                <ul>
                  {displayedUsers.map((user) => {
                    const isSelected = selected.has(user.userId);
                    const isFollower = followerIds.has(user.userId);
                    return (
                      <li key={user.userId}>
                        <button
                          onClick={() => toggleUser(user)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          <UserAvatar user={user} />
                          <div className="flex-1 min-w-0 text-left">
                            <span className="font-medium text-gray-900 truncate block">
                              {user.displayName || 'Usuario'}
                            </span>
                            {isGlobalSearch && !isFollower && (
                              <span className="text-xs text-gray-400">No es seguidor</span>
                            )}
                          </div>
                          <CheckIcon selected={isSelected} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {!isGlobalSearch && (
                  <>
                    <div ref={sentinelRef} className="h-4" />
                    {loadingMore && (
                      <div className="flex justify-center py-4">
                        <Spinner size="sm" />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Participantes seleccionados */}
          <div className="px-4 py-6 border-b">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Participantes · {selectedList.length + 1}
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
                Tú
              </div>
              {selectedList.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-sm text-gray-700"
                >
                  <UserAvatar user={user} size={20} />
                  <span className="truncate max-w-[120px]">{user.displayName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detalles del grupo */}
          <div className="px-4 py-6 space-y-5">
            <div>
              <label htmlFor="group-name" className="text-sm font-medium text-gray-700">
                Nombre del grupo
              </label>
              <Input
                id="group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Detox de verano"
                maxLength={100}
                autoFocus
                className="mt-2 rounded-xl"
              />
            </div>

            <div>
              <label htmlFor="group-desc" className="text-sm font-medium text-gray-700">
                Descripción <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                id="group-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="¿De qué trata el grupo?"
                maxLength={500}
                rows={3}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
