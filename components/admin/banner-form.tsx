'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { BannerPreview } from './banner-preview';

interface BannerFormProps {
  onSuccess?: () => void;
  editing?: {
    id: number;
    phrase: string;
    image_url: string | null;
    sort_order: number;
    is_active: boolean;
  };
}

export function BannerForm({ onSuccess, editing }: BannerFormProps) {
  const router = useRouter();
  const [phrase, setPhrase] = useState(editing?.phrase ?? '');
  const [imageUrl, setImageUrl] = useState(editing?.image_url ?? '');
  const [sortOrder, setSortOrder] = useState(editing?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(editing?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/banners/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir');
      setImageUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir');
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
      const body = {
        phrase: phrase.trim(),
        image_url: imageUrl.trim() || null,
        sort_order: sortOrder,
        is_active: isActive,
      };

      const url = editing ? `/api/admin/banners/${editing.id}` : '/api/admin/banners';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      onSuccess?.();
      router.push('/admin/banners');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">Frase *</label>
            <textarea
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="Ej: Desconecta y gana momentos memorables"
              className="w-full px-4 py-2.5 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-dark placeholder:text-neutral resize-none"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">Imagen (opcional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? <Spinner size="sm" /> : imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
            </Button>
            {imageUrl && (
              <p className="text-xs text-neutral mt-1 truncate">Si no subes imagen, se usa la por defecto</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">Orden</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              min={0}
              className="w-full px-4 py-2 border border-neutral/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-primary border-neutral/20 rounded focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm text-text-dark">
              Activo (visible en el feed)
            </label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : editing ? 'Actualizar' : 'Crear'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/admin/banners')}>
              Cancelar
            </Button>
          </div>
        </div>

        <div className="lg:sticky lg:top-24">
          <BannerPreview phrase={phrase} imageUrl={imageUrl || null} />
        </div>
      </div>
    </form>
  );
}
