'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');

  useEffect(() => {
    // Here you could verify the session with Stripe
    // and update the UI accordingly
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center py-12 px-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-2">¡Bienvenido a Premium!</CardTitle>
          <CardDescription className="text-lg">
            Tu subscripción ha sido activada exitosamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-semibold mb-2">
              Pago procesado correctamente
            </p>
            <p className="text-sm text-green-700">
              Recibirás un email de confirmación con los detalles de tu subscripción.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Ahora puedes disfrutar de:</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span>Retos diarios ilimitados</span>
              </li>
              <li className="flex items-center gap-2">
                <span>Items exclusivos de la tienda</span>
              </li>
              <li className="flex items-center gap-2">
                <span>Personalización avanzada del avatar</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <span>Estadísticas detalladas</span>
              </li>
              <li className="flex items-center gap-2">
                <span>Bonos mensuales de monedas</span>
              </li>
            </ul>
          </div>

          <div className="border-t pt-6 space-y-4">
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              Ir al Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/store')}
              className="w-full"
            >
              Explorar Items Premium
            </Button>
          </div>

          <p className="text-sm text-gray-600 text-center">
            Si tienes alguna pregunta, contáctanos en soporte@calixo.app
          </p>
        </CardContent>
      </Card>
    </div>
  );
}






