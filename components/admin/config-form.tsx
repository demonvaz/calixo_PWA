'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';

interface ConfigValues {
  daily_free_challenges?: number;
  daily_premium_challenges?: number;
  reward_daily?: number;
  reward_focus?: number;
  reward_social?: number;
  max_focus_duration_minutes?: number;
}

export function ConfigForm() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState<ConfigValues>({
    daily_free_challenges: 1,
    daily_premium_challenges: 3,
    reward_daily: 50,
    reward_focus: 1,
    reward_social: 75,
    max_focus_duration_minutes: 1380,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/config');
      if (response.ok) {
        const data = await response.json();
        setConfig((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar configuración');
      }

      toast.success('Configuración guardada correctamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
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
    <div className="rounded-2xl border border-neutral/10 bg-white shadow-sm p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red rounded-xl text-accent-red">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              Límite Retos Diarios (Free)
            </label>
            <input
              type="number"
              value={config.daily_free_challenges || 1}
              onChange={(e) =>
                setConfig({ ...config, daily_free_challenges: parseInt(e.target.value) || 1 })
              }
              className="w-full px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-dark"
              min={1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              Límite Retos Diarios (Premium)
            </label>
            <input
              type="number"
              value={config.daily_premium_challenges || 3}
              onChange={(e) =>
                setConfig({ ...config, daily_premium_challenges: parseInt(e.target.value) || 3 })
              }
              className="w-full px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-dark"
              min={1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              Recompensa Retos Diarios (monedas)
            </label>
            <input
              type="number"
              value={config.reward_daily || 50}
              onChange={(e) =>
                setConfig({ ...config, reward_daily: parseInt(e.target.value) || 50 })
              }
              className="w-full px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-dark"
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              Recompensa Modo Enfoque (monedas/minuto)
            </label>
            <input
              type="number"
              value={config.reward_focus || 1}
              onChange={(e) =>
                setConfig({ ...config, reward_focus: parseInt(e.target.value) || 1 })
              }
              className="w-full px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-dark"
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              Recompensa Retos Sociales (monedas)
            </label>
            <input
              type="number"
              value={config.reward_social || 75}
              onChange={(e) =>
                setConfig({ ...config, reward_social: parseInt(e.target.value) || 75 })
              }
              className="w-full px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-dark"
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              Duración Máxima Modo Enfoque (minutos)
            </label>
            <input
              type="number"
              value={config.max_focus_duration_minutes || 1380}
              onChange={(e) =>
                setConfig({ ...config, max_focus_duration_minutes: parseInt(e.target.value) || 1380 })
              }
              className="w-full px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-dark"
              min={1}
              max={1380}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      </form>
    </div>
  );
}

