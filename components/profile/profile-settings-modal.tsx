'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import { useDebounce } from '@/lib/hooks/use-debounce';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  currentProfile: {
    displayName: string;
    email: string | null;
    gender: string | null;
    birthDate: string | null;
    isPrivate: boolean;
  };
  onClose: () => void;
  onProfileUpdated: () => void;
}

export function ProfileSettingsModal({
  isOpen,
  currentProfile,
  onClose,
  onProfileUpdated,
}: ProfileSettingsModalProps) {
  const [displayName, setDisplayName] = useState(currentProfile.displayName);
  const [email, setEmail] = useState(currentProfile.email || '');
  const [gender, setGender] = useState<string>(currentProfile.gender || 'no_responder');
  const [birthDate, setBirthDate] = useState(
    currentProfile.birthDate ? currentProfile.birthDate.split('T')[0] : ''
  );
  const [isPrivate, setIsPrivate] = useState(currentProfile.isPrivate);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [usernameCheck, setUsernameCheck] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({
    checking: false,
    available: null,
    message: '',
  });
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const { showToast } = useToast();

  // Debounce username for checking availability
  const debouncedDisplayName = useDebounce(displayName.trim(), 500);

  // Reset form when modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      setDisplayName(currentProfile.displayName);
      setEmail(currentProfile.email || '');
      setGender(currentProfile.gender || 'no_responder');
      setBirthDate(currentProfile.birthDate ? currentProfile.birthDate.split('T')[0] : '');
      setIsPrivate(currentProfile.isPrivate);
      setError('');
      setUsernameCheck({
        checking: false,
        available: null,
        message: '',
      });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, currentProfile]);

  // Check username availability when debounced value changes
  useEffect(() => {
    // Don't check if username hasn't changed from original
    if (debouncedDisplayName === currentProfile.displayName) {
      setUsernameCheck({
        checking: false,
        available: true,
        message: '',
      });
      return;
    }

    // Don't check if username is empty or too short
    if (!debouncedDisplayName || debouncedDisplayName.length < 2) {
      setUsernameCheck({
        checking: false,
        available: null,
        message: '',
      });
      return;
    }

    // Validate characters before checking availability
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(debouncedDisplayName)) {
      setUsernameCheck({
        checking: false,
        available: false,
        message: 'El nombre solo puede contener letras, números y guiones bajos',
      });
      return;
    }

    // Check username availability
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
  }, [debouncedDisplayName, currentProfile.displayName]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!displayName.trim()) {
      setError('El nombre de usuario es requerido');
      return;
    }

    if (displayName.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (displayName.length > 50) {
      setError('El nombre no puede exceder 50 caracteres');
      return;
    }

    // Check if username is available (only if it changed)
    if (displayName.trim() !== currentProfile.displayName) {
      if (usernameCheck.checking) {
        setError('Por favor espera mientras verificamos la disponibilidad');
        return;
      }

      if (usernameCheck.available === false) {
        setError('Este nombre de usuario ya está en uso');
        return;
      }

      if (usernameCheck.available === null) {
        setError('Por favor verifica que el nombre de usuario esté disponible');
        return;
      }
    }

    if (!email.trim()) {
      setError('El email es requerido');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('El email no es válido');
      return;
    }

    setIsSaving(true);

    try {
      const updateData: Record<string, any> = {
        displayName: displayName.trim(),
        email: email.trim(),
        gender: gender === 'no_responder' ? null : gender,
        isPrivate,
      };

      if (birthDate) {
        updateData.birthDate = birthDate;
      } else {
        updateData.birthDate = null;
      }

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar el perfil');
      }

      showToast('Ajustes actualizados exitosamente', 'success');
      onProfileUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed z-[9999] flex items-center justify-center',
        'bg-black/50 backdrop-blur-sm',
        'transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        margin: 0,
        padding: '1rem',
        overflow: 'auto',
      }}
      onClick={handleBackdropClick}
    >
      <Card
        className={cn(
          'w-full max-w-lg shadow-2xl',
          'transform transition-all duration-300',
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Ajustes del Perfil
          </CardTitle>
          <CardDescription>
            Actualiza tu información personal y preferencias de privacidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

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
                    setError('');
                  }}
                  placeholder="Tu nombre de usuario"
                  maxLength={50}
                  required
                  disabled={isSaving}
                  className={cn(
                    displayName.trim() !== currentProfile.displayName &&
                      usernameCheck.available !== null &&
                      !usernameCheck.checking &&
                      (usernameCheck.available
                        ? 'border-green-500 focus:ring-green-500'
                        : 'border-red-500 focus:ring-red-500')
                  )}
                />
                {displayName.trim() !== currentProfile.displayName &&
                  displayName.trim().length >= 2 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameCheck.checking ? (
                        <Spinner size="sm" />
                      ) : usernameCheck.available === true ? (
                        <svg
                          className="h-5 w-5 text-green-500"
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
                          className="h-5 w-5 text-red-500"
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
              {/* Validation messages */}
              {displayName.trim().length > 0 && (
                <>
                  {/* Invalid characters check */}
                  {(() => {
                    const usernameRegex = /^[a-zA-Z0-9_]+$/;
                    const hasInvalidChars = !usernameRegex.test(displayName.trim());
                    
                    if (hasInvalidChars) {
                      return (
                        <p className="text-xs text-red-600">
                          El nombre solo puede contener letras, números y guiones bajos (_)
                        </p>
                      );
                    }
                    
                    // Length check
                    if (displayName.trim().length < 2) {
                      return (
                        <p className="text-xs text-gray-500">
                          El nombre debe tener al menos 2 caracteres
                        </p>
                      );
                    }
                    
                    // Availability check message
                    if (
                      displayName.trim() !== currentProfile.displayName &&
                      displayName.trim().length >= 2 &&
                      usernameCheck.message
                    ) {
                      return (
                        <p
                          className={cn(
                            'text-xs',
                            usernameCheck.available === true
                              ? 'text-green-600'
                              : usernameCheck.available === false
                              ? 'text-red-600'
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

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                disabled={isSaving}
              />
              <p className="text-xs text-gray-500">
                Recibirás un email de confirmación si cambias tu dirección
              </p>
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
                className="flex h-11 w-full rounded-xl border border-neutral/20 bg-white px-4 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                disabled={isSaving}
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
                disabled={isSaving}
              />
            </div>

            {/* Privacy */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  disabled={isSaving}
                />
                <label htmlFor="isPrivate" className="text-sm font-medium text-gray-700">
                  Perfil privado
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Si activas esta opción, solo tus seguidores podrán ver tu perfil y contenido
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-4">
              <Button
                type="submit"
                disabled={
                  isSaving ||
                  (displayName.trim() !== currentProfile.displayName &&
                    (usernameCheck.checking || usernameCheck.available === false))
                }
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </Button>
              <Button
                ref={closeButtonRef}
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
