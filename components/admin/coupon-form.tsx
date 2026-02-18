'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface CouponFormProps {
  coupon?: {
    id: number;
    code: string;
    discountPercent: number;
    partnerName: string;
    description: string | null;
    price: number;
    maxUses: number | null;
    validUntil: Date;
    isActive: boolean;
  };
}

export function CouponForm({ coupon }: CouponFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    discountPercent: coupon?.discountPercent || 10,
    partnerName: coupon?.partnerName || '',
    description: coupon?.description || '',
    price: coupon?.price ?? 0,
    maxUses: coupon?.maxUses || null,
    validUntil: coupon
      ? new Date(coupon.validUntil).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: coupon?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = coupon ? `/api/admin/coupons/${coupon.id}` : '/api/admin/coupons';
      const method = coupon ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          description: formData.description || null,
          validUntil: new Date(formData.validUntil + 'T23:59:59').toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar el cupón');
      }

      router.push('/admin/coupons');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-neutral/10 bg-white p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red rounded-lg text-accent-red">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">
            Código del Cupón *
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toUpperCase() })
            }
            className="w-full px-4 py-2 border border-neutral/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
            required
            maxLength={50}
            placeholder="EJEMPLO2024"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">
            Nombre del Partner *
          </label>
          <input
            type="text"
            value={formData.partnerName}
            onChange={(e) =>
              setFormData({ ...formData, partnerName: e.target.value })
            }
            className="w-full px-4 py-2 border border-neutral/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
            maxLength={100}
            placeholder="Ej: Olimpro, Nude Project"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">
            Descripción (opcional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-2 border border-neutral/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            rows={2}
            placeholder="Descripción del cupón"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">
            Precio en monedas *
          </label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData({
                ...formData,
                price: parseInt(e.target.value) || 0,
              })
            }
            className="w-full px-4 py-2 border border-neutral/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
            min={0}
            placeholder="Monedas para comprar el cupón"
          />
          <p className="text-sm text-neutral mt-1">
            Coste en monedas para que el usuario compre este cupón en la tienda
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">
            Porcentaje de Descuento *
          </label>
          <input
            type="number"
            value={formData.discountPercent}
            onChange={(e) =>
              setFormData({
                ...formData,
                discountPercent: parseInt(e.target.value) || 0,
              })
            }
            className="w-full px-4 py-2 border border-neutral/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
            min={1}
            max={100}
          />
          <p className="text-sm text-neutral mt-1">
            Descuento del {formData.discountPercent}% aplicado
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">
            Límite de Usos (opcional)
          </label>
          <input
            type="number"
            value={formData.maxUses || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                maxUses: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            className="w-full px-4 py-2 border border-neutral/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            min={1}
            placeholder="Dejar vacío para ilimitado"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">
            Válido Hasta *
          </label>
          <input
            type="date"
            value={formData.validUntil}
            onChange={(e) =>
              setFormData({ ...formData, validUntil: e.target.value })
            }
            className="w-full px-4 py-2 border border-neutral/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
            min={new Date().toISOString().split('T')[0]}
          />
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
            Cupón activo
          </label>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : coupon ? 'Actualizar Cupón' : 'Crear Cupón'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}

