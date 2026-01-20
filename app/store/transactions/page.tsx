'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

interface Transaction {
  transaction: {
    id: number;
    userId: string;
    type: string;
    amount: number;
    description: string | null;
    createdAt: Date;
  };
  item: {
    id: number;
    name: string;
    category: string;
  } | null;
  challenge: {
    id: number;
    title: string;
    type: string;
  } | null;
}

interface TransactionsData {
  transactions: Transaction[];
  totals: {
    earned: number;
    spent: number;
    net: number;
  };
  count: number;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [data, setData] = useState<TransactionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'earn' | 'spend'>('all');

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('type', filter);

      const response = await fetch(`/api/transactions?${params}`);
      if (!response.ok) {
        throw new Error('Error al cargar transacciones');
      }
      const transactionsData = await response.json();
      setData(transactionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
            Historial de Transacciones
          </h1>
          <p className="text-gray-600">
            Todas tus monedas ganadas y gastadas
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-600">
                +{data.totals.earned} 🪙
              </CardTitle>
              <CardDescription>Total Ganado</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-600">
                -{data.totals.spent} 🪙
              </CardTitle>
              <CardDescription>Total Gastado</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-300 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-600">
                {data.totals.net} 🪙
              </CardTitle>
              <CardDescription>Balance Neto</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todas ({data.count})
              </Button>
              <Button
                variant={filter === 'earn' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('earn')}
              >
                💰 Ganadas
              </Button>
              <Button
                variant={filter === 'spend' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('spend')}
              >
                💸 Gastadas
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        {data.transactions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                No hay transacciones
              </h2>
              <p className="text-gray-600 mb-4">
                Completa retos para ganar monedas o compra items en la tienda
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => router.push('/challenges/daily')}>
                  🎯 Hacer Retos
                </Button>
                <Button variant="outline" onClick={() => router.push('/store')}>
                  🏪 Ir a Tienda
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.transactions.map(({ transaction, item, challenge }) => (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`
                        text-3xl w-12 h-12 rounded-full flex items-center justify-center
                        ${transaction.type === 'earn' ? 'bg-green-100' : 'bg-red-100'}
                      `}>
                        {transaction.type === 'earn' ? '💰' : '💸'}
                      </div>
                      
                      <div>
                        <p className="font-semibold text-gray-900">
                          {transaction.description || 
                           (item ? `Comprado: ${item.name}` : 
                            challenge ? `Reto: ${challenge.title}` : 
                            'Transacción')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(transaction.createdAt)}
                          {item && (
                            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              {item.category}
                            </span>
                          )}
                          {challenge && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {challenge.type}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className={`
                      text-xl font-bold
                      ${transaction.type === 'earn' ? 'text-green-600' : 'text-red-600'}
                    `}>
                      {transaction.type === 'earn' ? '+' : '-'}
                      {Math.abs(transaction.amount)} 🪙
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}






