'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import Image from 'next/image';

interface PurchasedCoupon {
  purchase: {
    id: number;
    purchasedAt: string;
  };
  coupon: {
    id: number;
    code: string;
    discountPercent: number;
    partnerName: string;
    description: string | null;
    price: number;
    validUntil: string;
    brandImage: string | null;
  } | null;
  transaction: {
    id: number;
    amount: number;
    description: string | null;
    createdAt: string;
  } | null;
}

interface PurchasedData {
  items: PurchasedCoupon[];
  total: number;
}

export default function PurchasedCouponsPage() {
  const router = useRouter();
  const [data, setData] = useState<PurchasedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchPurchasedCoupons();
  }, []);

  const fetchPurchasedCoupons = async () => {
    try {
      const response = await fetch('/api/store/purchased');
      if (!response.ok) {
        throw new Error('Error al cargar cupones comprados');
      }
      const purchasedData = await response.json();
      setData(purchasedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filtrar por búsqueda
  const filteredItems = data?.items.filter(item => {
    if (!item.coupon) return false;
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      item.coupon.partnerName?.toLowerCase().includes(query) ||
      item.coupon.code?.toLowerCase().includes(query) ||
      item.coupon.description?.toLowerCase().includes(query)
    );
  }) || [];

  // Paginación
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Resetear página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) {
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
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-text-dark mb-2">
                Mi Colección
              </h1>
              <p className="text-neutral text-sm">
                Tus cupones comprados y disponibles
              </p>
            </div>
            <Link href="/store">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                Ir a Tienda
              </Button>
            </Link>
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
              placeholder="Buscar por empresa, código o descripción..."
              className="w-full px-4 py-3 border border-neutral/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-text"
            />
            {searchQuery && (
              <p className="text-sm text-neutral mt-2">
                {filteredItems.length} resultado{filteredItems.length !== 1 ? 's' : ''} encontrado{filteredItems.length !== 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Purchased Coupons Grid */}
        {paginatedItems.length === 0 ? (
          <Card className="border-neutral/10">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-4xl">📦</span>
              </div>
              <h2 className="text-2xl font-semibold text-text-dark mb-2">
                {searchQuery ? 'No se encontraron resultados' : 'No has comprado ningún cupón'}
              </h2>
              <p className="text-neutral mb-6">
                {searchQuery 
                  ? 'Intenta buscar con otros términos'
                  : 'Visita la tienda para comenzar a comprar cupones de descuento'}
              </p>
              {!searchQuery && (
                <Link href="/store">
                  <Button className="bg-primary hover:bg-primary-dark">
                    Ir a Tienda
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {paginatedItems.map(({ purchase, coupon, transaction }) => {
              if (!coupon) return null;
              
              const isValid = new Date(coupon.validUntil) > new Date();
              
              return (
                <Card
                  key={purchase.id}
                  className={`
                    relative transition-all hover:shadow-lg border-neutral/10
                    ${!isValid ? 'opacity-60 border-neutral/20' : 'border-neutral/20'}
                  `}
                >
                  {/* Expired badge */}
                  {!isValid && (
                    <div className="absolute top-2 right-2 bg-neutral text-white text-xs px-2 py-1 rounded-full z-10 font-medium">
                      Expirado
                    </div>
                  )}

                  {/* Discount badge */}
                  <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-bold z-10 shadow-sm">
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
                    
                    <div className="text-center mt-2">
                      <p className="text-sm font-mono font-semibold text-primary bg-primary/5 px-3 py-1 rounded-lg inline-block">
                        {coupon.code}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {coupon.description && (
                      <p className="text-sm text-neutral text-center mb-4 leading-relaxed">
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

                      {transaction && (
                        <div className="flex items-center justify-between py-1.5 border-b border-neutral/10">
                          <span className="text-neutral">Precio pagado:</span>
                          <span className="font-bold text-primary">
                            {Math.abs(transaction.amount)} monedas
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between py-1.5 border-b border-neutral/10">
                        <span className="text-neutral">Comprado:</span>
                        <span className="text-text font-medium">
                          {formatDate(purchase.purchasedAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-neutral">Válido hasta:</span>
                        <span className={`font-medium ${isValid ? 'text-complementary-emerald' : 'text-accent-red'}`}>
                          {formatDate(coupon.validUntil)}
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <CardContent className="pt-0">
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                      <p className="text-xs font-semibold text-primary mb-1">
                        Código: {coupon.code}
                      </p>
                      <p className="text-xs text-neutral leading-relaxed">
                        Usa este código en {coupon.partnerName} para obtener un {coupon.discountPercent}% de descuento
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-primary text-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          onClick={() => setCurrentPage(page)}
                          className={
                            currentPage === page
                              ? 'bg-primary hover:bg-primary-dark'
                              : 'border-primary text-primary hover:bg-primary/5'
                          }
                          size="sm"
                        >
                          {page}
                        </Button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2 text-neutral">...</span>;
                    }
                    return null;
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-primary text-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
