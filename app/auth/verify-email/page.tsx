'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    // Get email from URL params or try to get from session
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
      setIsChecking(true);
      // Check verification status
      const checkStatus = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email_confirmed_at) {
          setIsVerified(true);
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 2000);
        }
        setIsChecking(false);
      };
      checkStatus();
    } else {
      // Try to get email from session
      const checkSession = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setEmail(user.email);
          checkVerificationStatus(user.email);
        } else {
          setIsChecking(false);
        }
      };
      checkSession();
    }

    // Set up polling to check verification status every 5 seconds
    const intervalId = setInterval(async () => {
      if (!isVerified && email) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email_confirmed_at) {
          setIsVerified(true);
          clearInterval(intervalId);
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 2000);
        }
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [searchParams, router, email, isVerified]);

  const checkVerificationStatus = async (userEmail: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user?.email_confirmed_at) {
      setIsVerified(true);
      // Redirect to home after a moment
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2000);
    }
    setIsChecking(false);
  };

  const handleResendEmail = async () => {
    if (!email) return;

    setIsResending(true);
    setResendSuccess(false);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        console.error('Error resending email:', error);
      } else {
        setResendSuccess(true);
      }
    } catch (error) {
      console.error('Error resending email:', error);
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckAgain = async () => {
    if (!email) return;
    setIsChecking(true);
    setIsVerified(false);
    await checkVerificationStatus(email);
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/icons/icon.svg"
              alt="Calixo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <CardTitle className="text-3xl font-bold text-text-dark font-sans uppercase tracking-wide" style={{ fontFamily: 'Questrial, sans-serif' }}>
              CALIXO
            </CardTitle>
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Verifica tu correo electrónico
          </CardTitle>
          <CardDescription className="text-base">
            {isVerified
              ? '¡Email verificado! Redirigiendo...'
              : 'Te hemos enviado un enlace de verificación a tu correo'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isChecking ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Verificando estado...</p>
            </div>
          ) : isVerified ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-complementary-emerald/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-complementary-emerald"
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
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                ¡Email verificado exitosamente!
              </p>
              <p className="text-gray-600">
                Redirigiendo a Calixo...
              </p>
            </div>
          ) : (
            <>
              {email && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-semibold">Correo:</span> {email}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Revisa tu bandeja de entrada
                      </p>
                      <p className="text-sm text-blue-700">
                        Hemos enviado un enlace de verificación a tu correo electrónico. 
                        Haz clic en el enlace para activar tu cuenta.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-900 mb-1">
                        ¿No encuentras el correo?
                      </p>
                      <p className="text-sm text-yellow-700">
                        Revisa tu carpeta de spam o correo no deseado. El correo puede tardar unos minutos en llegar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleCheckAgain}
                  className="w-full h-12 font-semibold"
                >
                  Verificar de nuevo
                </Button>

                <Button
                  onClick={handleResendEmail}
                  disabled={isResending || !email}
                  variant="outline"
                  className="w-full h-12"
                >
                  {isResending ? 'Enviando...' : 'Reenviar correo de verificación'}
                </Button>

                {resendSuccess && (
                  <div className="bg-complementary-emerald/10 border border-complementary-emerald/20 rounded-lg p-3">
                    <p className="text-sm text-complementary-emerald text-center">
                      ✓ Correo de verificación reenviado. Revisa tu bandeja de entrada.
                    </p>
                  </div>
                )}

                <div className="text-center pt-4 border-t border-gray-200">
                  <Link
                    href="/auth/login"
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Volver al inicio de sesión
                  </Link>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
