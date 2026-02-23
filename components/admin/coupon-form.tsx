'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import Image from 'next/image';

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
    brandImage?: string | null;
  };
}

export function CouponForm({ coupon }: CouponFormProps) {
  const router = useRouter();
  const toast = useToast();
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
    brandImage: coupon?.brandImage || '',
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await fetch('/api/admin/coupons/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir');
      setFormData((prev) => ({ ...prev, brandImage: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
          brandImage: formData.brandImage?.trim() || null,
          validUntil: new Date(formData.validUntil + 'T23:59:59').toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar el cupón');
      }

      toast.success(coupon ? 'Cupón actualizado correctamente' : 'Cupón creado correctamente');
      router.push('/admin/coupons');
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
            Código del Cupón *
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toUpperCase() })
            }
            className="w-full px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-text-dark"
            required
            maxLength={50}
            placeholder="EJEMPLO2024"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">
            Imagen (se muestra en la tienda)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {formData.brandImage ? (
              <div className="flex items-center gap-3">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-neutral/20 shrink-0">
                  <Image
                    src={formData.brandImage}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Spinner size="sm" /> : 'Cambiar imagen'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData((prev) => ({ ...prev, brandImage: '' }))}
                    className="text-accent-red hover:text-accent-red hover:bg-accent-red/10"
                  >
                    Quitar imagen
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full sm:w-auto"
              >
                {uploading ? <Spinner size="sm" /> : 'Subir imagen'}
              </Button>
            )}
          </div>
          <p className="text-xs text-neutral mt-1">
            JPG, PNG o WEBP. Máx. 5MB. Se mostrará en la tarjeta del cupón en la tienda.
          </p>
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
            className="w-full px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-dark"
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
            className="w-full px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-dark"
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
            className="w-full px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-dark"
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
            className="w-full px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-dark"
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
            className="w-full px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-dark"
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
            className="w-full px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-dark"
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

