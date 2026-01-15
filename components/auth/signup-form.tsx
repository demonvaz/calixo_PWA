'use client';

import { useActionState, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signup, signInWithGoogle } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { AuthFormDivider } from './auth-form-divider';
import { GoogleSignInButton } from './google-sign-in-button';

interface SignupFormProps {
  onToggleForm?: () => void;
}

export function SignupForm({ onToggleForm }: SignupFormProps = {}) {
  const [state, formAction, pending] = useActionState(signup, {});
  const [displayName, setDisplayName] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [touchedTerms, setTouchedTerms] = useState(false);

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Prevenir espacios mientras se escribe
    if (value.includes(' ')) {
      setDisplayNameError('El nombre de usuario no puede contener espacios');
      // Remover espacios automáticamente
      const valueWithoutSpaces = value.replace(/\s/g, '');
      setDisplayName(valueWithoutSpaces);
    } else {
      setDisplayName(value);
      setDisplayNameError('');
    }
  };

  // Manejar errores del servidor relacionados con términos
  useEffect(() => {
    if (state.error && state.error.includes('términos')) {
      setTermsError(state.error);
      setTouchedTerms(true);
    }
  }, [state.error]);

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
        <form 
          action={formAction} 
          className="space-y-4"
          onSubmit={(e) => {
            if (!acceptTerms) {
              e.preventDefault();
              setTouchedTerms(true);
              setTermsError('Debes aceptar los términos y condiciones');
            }
          }}
        >
          {/* Display Name */}
          <div className="space-y-2">
            <Input
              id="displayName"
              name="displayName"
              type="text"
              required
              autoComplete="name"
              placeholder="Nombre de usuario"
              className={`bg-neutral/5 border-neutral/20 h-12 ${displayNameError ? 'border-accent-red' : ''}`}
              minLength={3}
              maxLength={50}
              value={displayName}
              onChange={handleDisplayNameChange}
              onKeyDown={(e) => {
                // Prevenir que se escriba espacio
                if (e.key === ' ') {
                  e.preventDefault();
                  setDisplayNameError('El nombre de usuario no puede contener espacios');
                }
              }}
            />
            {displayNameError && (
              <p className="text-xs text-accent-red">
                {displayNameError}
              </p>
            )}
            {!displayNameError && displayName.length > 0 && (
              <p className="text-xs text-neutral">
                Mínimo 3 caracteres, sin espacios
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="Correo electrónico"
              className="bg-neutral/5 border-neutral/20 h-12"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <PasswordInput
              id="password"
              name="password"
              required
              autoComplete="new-password"
              placeholder="Contraseña"
              className="bg-neutral/5 border-neutral/20 h-12"
              minLength={8}
            />
            <p className="text-xs text-neutral">
              Mínimo 8 caracteres
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              required
              autoComplete="new-password"
              placeholder="Confirmar contraseña"
              className="bg-neutral/5 border-neutral/20 h-12"
            />
          </div>

          {/* Terms */}
          <div className="space-y-2">
            <div className="flex items-start space-x-3">
              <div className="relative flex items-center h-5 mt-0.5">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  required
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    setTouchedTerms(true);
                    if (e.target.checked) {
                      setTermsError('');
                    } else if (touchedTerms) {
                      setTermsError('Debes aceptar los términos y condiciones');
                    }
                  }}
                  onBlur={() => {
                    setTouchedTerms(true);
                    if (!acceptTerms) {
                      setTermsError('Debes aceptar los términos y condiciones');
                    }
                  }}
                  className={`
                    h-5 w-5 appearance-none rounded border-2 transition-all duration-200
                    focus:ring-2 focus:ring-primary focus:ring-offset-0
                    cursor-pointer relative
                    ${termsError 
                      ? 'border-accent-red bg-accent-red/10' 
                      : acceptTerms 
                        ? 'border-primary bg-primary' 
                        : 'border-neutral/30 bg-white hover:border-primary/50'
                    }
                  `}
                  style={{
                    backgroundImage: acceptTerms 
                      ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='white'%3E%3Cpath fill-rule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clip-rule='evenodd'/%3E%3C/svg%3E")`
                      : 'none',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              </div>
              <label 
                htmlFor="acceptTerms" 
                className="text-xs text-neutral leading-relaxed cursor-pointer flex-1 select-none"
              >
                Acepto los{' '}
                <Link 
                  href="/legal/terminos-condiciones" 
                  className="text-primary hover:underline font-medium transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  términos y condiciones
                </Link>
              </label>
            </div>
            {termsError && (
              <p className="text-xs text-accent-red ml-8 animate-in fade-in duration-200">
                {termsError}
              </p>
            )}
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
              className="p-3 text-sm text-complementary-emerald bg-complementary-emerald/10 border border-complementary-emerald/20 rounded-xl"
              role="alert"
            >
              {state.message}
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-12 font-semibold text-base mt-2" 
            disabled={pending}
          >
            {pending ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>

        {/* Divider */}
        <AuthFormDivider />

        {/* Google Sign Up */}
        <form action={signInWithGoogle}>
          <GoogleSignInButton />
        </form>
      </div>

      {/* Login link */}
      <div className="text-center mt-6 pt-6 border-t border-neutral/10">
        <p className="text-sm text-neutral">
          ¿Ya tienes una cuenta?{' '}
          {onToggleForm ? (
            <button
              onClick={onToggleForm}
              className="text-primary hover:underline font-semibold"
            >
              Inicia sesión
            </button>
          ) : (
            <Link href="/auth/login" className="text-primary hover:underline font-semibold">
              Inicia sesión
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}
