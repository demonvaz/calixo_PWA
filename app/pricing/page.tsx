'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getStripe } from '@/lib/stripe/client';

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const plans = {
    monthly: {
      name: 'Premium Mensual',
      price: 4.99,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || 'price_monthly',
      interval: 'mes',
      save: null,
    },
    yearly: {
      name: 'Premium Anual',
      price: 49.99,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY || 'price_yearly',
      interval: 'año',
      save: '17%',
    },
  };

  const premiumFeatures = [
    { icon: '🎯', text: 'Retos diarios ilimitados' },
    { icon: '⏰', text: 'Sesiones de enfoque sin límites' },
    { icon: '✨', text: 'Items exclusivos de la tienda' },
    { icon: '🎨', text: 'Personalización avanzada del avatar' },
    { icon: '📊', text: 'Estadísticas detalladas' },
    { icon: '🏆', text: 'Insignias y logros especiales' },
    { icon: '👥', text: 'Retos sociales prioritarios' },
    { icon: '🔔', text: 'Notificaciones personalizadas' },
    { icon: '💾', text: 'Backup automático de progreso' },
    { icon: '🎁', text: 'Bonos mensuales de monedas' },
  ];

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setLoading(true);
    setError('');

    try {
      const selectedPlanData = plans[plan];

      // Create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: selectedPlanData.priceId,
          plan: 'premium',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear sesión de pago');
      }

      const { sessionId, url, preMode } = await response.json();

      // Si estamos en PRE mode, redirigir directamente
      if (preMode) {
        console.log('🔧 PRE MODE: Redirigiendo a página de éxito');
        window.location.href = url;
        return;
      }

      // PRO mode: Redirect to Stripe Checkout
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Error al cargar Stripe');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-6"
          >
            ← Volver
          </Button>

          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Desbloquea todo el potencial de CALI ✨
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Lleva tu desconexión digital al siguiente nivel con funciones premium exclusivas
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Plan Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`
                px-6 py-2 rounded-md transition-colors
                ${selectedPlan === 'monthly' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-700 hover:text-gray-900'}
              `}
            >
              Mensual
            </button>
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`
                px-6 py-2 rounded-md transition-colors relative
                ${selectedPlan === 'yearly' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-700 hover:text-gray-900'}
              `}
            >
              Anual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Free Plan */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Gratis</CardTitle>
              <CardDescription>
                Perfecto para empezar tu viaje de desconexión
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="text-4xl font-bold">$0</div>
                <div className="text-gray-600">Por siempre</div>
              </div>
              
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>3 retos diarios</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Avatar básico de CALI</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Modo enfoque limitado</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Items básicos de tienda</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Feed social</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/dashboard')}
              >
                Plan Actual
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="border-2 border-purple-500 shadow-lg relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
              ⭐ Más Popular
            </div>
            
            <CardHeader>
              <CardTitle className="text-2xl">Premium</CardTitle>
              <CardDescription>
                Todas las funciones sin límites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="text-4xl font-bold">
                  ${plans[selectedPlan].price}
                </div>
                <div className="text-gray-600">
                  Por {plans[selectedPlan].interval}
                  {plans[selectedPlan].save && (
                    <span className="ml-2 text-green-600 font-semibold">
                      Ahorra {plans[selectedPlan].save}
                    </span>
                  )}
                </div>
              </div>
              
              <ul className="space-y-3">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-xl">{feature.icon}</span>
                    <span className="font-medium">{feature.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => handleSubscribe(selectedPlan)}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Suscribirme ahora'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Preguntas Frecuentes
          </h2>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Puedo cancelar en cualquier momento?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Sí, puedes cancelar tu subscripción cuando quieras. Seguirás teniendo acceso premium hasta el final del período pagado.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Qué métodos de pago aceptan?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Aceptamos todas las tarjetas de crédito y débito principales a través de Stripe, la plataforma de pagos más segura del mundo.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Qué pasa con mis monedas si cancelo?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Todas las monedas que hayas ganado se mantendrán en tu cuenta. Solo perderás acceso a funciones premium y items exclusivos.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Ofrecen reembolsos?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Sí, ofrecemos reembolso completo dentro de los primeros 7 días si no estás satisfecho con Premium.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


