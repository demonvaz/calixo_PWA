'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarPreview } from '@/components/avatar/avatar-preview';
import { CategorySelector } from '@/components/avatar/category-selector';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';

interface ProfileData {
  avatarEnergy: number;
  energyLevel: 'alta' | 'media' | 'baja';
  coins: number;
  isPremium: boolean;
}

interface StoreItem {
  id: number;
  name: string;
  category: string;
  itemId: string;
  price: number;
  premiumOnly: boolean;
  imageUrl: string | null;
  description: string | null;
}

interface Customization {
  id: number;
  userId: string;
  category: string;
  itemId: string;
  equipped: boolean;
  unlockedAt: Date;
}

interface AvatarData {
  profile: ProfileData;
  customizations: Record<string, Customization[]>;
  equippedItems: Record<string, string>;
  unlockedCategories: string[];
  availableItems: StoreItem[];
}

const categories = ['color', 'shirt', 'hat', 'glasses', 'background', 'accessories'];

export default function AvatarEditorPage() {
  const router = useRouter();
  const toast = useToast();
  const [avatarData, setAvatarData] = useState<AvatarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('color');
  const [isEquipping, setIsEquipping] = useState(false);

  useEffect(() => {
    fetchAvatarData();
  }, []);

  const fetchAvatarData = async () => {
    try {
      const response = await fetch('/api/avatar');
      if (!response.ok) {
        throw new Error('Error al cargar datos del avatar');
      }
      const data = await response.json();
      setAvatarData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleEquip = async (itemId: string) => {
    if (!avatarData) return;
    
    setIsEquipping(true);
    setError('');

    try {
      // Check if item is already equipped
      const isCurrentlyEquipped = Object.values(avatarData.equippedItems).includes(itemId);
      
      const response = await fetch('/api/avatar/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          equipped: !isCurrentlyEquipped,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al equipar item');
      }

      // Refresh data
      await fetchAvatarData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al equipar');
    } finally {
      setIsEquipping(false);
    }
  };

  const handleUnlock = async (itemId: string) => {
    if (!avatarData) return;

    // Find the item
    const item = avatarData.availableItems.find(i => i.itemId === itemId);
    if (!item) {
      setError('Item no encontrado');
      return;
    }

    // Check if user has enough coins
    if (avatarData.profile.coins < item.price) {
      setError('No tienes suficientes monedas');
      return;
    }

    // Check premium requirement
    if (item.premiumOnly && !avatarData.profile.isPremium) {
      setError('Este item requiere cuenta Premium');
      return;
    }

    setError('');

    try {
      // Purchase from store (will be implemented in Phase 6)
      const purchaseResponse = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id }),
      });

      if (!purchaseResponse.ok) {
        // For now, just unlock the item directly
        const unlockResponse = await fetch('/api/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId }),
        });

        if (!unlockResponse.ok) {
          const data = await unlockResponse.json();
          throw new Error(data.error || 'Error al desbloquear item');
        }
      }

      // Refresh data
      await fetchAvatarData();
      
      // Show success message
      toast.success(`¡${item.name} desbloqueado! -${item.price} monedas`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al comprar');
    }
  };

  const getCategoryItems = (category: string) => {
    if (!avatarData) return [];

    const items = avatarData.availableItems.filter(i => i.category === category);
    const userCustomizations = avatarData.customizations[category] || [];

    return items.map(item => {
      const customization = userCustomizations.find(c => c.itemId === item.itemId);
      return {
        itemId: item.itemId,
        unlocked: !!customization,
        equipped: customization?.equipped || false,
        item,
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!avatarData) {
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Editor de Avatar CALI
          </h1>
          <p className="text-gray-600">
            Personaliza tu avatar con accesorios únicos
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar Preview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Tu Avatar CALI</CardTitle>
                <CardDescription>
                  Previsualización en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <AvatarPreview
                  equippedItems={avatarData.equippedItems}
                  energyLevel={avatarData.profile.energyLevel}
                  size="xl"
                  showLabel={true}
                />
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monedas:</span>
                  <span className="text-xl font-bold text-yellow-600">
                    🪙 {avatarData.profile.coins}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Energía:</span>
                  <span className="text-xl font-bold">
                    {avatarData.profile.avatarEnergy}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cuenta:</span>
                  <span className={`text-sm font-semibold ${
                    avatarData.profile.isPremium ? 'text-purple-600' : 'text-gray-600'
                  }`}>
                    {avatarData.profile.isPremium ? '⭐ Premium' : 'Gratuita'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Categorías:</span>
                  <span className="text-sm font-semibold text-green-600">
                    {avatarData.unlockedCategories.length} / {categories.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm">💡 Consejo</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-700">
                <p>
                  Completa retos para ganar monedas y desbloquear nuevos items para tu avatar.
                  ¡Cada reto incrementa tu energía!
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Category Selectors */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Tabs */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                      className="capitalize"
                    >
                      {cat === 'color' && '🎨'}
                      {cat === 'shirt' && '👕'}
                      {cat === 'hat' && '🎩'}
                      {cat === 'glasses' && '👓'}
                      {cat === 'background' && '🖼️'}
                      {cat === 'accessories' && '✨'}
                      {' '}
                      {cat}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected Category Items */}
            <CategorySelector
              category={selectedCategory}
              items={getCategoryItems(selectedCategory)}
              onEquip={handleEquip}
              onUnlock={handleUnlock}
              userCoins={avatarData.profile.coins}
              isPremium={avatarData.profile.isPremium}
              isUnlocked={avatarData.unlockedCategories.includes(selectedCategory)}
            />

            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle>Progreso de Colección</CardTitle>
                <CardDescription>
                  Items desbloqueados por categoría
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map((cat) => {
                    const items = getCategoryItems(cat);
                    const unlocked = items.filter(i => i.unlocked).length;
                    const total = items.length;
                    const percentage = total > 0 ? (unlocked / total) * 100 : 0;

                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize font-medium">{cat}</span>
                          <span className="text-gray-600">{unlocked} / {total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}






