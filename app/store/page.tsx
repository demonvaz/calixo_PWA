'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CouponCard } from '@/components/store/coupon-card';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';

interface Coupon {
  id: number;
  code: string;
  discountPercent: number;
  partnerName: string;
  description: string | null;
  price: number;
  validUntil: string;
  brandImage: string | null;
  maxUses: number | null;
  currentUses: number;
  owned: boolean;
  canPurchase: boolean;
  isOutOfStock?: boolean;
}

interface StoreData {
  items: Coupon[];
  userCoins: number;
  isPremium: boolean;
  totalItems: number;
  ownedCount: number;
}

export default function StorePage() {
  const router = useRouter();
  const toast = useToast();
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStoreData();
  }, [searchQuery]);

  const fetchStoreData = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/store?${params}`);
      if (!response.ok) {
        throw new Error('Error al cargar la tienda');
      }
      const data = await response.json();
      setStoreData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (couponId: number) => {
    if (!storeData) return;

    setPurchasing(true);
    setError('');

    try {
      const response = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al comprar');
      }

      const data = await response.json();
      toast.success(`¡Cupón ${data.coupon.code} comprado! -${data.coupon.price} monedas`);
      
      // Refresh store data
      await fetchStoreData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al comprar');
    } finally {
      setPurchasing(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Error al cargar datos'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-4 md:py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-text-dark mb-2">
                Tienda
              </h1>
              <p className="text-neutral text-sm">
                Canjea tus monedas por cupones exclusivos
              </p>
            </div>

            <div className="flex items-center gap-2 text-primary">
              <span className="text-lg md:text-xl font-semibold">
                {storeData.userCoins}
              </span>
              <span className="text-sm text-neutral">monedas</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 text-accent-red-dark">
            {error}
          </div>
        )}

        {/* Search Bar */}
        <Card className="mb-6 border-neutral/10">
          <CardContent className="pt-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cupones..."
              className="w-full px-4 py-3 border border-neutral/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-text"
            />
          </CardContent>
        </Card>

        {/* Coupons Grid */}
        {storeData.items.length === 0 ? (
          <Card className="border-neutral/10">
            <CardContent className="py-12 text-center">
              <h2 className="text-2xl font-semibold text-text-dark mb-2">
                No se encontraron cupones
              </h2>
              <p className="text-neutral mb-4">
                Intenta ajustar los filtros o busca con otros términos
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                }}
                className="border-primary text-primary hover:bg-primary/5"
              >
                Limpiar búsqueda
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {storeData.items.map((coupon) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                onPurchase={handlePurchase}
                isPurchasing={purchasing}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
