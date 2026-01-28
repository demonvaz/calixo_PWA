'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';

interface CouponCardProps {
  coupon: {
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
    owned?: boolean;
    canPurchase?: boolean;
    isOutOfStock?: boolean;
  };
  onPurchase: (couponId: number) => void;
  isPurchasing: boolean;
}

export function CouponCard({ coupon, onPurchase, isPurchasing }: CouponCardProps) {
  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((dateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'Expirado';
    }
    if (diffDays <= 7) {
      return `Vence en ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    }
    
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOutOfStock = coupon.isOutOfStock || false;
  const stockInfo = coupon.maxUses !== null && coupon.maxUses > 0 
    ? `${coupon.maxUses - coupon.currentUses} disponibles`
    : null;

  return (
    <Card className={`
      relative transition-all hover:shadow-lg border-neutral/10
      ${coupon.owned ? 'opacity-60 border-complementary-emerald/30' : isOutOfStock ? 'opacity-50 border-accent-red/30' : 'border-neutral/20'}
    `}>
      {/* Owned badge */}
      {coupon.owned && (
        <div className="absolute top-2 left-2 bg-complementary-emerald text-white text-xs px-2 py-1 rounded-full z-10 font-medium">
          Comprado
        </div>
      )}

      {/* Out of stock badge */}
      {isOutOfStock && !coupon.owned && (
        <div className="absolute top-2 left-2 bg-accent-red text-white text-xs px-2 py-1 rounded-full z-10 font-medium">
          Agotado
        </div>
      )}

      {/* Discount badge */}
      <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-bold z-10 shadow-sm">
        -{coupon.discountPercent}%
      </div>

      <CardHeader>
        {/* Imagen de la marca */}
        {coupon.brandImage && (
          <div className="flex justify-center mb-3">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden">
              <Image
                src={coupon.brandImage}
                alt={coupon.partnerName}
                fill
                className="object-cover rounded-xl"
              />
            </div>
          </div>
        )}
        
        <CardTitle className="text-center text-lg text-text-dark">
          {coupon.partnerName}
        </CardTitle>
        
        {/* Solo mostrar código si está comprado */}
        {coupon.owned && (
          <div className="text-center mt-2">
            <p className="text-sm font-mono font-semibold text-primary bg-primary/5 px-3 py-1 rounded-lg inline-block">
              {coupon.code}
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Descripción completa */}
        {coupon.description && (
          <p className="text-sm text-neutral text-center mb-4 min-h-[2.5rem] leading-relaxed">
            {coupon.description}
          </p>
        )}

        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between py-1.5 border-b border-neutral/10">
            <span className="text-neutral">Descuento:</span>
            <span className="font-bold text-complementary-emerald">
              {coupon.discountPercent}%
            </span>
          </div>
          
          {/* Fecha de validez visible */}
          <div className="flex items-center justify-between py-1.5 border-b border-neutral/10">
            <span className="text-neutral">Válido hasta:</span>
            <span className="text-text font-medium">
              {formatDate(coupon.validUntil)}
            </span>
          </div>
          
          {/* Stock disponible */}
          {stockInfo && !coupon.owned && (
            <div className="flex items-center justify-between py-1.5">
              <span className="text-neutral">Disponibles:</span>
              <span className={`font-medium ${coupon.currentUses >= (coupon.maxUses || 0) ? 'text-accent-red' : 'text-complementary-turquoise'}`}>
                {stockInfo}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        {/* Precio en monedas - más visible */}
        <div className="text-center w-full bg-primary/5 rounded-xl py-3 px-4 border border-primary/20">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xl font-bold text-primary">
              {coupon.price === 0 ? 'Gratis' : coupon.price}
            </span>
            {coupon.price > 0 && (
              <span className="text-sm text-primary/70 font-medium">monedas</span>
            )}
          </div>
        </div>

        {coupon.owned ? (
          <div className="w-full space-y-2">
            <Button variant="outline" disabled className="w-full border-complementary-emerald/30 text-complementary-emerald">
              Ya lo tienes
            </Button>
            <Link href="/store/purchased" className="block">
              <Button variant="ghost" size="sm" className="w-full text-xs text-primary hover:bg-primary/5">
                Ver en mi colección →
              </Button>
            </Link>
          </div>
        ) : isOutOfStock ? (
          <div className="w-full">
            <Button variant="outline" disabled className="w-full border-accent-red/30 text-accent-red">
              Agotado
            </Button>
            <p className="text-xs text-neutral text-center mt-1.5">
              No hay más disponibles
            </p>
          </div>
        ) : coupon.canPurchase ? (
          <Button
            onClick={() => onPurchase(coupon.id)}
            disabled={isPurchasing}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors shadow-sm hover:shadow-md"
          >
            {isPurchasing ? (
              <span className="flex items-center gap-2">
                Comprando...
              </span>
            ) : (
              <span>Comprar cupón</span>
            )}
          </Button>
        ) : (
          <div className="w-full">
            <Button variant="outline" disabled className="w-full border-neutral/20 text-neutral">
              No disponible
            </Button>
            <p className="text-xs text-neutral text-center mt-1.5">
              Monedas insuficientes
            </p>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
