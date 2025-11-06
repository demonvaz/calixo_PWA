'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signup, signInWithGoogle } from '../actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, {});

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-beige">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            Únete a <span className="text-soft-blue">Calixo</span>
          </CardTitle>
          <CardDescription className="text-center">
            Crea tu cuenta y comienza tu viaje de desconexión digital
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="space-y-4">
            {/* Display Name */}
            <div className="space-y-2">
              <label 
                htmlFor="displayName" 
                className="text-sm font-medium text-dark-navy"
              >
                Nombre de Usuario
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                autoComplete="name"
                className="w-full px-4 py-2 border border-neutral-gray/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-soft-blue"
                placeholder="Tu nombre"
                minLength={3}
                maxLength={50}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="text-sm font-medium text-dark-navy"
              >
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-4 py-2 border border-neutral-gray/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-soft-blue"
                placeholder="tu@email.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="text-sm font-medium text-dark-navy"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                className="w-full px-4 py-2 border border-neutral-gray/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-soft-blue"
                placeholder="••••••••"
                minLength={8}
              />
              <p className="text-xs text-neutral-gray">
                Mínimo 8 caracteres, incluye mayúscula, minúscula y número
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label 
                htmlFor="confirmPassword" 
                className="text-sm font-medium text-dark-navy"
              >
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                className="w-full px-4 py-2 border border-neutral-gray/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-soft-blue"
                placeholder="••••••••"
              />
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 text-soft-blue focus:ring-soft-blue border-neutral-gray/20 rounded"
              />
              <label htmlFor="acceptTerms" className="text-sm text-neutral-gray">
                Acepto los{' '}
                <Link href="/terms" className="text-soft-blue hover:underline">
                  términos y condiciones
                </Link>{' '}
                y la{' '}
                <Link href="/privacy" className="text-soft-blue hover:underline">
                  política de privacidad
                </Link>
              </label>
            </div>

            {/* Error/Success Message */}
            {state.error && (
              <div 
                className="p-3 text-sm text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-xl"
                role="alert"
              >
                {state.error}
              </div>
            )}

            {state.success && (
              <div 
                className="p-3 text-sm text-accent-green bg-accent-green/10 border border-accent-green/20 rounded-xl"
                role="alert"
              >
                {state.message}
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={pending}
            >
              {pending ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-gray/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-neutral-gray">
                O continúa con
              </span>
            </div>
          </div>

          {/* Google Sign Up */}
          <form action={signInWithGoogle}>
            <Button
              type="submit"
              variant="outline"
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar con Google
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-neutral-gray">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/auth/login" className="text-soft-blue hover:underline font-medium">
              Inicia sesión
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

