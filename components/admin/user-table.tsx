'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  isPremium: boolean;
  coins: number;
  streak: number;
  createdAt: string;
  isAdmin?: boolean;
}

export function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [premiumFilter, setPremiumFilter] = useState<'all' | 'premium' | 'free'>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchUsers();
  }, [search, premiumFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (premiumFilter === 'premium') params.set('isPremium', 'true');
      if (premiumFilter === 'free') params.set('isPremium', 'false');
      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const togglePremium = async (userId: string, currentStatus: boolean) => {
    setTogglingId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/premium`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPremium: !currentStatus }),
      });

      if (response.ok) {
        fetchUsers();
        toast.success(
          currentStatus
            ? 'Premium desactivado correctamente'
            : 'Premium activado. El usuario mantendrá Premium hasta que lo desactives.'
        );
      } else {
        const err = await response.json();
        toast.error(err.error || 'Error al actualizar Premium');
      }
    } catch (error) {
      console.error('Error toggling premium:', error);
      toast.error('Error al actualizar Premium');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aviso Premium */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-2xl">⭐</span>
          <div>
            <h3 className="font-semibold text-text-dark font-serif">
              Control de Premium
            </h3>
            <p className="text-sm text-neutral mt-1">
              Al activar Premium a un usuario, permanecerá activo hasta que lo desactives manualmente.
              No hay renovación automática ni fecha de caducidad.
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-neutral/10 bg-white p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-dark placeholder:text-neutral"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant={premiumFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPremiumFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={premiumFilter === 'premium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPremiumFilter('premium')}
            >
              Premium
            </Button>
            <Button
              variant={premiumFilter === 'free' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPremiumFilter('free')}
            >
              Free
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla - Desktop / Cards - Móvil */}
      <div className="rounded-xl border border-neutral/10 bg-white overflow-hidden">
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-neutral/20 bg-neutral/5">
                <th className="text-left py-4 px-4 font-medium text-text-dark font-serif text-sm">
                  Usuario
                </th>
                <th className="text-left py-4 px-4 font-medium text-text-dark font-serif text-sm">
                  Premium
                </th>
                <th className="text-left py-4 px-4 font-medium text-text-dark font-serif text-sm hidden md:table-cell">
                  Monedas
                </th>
                <th className="text-left py-4 px-4 font-medium text-text-dark font-serif text-sm hidden lg:table-cell">
                  Racha
                </th>
                <th className="text-left py-4 px-4 font-medium text-text-dark font-serif text-sm">
                  Acción Premium
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-neutral">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className={cn(
                      'border-b border-neutral/10 transition-colors hover:bg-neutral/5',
                      user.isPremium && 'bg-primary/5'
                    )}
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-text-dark">
                          {user.displayName || 'Sin nombre'}
                        </p>
                        <p className="text-xs text-neutral truncate max-w-[180px] md:max-w-none">
                          {user.id}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {user.isPremium ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/20 text-primary rounded-lg text-sm font-medium">
                          <span>⭐</span> Premium
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-neutral/10 text-neutral rounded-lg text-sm">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell text-neutral">
                      {user.coins} monedas
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell text-neutral">
                      {user.streak} racha
                    </td>
                    <td className="py-4 px-4">
                      <Button
                        size="sm"
                        variant={user.isPremium ? 'outline' : 'default'}
                        onClick={() => togglePremium(user.id, user.isPremium)}
                        disabled={togglingId === user.id}
                        className="whitespace-nowrap"
                      >
                        {togglingId === user.id ? (
                          <Spinner size="sm" />
                        ) : user.isPremium ? (
                          'Quitar Premium'
                        ) : (
                          'Dar Premium'
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Vista móvil: cards en lugar de tabla */}
        <div className="md:hidden divide-y divide-neutral/10">
          {users.length === 0 ? (
            <div className="text-center py-12 text-neutral px-4">
              No se encontraron usuarios
            </div>
          ) : (
            users.map((user) => (
            <div
              key={user.id}
              className={cn(
                'p-4 flex flex-col gap-3',
                user.isPremium && 'bg-primary/5'
              )}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-text-dark">
                    {user.displayName || 'Sin nombre'}
                  </p>
                  <p className="text-xs text-neutral truncate max-w-[200px]">
                    {user.id}
                  </p>
                </div>
                {user.isPremium ? (
                  <span className="px-2.5 py-1 bg-primary/20 text-primary rounded-lg text-xs font-medium">
                    ⭐ Premium
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-neutral/10 text-neutral rounded-lg text-xs">
                    Free
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center text-sm text-neutral">
                <span>{user.coins} monedas</span>
                <span>{user.streak} racha</span>
              </div>
              <Button
                size="sm"
                variant={user.isPremium ? 'outline' : 'default'}
                onClick={() => togglePremium(user.id, user.isPremium)}
                disabled={togglingId === user.id}
                className="w-full"
              >
                {togglingId === user.id ? (
                  <Spinner size="sm" />
                ) : user.isPremium ? (
                  'Quitar Premium'
                ) : (
                  'Dar Premium'
                )}
              </Button>
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
