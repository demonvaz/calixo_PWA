'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface User {
  id: string;
  email: string;
  displayName: string | null;
  isPremium: boolean;
  coins: number;
  streak: number;
  createdAt: Date;
}

export function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) {
        params.set('search', search);
      }
      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePremium = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/premium`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPremium: !currentStatus }),
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error toggling premium:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por email o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-neutral/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral/20">
              <th className="text-left py-3 px-4 font-medium text-text-dark font-serif">Email</th>
              <th className="text-left py-3 px-4 font-medium text-text-dark font-serif">Nombre</th>
              <th className="text-left py-3 px-4 font-medium text-text-dark font-serif">Premium</th>
              <th className="text-left py-3 px-4 font-medium text-text-dark font-serif">Monedas</th>
              <th className="text-left py-3 px-4 font-medium text-text-dark font-serif">Racha</th>
              <th className="text-left py-3 px-4 font-medium text-text-dark font-serif">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-neutral">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-neutral/10">
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.displayName || '-'}</td>
                  <td className="py-3 px-4">
                    {user.isPremium ? (
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-sm">
                        Premium
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-neutral/10 text-neutral rounded-lg text-sm">
                        Free
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">{user.coins} monedas</td>
                  <td className="py-3 px-4">{user.streak} racha</td>
                  <td className="py-3 px-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePremium(user.id, user.isPremium)}
                    >
                      {user.isPremium ? 'Quitar Premium' : 'Dar Premium'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

