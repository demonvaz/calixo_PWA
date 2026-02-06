'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signup } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { AuthFormDivider } from './auth-form-divider';
import { GoogleSignInButton } from './google-sign-in-button';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { ProfilePhotoModal } from '@/components/profile/profile-photo-modal';

interface SignupFormMultistepProps {
  onToggleForm?: () => void;
}

type SignupStep = 'credentials' | 'profile' | 'photo';

export function SignupFormMultistep({ onToggleForm }: SignupFormMultistepProps = {}) {
  const [step, setStep] = useState<SignupStep>('credentials');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Step 1: Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [touchedTerms, setTouchedTerms] = useState(false);
  
  // Password validation
  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };
  
  const passwordIsValid = Object.values(passwordRequirements).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Step 2: Profile
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<string>('no_responder');
  const [birthDate, setBirthDate] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({
    checking: false,
    available: null,
    message: '',
  });

  // Step 3: Photo
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const debouncedDisplayName = useDebounce(displayName.trim(), 500);

  // Check username availability
  useEffect(() => {
    if (step !== 'profile') return;

    if (debouncedDisplayName === '') {
      setUsernameCheck({
        checking: false,
        available: null,
        message: '',
      });
      return;
    }

    if (debouncedDisplayName.length < 2) {
      setUsernameCheck({
        checking: false,
        available: null,
        message: '',
      });
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(debouncedDisplayName)) {
      setUsernameCheck({
        checking: false,
        available: false,
        message: 'El nombre solo puede contener letras, números y guiones bajos',
      });
      return;
    }

    const checkUsername = async () => {
      setUsernameCheck({
        checking: true,
        available: null,
        message: 'Verificando disponibilidad...',
      });

      try {
        const response = await fetch(
          `/api/profile/check-username?username=${encodeURIComponent(debouncedDisplayName)}`
        );

        if (!response.ok) {
          throw new Error('Error al verificar el nombre de usuario');
        }

        const data = await response.json();
        setUsernameCheck({
          checking: false,
          available: data.available,
          message: data.message || '',
        });
      } catch (err) {
        setUsernameCheck({
          checking: false,
          available: null,
          message: 'Error al verificar disponibilidad',
        });
      }
    };

    checkUsername();
  }, [debouncedDisplayName, step]);


  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      setTouchedTerms(true);
      setTermsError('Debes aceptar los términos y condiciones');
      return;
    }

    if (!passwordIsValid) {
      return;
    }

    if (!passwordsMatch) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Create form data and submit
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('confirmPassword', confirmPassword);
      formData.append('displayName', 'Usuario'); // Temporary, will be updated in step 2
      formData.append('acceptTerms', acceptTerms ? 'on' : '');
      formData.append('step', 'credentials');

      const result = await signup({}, formData);
      
      if (result.success && !result.error) {
        // Save user ID if returned
        if ((result as any).userId) {
          setUserId((result as any).userId);
        }
        // Move to profile step immediately
        setStep('profile');
      } else {
        setSubmitError(result.error || 'Error al crear la cuenta');
      }
    } catch (error) {
      setSubmitError('Error inesperado. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      return;
    }

    if (displayName.trim().length < 2) {
      return;
    }

    if (usernameCheck.checking || usernameCheck.available === false) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Update profile with step 2 data
      const formData = new FormData();
      formData.append('displayName', displayName.trim());
      formData.append('gender', gender);
      formData.append('birthDate', birthDate);
      formData.append('isPrivate', isPrivate.toString());
      formData.append('step', 'profile');
      
      // Include userId if we have it
      if (userId) {
        formData.append('userId', userId);
      }

      const result = await signup({}, formData);
      
      if (result.success && !result.error) {
        setStep('photo');
      } else {
        setSubmitError(result.error || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error in step 2:', error);
      setSubmitError(error instanceof Error ? error.message : 'Error inesperado. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep3Complete = () => {
    // Redirect to email verification page
    const emailParam = email ? `?email=${encodeURIComponent(email)}` : '';
    window.location.href = `/auth/verify-email${emailParam}`;
  };

  const canProceedToStep2 = () => {
    return email && passwordIsValid && passwordsMatch && acceptTerms;
  };

  const canProceedToStep3 = () => {
    return (
      displayName.trim().length >= 2 &&
      usernameCheck.available === true &&
      !usernameCheck.checking
    );
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'credentials', label: 'Credenciales', number: 1 },
      { key: 'profile', label: 'Perfil', number: 2 },
      { key: 'photo', label: 'Foto', number: 3 },
    ];

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((s, index) => (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors',
                  step === s.key
                    ? 'bg-primary text-white'
                    : ['credentials', 'profile', 'photo'].indexOf(step) > steps.indexOf(s)
                    ? 'bg-complementary-emerald text-white'
                    : 'bg-neutral/20 text-neutral'
                )}
              >
                {['credentials', 'profile', 'photo'].indexOf(step) > steps.indexOf(s) ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  s.number
                )}
              </div>
              <span
                className={cn(
                  'text-xs mt-2 font-medium',
                  step === s.key ? 'text-primary' : 'text-neutral'
                )}
              >
                {s.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-16 h-1 mx-2 transition-colors',
                  ['credentials', 'profile', 'photo'].indexOf(step) > steps.indexOf(s)
                    ? 'bg-complementary-emerald'
                    : 'bg-neutral/20'
                )}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white border border-neutral/20 rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="space-y-6">
        {/* Logo */}
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

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step 1: Credentials */}
        {step === 'credentials' && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <h3 className="text-xl font-semibold text-text-dark mb-4">Crea tu cuenta</h3>

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                className={cn(
                  'bg-neutral/5 border-neutral/20 h-12',
                  password.length > 0 && !passwordIsValid && 'border-accent-red focus:ring-accent-red'
                )}
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {password.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-700 mb-2">Requisitos de contraseña:</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {passwordRequirements.minLength ? (
                        <svg className="h-4 w-4 text-complementary-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={cn(
                        'text-xs',
                        passwordRequirements.minLength ? 'text-complementary-emerald' : 'text-gray-500'
                      )}>
                        Mínimo 8 caracteres
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordRequirements.hasUpperCase ? (
                        <svg className="h-4 w-4 text-complementary-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={cn(
                        'text-xs',
                        passwordRequirements.hasUpperCase ? 'text-complementary-emerald' : 'text-gray-500'
                      )}>
                        Al menos una mayúscula
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordRequirements.hasLowerCase ? (
                        <svg className="h-4 w-4 text-complementary-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={cn(
                        'text-xs',
                        passwordRequirements.hasLowerCase ? 'text-complementary-emerald' : 'text-gray-500'
                      )}>
                        Al menos una minúscula
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordRequirements.hasNumber ? (
                        <svg className="h-4 w-4 text-complementary-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={cn(
                        'text-xs',
                        passwordRequirements.hasNumber ? 'text-complementary-emerald' : 'text-gray-500'
                      )}>
                        Al menos un número
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                required
                autoComplete="new-password"
                placeholder="Confirmar contraseña"
                className={cn(
                  'bg-neutral/5 border-neutral/20 h-12',
                  confirmPassword.length > 0 && !passwordsMatch && 'border-accent-red focus:ring-accent-red'
                )}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-2">
                  {passwordsMatch ? (
                    <>
                      <svg className="h-4 w-4 text-complementary-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs text-complementary-emerald">Las contraseñas coinciden</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-xs text-accent-red">Las contraseñas no coinciden</span>
                    </>
                  )}
                </div>
              )}
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
                    className={cn(
                      'h-5 w-5 appearance-none rounded border-2 transition-all duration-200',
                      'focus:ring-2 focus:ring-primary focus:ring-offset-0',
                      'cursor-pointer relative',
                      termsError
                        ? 'border-accent-red bg-accent-red/10'
                        : acceptTerms
                        ? 'border-primary bg-primary'
                        : 'border-neutral/30 bg-white hover:border-primary/50'
                    )}
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

            {/* Error Message */}
            {submitError && (
              <div
                className="p-3 text-sm text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-xl"
                role="alert"
              >
                {submitError}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 font-semibold text-base mt-2"
              disabled={isSubmitting || !canProceedToStep2()}
            >
              {isSubmitting ? 'Creando cuenta...' : 'Continuar'}
            </Button>
          </form>
        )}

        {/* Step 2: Profile */}
        {step === 'profile' && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <h3 className="text-xl font-semibold text-text-dark mb-4">Completa tu perfil</h3>

            {/* Display Name */}
            <div className="space-y-2">
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Nombre de usuario
              </label>
              <div className="relative">
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                  }}
                  placeholder="Tu nombre de usuario"
                  maxLength={50}
                  required
                  className={cn(
                    'bg-neutral/5 border-neutral/20 h-12',
                    displayName.trim().length >= 2 &&
                      usernameCheck.available !== null &&
                      !usernameCheck.checking &&
                      (usernameCheck.available
                        ? 'border-complementary-emerald focus:ring-complementary-emerald'
                        : 'border-accent-red focus:ring-accent-red')
                  )}
                />
                {displayName.trim().length >= 2 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameCheck.checking ? (
                      <Spinner size="sm" />
                    ) : usernameCheck.available === true ? (
                      <svg
                        className="h-5 w-5 text-complementary-emerald"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : usernameCheck.available === false ? (
                      <svg
                        className="h-5 w-5 text-accent-red"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    ) : null}
                  </div>
                )}
              </div>
              {displayName.trim().length > 0 && (
                <>
                  {(() => {
                    const usernameRegex = /^[a-zA-Z0-9_]+$/;
                    const hasInvalidChars = !usernameRegex.test(displayName.trim());

                    if (hasInvalidChars) {
                      return (
                        <p className="text-xs text-accent-red">
                          El nombre solo puede contener letras, números y guiones bajos (_)
                        </p>
                      );
                    }

                    if (displayName.trim().length < 2) {
                      return (
                        <p className="text-xs text-gray-500">
                          El nombre debe tener al menos 2 caracteres
                        </p>
                      );
                    }

                    if (
                      displayName.trim().length >= 2 &&
                      usernameCheck.message
                    ) {
                      return (
                        <p
                          className={cn(
                            'text-xs',
                            usernameCheck.available === true
                              ? 'text-complementary-emerald'
                              : usernameCheck.available === false
                              ? 'text-accent-red'
                              : 'text-gray-500'
                          )}
                        >
                          {usernameCheck.message}
                        </p>
                      );
                    }

                    return null;
                  })()}
                </>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                Sexo
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-neutral/20 bg-neutral/5 px-4 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                <option value="no_responder">No responder</option>
                <option value="femenino">Femenino</option>
                <option value="masculino">Masculino</option>
              </select>
            </div>

            {/* Birth Date */}
            <div className="space-y-2">
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
                Fecha de nacimiento
              </label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="bg-neutral/5 border-neutral/20 h-12"
              />
            </div>

            {/* Privacy */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-5 w-5 rounded border-2 border-neutral/30 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="isPrivate" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Perfil privado
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-8">
                Si activas esta opción, solo tus seguidores podrán ver tu perfil y contenido
              </p>
            </div>

            {/* Error Message */}
            {submitError && (
              <div
                className="p-3 text-sm text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-xl"
                role="alert"
              >
                {submitError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('credentials')}
                className="flex-1 h-12"
                disabled={isSubmitting}
              >
                Atrás
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 font-semibold"
                disabled={isSubmitting || !canProceedToStep3()}
              >
                {isSubmitting ? 'Guardando...' : 'Continuar'}
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Photo */}
        {step === 'photo' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-text-dark mb-4">Añade tu foto de perfil</h3>
            <p className="text-sm text-neutral mb-6">
              Puedes subir una foto ahora o hacerlo más tarde desde tu perfil
            </p>

            {/* Photo Preview */}
            <div className="flex justify-center mb-6">
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(true)}
                className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 hover:border-primary transition-colors cursor-pointer"
              >
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt="Foto de perfil"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg
                      className="w-16 h-16"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="text-white text-xs font-medium opacity-0 hover:opacity-100 transition-opacity">
                    {photoUrl ? 'Cambiar' : 'Subir'}
                  </span>
                </div>
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={handleStep3Complete}
                className="w-full h-12 font-semibold"
              >
                {photoUploaded ? 'Continuar' : 'Omitir por ahora'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPhotoModalOpen(true)}
                className="w-full h-12"
              >
                {photoUploaded ? 'Cambiar foto' : 'Subir foto'}
              </Button>
            </div>
          </div>
        )}

        {/* Photo Modal */}
        <ProfilePhotoModal
          isOpen={isPhotoModalOpen}
          currentPhotoUrl={photoUrl}
          onClose={() => setIsPhotoModalOpen(false)}
          onPhotoUpdated={(newPhotoUrl) => {
            setPhotoUploaded(true);
            setIsPhotoModalOpen(false);
            // Update photo URL immediately if provided
            if (newPhotoUrl) {
              setPhotoUrl(newPhotoUrl);
            } else {
              // If photo was deleted, clear the URL
              setPhotoUrl(null);
              setPhotoUploaded(false);
            }
          }}
        />

        {/* Only show divider and Google sign up on first step */}
        {step === 'credentials' && (
          <>
            <AuthFormDivider />
            <form action={signup}>
              <GoogleSignInButton />
            </form>
          </>
        )}

        {/* Login link */}
        {step === 'credentials' && (
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
        )}
      </div>
    </div>
  );
}
