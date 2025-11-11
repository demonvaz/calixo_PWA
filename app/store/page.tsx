'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StoreItemCard } from '@/components/store/store-item-card';
import { StoreFilters } from '@/components/store/store-filters';
import Link from 'next/link';

interface StoreItem {
  id: number;
  name: string;
  category: string;
  itemId: string;
  price: number;
  premiumOnly: boolean;
  imageUrl: string | null;
  description: string | null;
  owned: boolean;
  canPurchase: boolean;
}

interface StoreData {
  items: StoreItem[];
  userCoins: number;
  isPremium: boolean;
  totalItems: number;
  ownedCount: number;
}

export default function StorePage() {
  const router = useRouter();
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPremium, setSelectedPremium] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStoreData();
  }, [selectedCategory, selectedPremium, searchQuery]);

  const fetchStoreData = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedPremium) params.append('premiumOnly', selectedPremium);
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

  const handlePurchase = async (itemId: number) => {
    if (!storeData) return;

    setPurchasing(true);
    setError('');

    try {
      const response = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al comprar');
      }

      const data = await response.json();
      alert(`✅ ¡${data.item.name} comprado! -${data.item.price} monedas`);
      
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
        <div className="text-center">
          <div className="text-4xl mb-4">🏪</div>
          <p className="text-gray-600">Cargando tienda...</p>
        </div>
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-600">{error || 'Error al cargar datos'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            ← Volver
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🏪 Tienda CALI
              </h1>
              <p className="text-gray-600">
                Personaliza tu avatar con items únicos
              </p>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-yellow-600">
                🪙 {storeData.userCoins}
              </div>
              <p className="text-sm text-gray-600">Tus monedas</p>
              {storeData.isPremium && (
                <span className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                  ⭐ Premium
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>{storeData.totalItems}</CardTitle>
              <CardDescription>Items Disponibles</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">{storeData.ownedCount}</CardTitle>
              <CardDescription>Items Comprados</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">
                {Math.round((storeData.ownedCount / storeData.totalItems) * 100)}%
              </CardTitle>
              <CardDescription>Colección Completa</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <StoreFilters
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedPremium={selectedPremium}
              onPremiumChange={setSelectedPremium}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {/* Quick Links */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Accesos Rápidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/avatar">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    🎨 Editor de Avatar
                  </Button>
                </Link>
                <Link href="/store/transactions">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    📊 Historial
                  </Button>
                </Link>
                <Link href="/challenges/daily">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    🎯 Ganar Monedas
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Items Grid */}
          <div className="lg:col-span-3">
            {storeData.items.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  No se encontraron items
                </h2>
                <p className="text-gray-600 mb-4">
                  Intenta ajustar los filtros
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedPremium(null);
                    setSearchQuery('');
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {storeData.items.map((item) => (
                  <StoreItemCard
                    key={item.id}
                    item={item}
                    onPurchase={handlePurchase}
                    isPurchasing={purchasing}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



