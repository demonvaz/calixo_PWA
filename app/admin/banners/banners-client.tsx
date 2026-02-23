'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';

interface Banner {
  id: number;
  phrase: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

interface BannersClientProps {
  initialBanners: Banner[];
}

export function BannersClient({ initialBanners }: BannersClientProps) {
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const toast = useToast();

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este banner?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
        toast.success('Banner eliminado');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al eliminar');
      }
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="divide-y divide-neutral/10">
      {banners.map((b) => (
        <div
          key={b.id}
          className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 sm:p-5 hover:bg-neutral/5 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base text-text-dark font-medium break-words">
              {b.phrase}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs text-neutral/70">Orden {b.sort_order}</span>
              <span className="text-neutral/40">·</span>
              <span className="text-xs text-neutral">
                {b.image_url ? 'Imagen personalizada' : 'Imagen por defecto'}
              </span>
              <span className="text-neutral/60">·</span>
              {b.is_active ? (
                <span className="px-2 py-0.5 rounded-lg bg-complementary-emerald/10 text-complementary-emerald text-xs font-medium">
                  Activo
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-lg bg-neutral/10 text-neutral text-xs">
                  Inactivo
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2 sm:gap-3">
            <Link
              href={`/admin/banners/${b.id}/edit`}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              Editar
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(b.id)}
              disabled={deletingId === b.id}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-accent-red hover:bg-accent-red/10 transition-colors disabled:opacity-50"
            >
              {deletingId === b.id ? '...' : 'Eliminar'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
