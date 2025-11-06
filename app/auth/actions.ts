'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { loginSchema, signupSchema, resetPasswordSchema } from '@/lib/validations/auth';

export type AuthActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

/**
 * Sign in with email and password
 */
export async function login(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  try {
    // Validate input
    const validatedFields = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.errors[0].message,
        success: false,
      };
    }

    const { email, password } = validatedFields.data;
    const supabase = await createClient();

    // Sign in
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        error: 'Credenciales inválidas. Por favor verifica tu correo y contraseña.',
        success: false,
      };
    }

    redirect('/dashboard');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.errors[0].message,
        success: false,
      };
    }

    // Don't catch redirect errors
    throw error;
  }
}

/**
 * Sign up with email and password
 */
export async function signup(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  try {
    // Validate input
    const validatedFields = signupSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      displayName: formData.get('displayName'),
      acceptTerms: formData.get('acceptTerms') === 'on',
    });

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.errors[0].message,
        success: false,
      };
    }

    const { email, password, displayName } = validatedFields.data;
    const supabase = await createClient();

    // Sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      return {
        error: error.message || 'Error al crear la cuenta. Por favor intenta de nuevo.',
        success: false,
      };
    }

    if (!data.user) {
      return {
        error: 'Error al crear la cuenta. Por favor intenta de nuevo.',
        success: false,
      };
    }

    return {
      success: true,
      message: 'Cuenta creada exitosamente. Por favor verifica tu correo electrónico.',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.errors[0].message,
        success: false,
      };
    }

    return {
      error: 'Error inesperado. Por favor intenta de nuevo.',
      success: false,
    };
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    redirect('/auth/login?error=oauth_failed');
  }

  if (data.url) {
    redirect(data.url);
  }
}

/**
 * Sign out
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}

/**
 * Request password reset
 */
export async function resetPassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  try {
    // Validate input
    const validatedFields = resetPasswordSchema.safeParse({
      email: formData.get('email'),
    });

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.errors[0].message,
        success: false,
      };
    }

    const { email } = validatedFields.data;
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/confirm`,
    });

    if (error) {
      return {
        error: 'Error al enviar el correo de recuperación. Por favor intenta de nuevo.',
        success: false,
      };
    }

    return {
      success: true,
      message: 'Correo de recuperación enviado. Por favor revisa tu bandeja de entrada.',
    };
  } catch (error) {
    return {
      error: 'Error inesperado. Por favor intenta de nuevo.',
      success: false,
    };
  }
}

