'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface StoreItemCardProps {
  item: {
    id: number;
    name: string;
    category: string;
    itemId: string;
    price: number;
    premiumOnly: boolean;
    imageUrl: string | null;
    description: string | null;
    owned?: boolean;
    canPurchase?: boolean;
  };
  onPurchase: (itemId: number) => void;
  isPurchasing: boolean;
}

const categoryEmojis: Record<string, string> = {
  color: '',
  shirt: '',
  hat: '',
  glasses: '',
  background: '',
  accessories: '',
};

export function StoreItemCard({ item, onPurchase, isPurchasing }: StoreItemCardProps) {
  return (
    <Card className={`
      relative transition-all hover:shadow-lg
      ${item.owned ? 'opacity-60 border-green-300' : ''}
      ${item.premiumOnly ? 'border-purple-300' : ''}
    `}>
      {/* Premium badge */}
      {item.premiumOnly && (
        <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
          Premium
        </div>
      )}

      {/* Owned badge */}
      {item.owned && (
        <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
          Comprado
        </div>
      )}

      <CardHeader>
        <div className="text-center mb-2">
          <div className="text-5xl mb-2">
          </div>
        </div>
        <CardTitle className="text-center text-lg">
          {item.name}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {item.description && (
          <p className="text-sm text-gray-600 text-center mb-4 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-medium text-gray-500 capitalize">
            {item.category}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <div className="text-center w-full">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl font-bold text-yellow-600">
              {item.price === 0 ? 'Gratis' : `${item.price} monedas`}
            </span>
          </div>
        </div>

        {item.owned ? (
          <div className="w-full space-y-2">
            <Button variant="outline" disabled className="w-full">
              Ya lo tienes
            </Button>
            <Link href="/store/purchased" className="block">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                Ver en mi colección →
              </Button>
            </Link>
          </div>
        ) : item.canPurchase ? (
          <Button
            onClick={() => onPurchase(item.id)}
            disabled={isPurchasing}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold"
          >
            {isPurchasing ? (
              <span className="flex items-center gap-2">
                Comprando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Comprar ahora
              </span>
            )}
          </Button>
        ) : (
          <div className="w-full">
            <Button variant="outline" disabled className="w-full">
              No disponible
            </Button>
            <p className="text-xs text-gray-500 text-center mt-1">
              {item.premiumOnly ? 'Requiere Premium' : 'Monedas insuficientes'}
            </p>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}






