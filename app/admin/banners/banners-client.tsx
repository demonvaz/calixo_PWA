'use client';

import { useState, useEffect } from 'react';
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

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners');
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      }
    } catch {
      toast.error('Error al cargar banners');
    }
  };

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
    <>
      <div className="overflow-x-auto hidden sm:block">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-neutral/10 bg-neutral/5">
              <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Frase</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Imagen</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-dark">Estado</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-dark"></th>
            </tr>
          </thead>
          <tbody>
            {banners.map((b) => (
              <tr key={b.id} className="border-b border-neutral/10 hover:bg-neutral/5">
                <td className="py-3 px-4 text-sm line-clamp-2 max-w-[200px]">{b.phrase}</td>
                <td className="py-3 px-4">
                  {b.image_url ? (
                    <span className="text-xs text-neutral">Personalizada</span>
                  ) : (
                    <span className="text-xs text-neutral">Por defecto</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {b.is_active ? (
                    <span className="px-2 py-0.5 rounded-lg bg-complementary-emerald/10 text-complementary-emerald text-xs">
                      Activo
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-neutral/10 text-neutral text-xs">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 flex gap-2">
                  <Link
                    href={`/admin/banners/${b.id}/edit`}
                    className="text-sm text-primary hover:underline"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(b.id)}
                    disabled={deletingId === b.id}
                    className="text-sm text-accent-red hover:underline disabled:opacity-50"
                  >
                    {deletingId === b.id ? '...' : 'Eliminar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden divide-y divide-neutral/10">
        {banners.map((b) => (
          <div key={b.id} className="p-4 space-y-3">
            <p className="text-sm text-text-dark line-clamp-2">{b.phrase}</p>
            <div className="flex justify-between items-center">
              {b.is_active ? (
                <span className="px-2 py-0.5 rounded-lg bg-complementary-emerald/10 text-complementary-emerald text-xs">
                  Activo
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-lg bg-neutral/10 text-neutral text-xs">
                  Inactivo
                </span>
              )}
              <div className="flex gap-3">
                <Link href={`/admin/banners/${b.id}/edit`} className="text-sm text-primary font-medium">
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(b.id)}
                  disabled={deletingId === b.id}
                  className="text-sm text-accent-red"
                >
                  {deletingId === b.id ? '...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
