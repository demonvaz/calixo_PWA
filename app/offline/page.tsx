import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Sin Conexión - Calixo',
  description: 'No hay conexión a internet disponible',
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 text-6xl">
          </div>
          <CardTitle className="text-3xl text-text-dark font-serif">Sin Conexión</CardTitle>
          <CardDescription className="text-lg mt-2">
            Parece que no tienes conexión a internet en este momento
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* What's available */}
          <div className="bg-primary/10 border border-soft-blue/20 rounded-lg p-6">
            <h3 className="font-semibold text-text-dark font-serif mb-3 flex items-center gap-2">
              Disponible offline:
            </h3>
            <ul className="space-y-2 text-neutral">
              <li className="flex items-center gap-2">
                <span className="text-complementary-emerald">●</span>
                Ver contenido previamente cargado
              </li>
              <li className="flex items-center gap-2">
                <span className="text-complementary-emerald">●</span>
                Tu perfil y avatar CALI
              </li>
              <li className="flex items-center gap-2">
                <span className="text-complementary-emerald">●</span>
                Historial de retos completados
              </li>
              <li className="flex items-center gap-2">
                <span className="text-complementary-emerald">●</span>
                Posts del feed (cacheados)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-complementary-emerald">●</span>
                Tus estadísticas
              </li>
            </ul>
          </div>

          {/* What's NOT available */}
          <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg p-6">
            <h3 className="font-semibold text-text-dark font-serif mb-3 flex items-center gap-2">
              No disponible offline:
            </h3>
            <ul className="space-y-2 text-neutral">
              <li className="flex items-center gap-2">
                <span className="text-accent-red">●</span>
                Iniciar nuevos retos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-red">●</span>
                Comprar items en la tienda
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-red">●</span>
                Dar likes o comentar
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-red">●</span>
                Ver contenido nuevo
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-red">●</span>
                Seguir usuarios
              </li>
            </ul>
          </div>

          {/* Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-text-dark font-serif mb-3 flex items-center gap-2">
              Consejos:
            </h3>
            <ul className="space-y-2 text-neutral text-sm">
              <li>
                • Verifica que tu WiFi o datos móviles estén activados
              </li>
              <li>
                • Si estás en modo avión, desactívalo
              </li>
              <li>
                • Intenta moverte a un área con mejor señal
              </li>
              <li>
                • Las acciones que hagas offline se sincronizarán automáticamente cuando vuelvas a conectarte
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Reintentar Conexión
            </Button>

            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Ir al Dashboard
              </Button>
            </Link>
          </div>

          {/* Background sync info */}
          <div className="text-center text-sm text-neutral pt-4 border-t">
            <p>
              <strong>Sincronización automática activada:</strong>
            </p>
            <p className="mt-1">
              Tus acciones pendientes se completarán cuando vuelvas a tener conexión
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



