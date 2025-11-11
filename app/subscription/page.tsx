'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SubscriptionData {
  subscription: {
    id: number;
    stripeSubscriptionId: string;
    status: string;
    plan: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  } | null;
  profile: {
    isPremium: boolean;
    displayName: string;
  };
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [managingPortal, setManagingPortal] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      // For now, we simulate the data
      // In production, you'd have an API endpoint like /api/subscription
      setError('');
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al abrir el portal');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setManagingPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚙️</div>
          <p className="text-gray-600">Cargando subscripción...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            ← Volver
          </Button>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Mi Subscripción
          </h1>
          <p className="text-gray-600">
            Gestiona tu plan y preferencias de pago
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {/* No Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Gratuito</CardTitle>
            <CardDescription>
              Actualmente estás usando el plan gratuito
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Actualiza a Premium para desbloquear todas las funciones sin límites y llevar tu experiencia con CALI al máximo.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="border rounded-lg p-4">
                <div className="text-2xl mb-2">✨</div>
                <h3 className="font-semibold mb-2">Funciones Ilimitadas</h3>
                <p className="text-sm text-gray-600">
                  Retos diarios sin límite y modo enfoque sin restricciones
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="text-2xl mb-2">🎨</div>
                <h3 className="font-semibold mb-2">Items Exclusivos</h3>
                <p className="text-sm text-gray-600">
                  Acceso a personalización premium y items únicos
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold mb-2">Estadísticas Avanzadas</h3>
                <p className="text-sm text-gray-600">
                  Análisis detallado de tu progreso y hábitos
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="text-2xl mb-2">🎁</div>
                <h3 className="font-semibold mb-2">Bonos Mensuales</h3>
                <p className="text-sm text-gray-600">
                  Recibe monedas extra cada mes automáticamente
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => router.push('/pricing')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Ver Planes Premium
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Continuar con Gratuito
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Info (shown when user has premium) */}
        {/* This section would be shown when data.subscription exists */}
      </div>
    </div>
  );
}



