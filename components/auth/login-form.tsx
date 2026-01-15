'use client';

import { useActionState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { login, signInWithGoogle } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { AuthFormDivider } from './auth-form-divider';
import { GoogleSignInButton } from './google-sign-in-button';

interface LoginFormProps {
  onToggleForm?: () => void;
}

export function LoginForm({ onToggleForm }: LoginFormProps = {}) {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const [state, formAction, pending] = useActionState(login, {});

  return (
    <div className="bg-white border border-neutral/20 rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="space-y-6">
        {/* Título */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Image
            src="/icons/icon.svg"
            alt="Calixo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <h2 className="text-3xl font-bold text-text-dark font-sans uppercase tracking-wide" style={{ fontFamily: 'Questrial, sans-serif' }}>CALIXO</h2>
        </div>

        {/* Formulario */}
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="redirect" value={redirectTo} />
          {/* Email or Username */}
          <div className="space-y-2">
            <Input
              id="emailOrUsername"
              name="emailOrUsername"
              type="text"
              required
              autoComplete="username"
              placeholder="Correo electrónico o nombre de usuario"
              className="bg-neutral/5 border-neutral/20 h-12"
              minLength={3}
            />
            <p className="text-xs text-neutral">
              Puedes iniciar sesión con tu correo electrónico o nombre de usuario
            </p>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <PasswordInput
              id="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="Contraseña"
              className="bg-neutral/5 border-neutral/20 h-12"
            />
          </div>

          {/* Forgot password link */}
          <div className="text-right">
            <Link 
              href="/auth/reset-password" 
              className="text-sm text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Error Message */}
          {state.error && (
            <div 
              className="p-3 text-sm text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-xl"
              role="alert"
            >
              {state.error}
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-12 font-semibold text-base mt-2" 
            disabled={pending}
          >
            {pending ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
        </form>

        {/* Divider */}
        <AuthFormDivider />

        {/* Google Sign In */}
        <form action={signInWithGoogle}>
          <GoogleSignInButton />
        </form>
      </div>

      {/* Sign up link */}
      <div className="text-center mt-6 pt-6 border-t border-neutral/10">
        <p className="text-sm text-neutral">
          ¿No tienes una cuenta?{' '}
          {onToggleForm ? (
            <button
              onClick={onToggleForm}
              className="text-primary hover:underline font-semibold"
            >
              Regístrate
            </button>
          ) : (
            <Link href="/auth/signup" className="text-primary hover:underline font-semibold">
              Regístrate
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}
