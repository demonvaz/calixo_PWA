'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

interface ChallengeFormProps {
  challenge?: {
    id: number;
    type: 'daily' | 'focus' | 'social';
    title: string;
    description?: string | null;
    reward: number;
    durationMinutes?: number | null;
    isActive: boolean;
  };
}

export function ChallengeForm({ challenge }: ChallengeFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: challenge?.type || 'daily',
    title: challenge?.title || '',
    description: challenge?.description || '',
    reward: challenge?.reward || 50,
    durationMinutes: challenge?.durationMinutes || null,
    isActive: challenge?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.durationMinutes || formData.durationMinutes < 1) {
      setError('La duración es obligatoria');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const url = challenge
        ? `/api/admin/challenges/${challenge.id}`
        : '/api/admin/challenges';
      const method = challenge ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar el reto');
      }

      toast.success(challenge ? 'Reto actualizado correctamente' : 'Reto creado correctamente');
      router.push('/admin/challenges');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral/10 bg-white shadow-sm p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red rounded-xl text-accent-red">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">
            Tipo de Reto
          </label>
          <p className="px-4 py-2.5 rounded-xl bg-neutral/5 text-text-dark text-sm">
            {challenge ? (formData.type === 'daily' ? 'Diario' : formData.type === 'focus' ? 'Enfoque' : 'Social') : 'Diario'}
          </p>
          {!challenge && <input type="hidden" name="type" value="daily" />}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">
            Título *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-dark"
            required
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">
            Descripción
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-dark"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">
            Recompensa (monedas) *
          </label>
          <input
            type="number"
            value={formData.reward}
            onChange={(e) =>
              setFormData({ ...formData, reward: parseInt(e.target.value) || 0 })
            }
            className="w-full px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-dark"
            required
            min={0}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">
            Duración (minutos) *
          </label>
          <input
            type="number"
            value={formData.durationMinutes ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                durationMinutes: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            placeholder="Ej: 25, 60"
            className="w-full px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-dark"
            min={1}
            max={1380}
            required
          />
          <p className="text-xs text-neutral mt-1">
            Obligatorio. Máx. 1380 min (23 h).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
            className="w-4 h-4 text-primary border-neutral/20 rounded focus:ring-primary"
          />
          <label htmlFor="isActive" className="text-sm text-text-dark">
            Reto activo (visible para usuarios)
          </label>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : challenge ? 'Actualizar Reto' : 'Crear Reto'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}

