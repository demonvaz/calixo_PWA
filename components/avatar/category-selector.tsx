'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

interface CategoryItem {
  itemId: string;
  unlocked: boolean;
  equipped: boolean;
  item: StoreItem;
}

interface CategorySelectorProps {
  category: string;
  items: CategoryItem[];
  onEquip: (itemId: string) => void;
  onUnlock: (itemId: string) => void;
  userCoins: number;
  isPremium: boolean;
  isUnlocked: boolean;
}

const categoryEmojis: Record<string, string> = {
  color: '',
  shirt: '',
  hat: '',
  glasses: '',
  background: '',
  accessories: '',
};

const categoryNames: Record<string, string> = {
  color: 'Color',
  shirt: 'Camiseta',
  hat: 'Sombrero',
  glasses: 'Gafas',
  background: 'Fondo',
  accessories: 'Accesorios',
};

export function CategorySelector({
  category,
  items,
  onEquip,
  onUnlock,
  userCoins,
  isPremium,
  isUnlocked,
}: CategorySelectorProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleItemClick = (item: CategoryItem) => {
    setSelectedItem(item.itemId);
    
    if (item.unlocked) {
      onEquip(item.itemId);
    }
  };

  const handleUnlock = (item: CategoryItem) => {
    if (userCoins >= item.item.price) {
      onUnlock(item.itemId);
    }
  };

  if (!isUnlocked) {
    return (
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {categoryEmojis[category]} {categoryNames[category]}
            <span className="ml-auto text-sm font-normal text-gray-500">
              Bloqueado
            </span>
          </CardTitle>
          <CardDescription>
            Desbloquea esta categoría comprando tu primer item
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {categoryNames[category]}
          <span className="ml-auto text-sm font-normal text-green-600">
            Desbloqueado
          </span>
        </CardTitle>
        <CardDescription>
          {items.filter(i => i.unlocked).length} / {items.length} items
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((item) => (
            <div
              key={item.itemId}
              className={`
                relative p-4 border-2 rounded-lg cursor-pointer transition-all
                ${item.equipped ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                ${!item.unlocked ? 'opacity-60' : 'hover:border-blue-300'}
              `}
              onClick={() => handleItemClick(item)}
            >
              {/* Lock overlay */}
              {!item.unlocked && (
                <div className="absolute top-2 right-2 text-lg">
                </div>
              )}

              {/* Equipped indicator */}
              {item.equipped && (
                <div className="absolute top-2 right-2 text-lg">
                </div>
              )}

              {/* Item preview */}
              <div className="text-center mb-2">
                <div className="text-3xl mb-1">
                </div>
                <p className="text-sm font-semibold truncate">
                  {item.item.name}
                </p>
                {item.item.description && (
                  <p className="text-xs text-gray-500 truncate">
                    {item.item.description}
                  </p>
                )}
              </div>

              {/* Price / Status */}
              <div className="text-center">
                {item.unlocked ? (
                  <Button
                    variant={item.equipped ? 'default' : 'outline'}
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEquip(item.itemId);
                    }}
                  >
                    {item.equipped ? 'Equipado' : 'Equipar'}
                  </Button>
                ) : (
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-yellow-600">
                      {item.item.price} monedas
                    </div>
                    {item.item.premiumOnly && !isPremium && (
                      <div className="text-xs text-purple-600">
                        Premium
                      </div>
                    )}
                    {userCoins >= item.item.price && (!item.item.premiumOnly || isPremium) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlock(item);
                        }}
                      >
                        Comprar
                      </Button>
                    ) : (
                      <div className="text-xs text-gray-500">
                        {userCoins < item.item.price ? 'Sin monedas' : 'Requiere Premium'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}






