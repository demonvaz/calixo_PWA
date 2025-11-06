import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { signOut } from '../auth/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-beige p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-dark-navy">
              ¡Bienvenido de vuelta! 👋
            </h1>
            <p className="text-neutral-gray mt-2">
              {user.user_metadata.display_name || user.email}
            </p>
          </div>
          <form action={signOut}>
            <Button variant="outline">
              Cerrar Sesión
            </Button>
          </form>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-soft-blue">0</CardTitle>
              <CardDescription>Retos Completados</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-accent-green">0</CardTitle>
              <CardDescription>Monedas Ganadas</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-dark-navy">0</CardTitle>
              <CardDescription>Días de Racha</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Welcome Message */}
        <Card>
          <CardHeader>
            <CardTitle>Tu Viaje de Desconexión Digital</CardTitle>
            <CardDescription>
              Estás a punto de comenzar una experiencia transformadora
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-neutral-gray">
              Calixo te ayudará a desconectarte del mundo digital de manera saludable.
              Completa retos diarios, personaliza tu avatar CALI y comparte tu progreso
              con una comunidad que valora el bienestar.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-beige rounded-xl">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-semibold text-dark-navy mb-1">Retos Diarios</h3>
                <p className="text-sm text-neutral-gray">
                  Completa desafíos de desconexión y gana monedas
                </p>
              </div>

              <div className="p-4 bg-beige rounded-xl">
                <div className="text-2xl mb-2">🎨</div>
                <h3 className="font-semibold text-dark-navy mb-1">Avatar CALI</h3>
                <p className="text-sm text-neutral-gray">
                  Personaliza tu avatar con accesorios únicos
                </p>
              </div>

              <div className="p-4 bg-beige rounded-xl">
                <div className="text-2xl mb-2">👥</div>
                <h3 className="font-semibold text-dark-navy mb-1">Comunidad</h3>
                <p className="text-sm text-neutral-gray">
                  Comparte tu progreso y sigue a otros usuarios
                </p>
              </div>

              <div className="p-4 bg-beige rounded-xl">
                <div className="text-2xl mb-2">🏆</div>
                <h3 className="font-semibold text-dark-navy mb-1">Logros</h3>
                <p className="text-sm text-neutral-gray">
                  Desbloquea hitos y mantén tu racha
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-neutral-gray">Email:</dt>
                <dd className="font-medium">{user.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-gray">ID de Usuario:</dt>
                <dd className="font-medium font-mono text-sm">{user.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-gray">Creado:</dt>
                <dd className="font-medium">
                  {new Date(user.created_at).toLocaleDateString('es-ES')}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="border-soft-blue">
          <CardHeader>
            <CardTitle>🚀 Próximos Pasos</CardTitle>
            <CardDescription>
              La implementación continúa...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-neutral-gray">
              <li>Sistema de retos (Fase 4)</li>
              <li>Avatar CALI (Fase 5)</li>
              <li>Tienda y monedas (Fase 6)</li>
              <li>Feed social (Fase 7)</li>
              <li>Y mucho más...</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

