'use server';

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { loginSchema, signupSchema, resetPasswordSchema } from '@/lib/validations/auth';

export type AuthActionState = {
  error?: string;
  success?: boolean;
  message?: string;
  userId?: string;
};

/**
 * Sign in with email/username and password
 */
export async function login(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  try {
    // Validate input
    const validatedFields = loginSchema.safeParse({
      emailOrUsername: formData.get('emailOrUsername'),
      password: formData.get('password'),
    });

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.errors[0].message,
        success: false,
      };
    }

    const { emailOrUsername, password } = validatedFields.data;
    const supabase = await createClient();

    // Determine if input is email or username
    const isEmail = emailOrUsername.includes('@');
    let email = emailOrUsername;

    // If it's a username, find the user's email
    if (!isEmail) {
      // Search for user by display_name
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('display_name', emailOrUsername)
        .single();

      if (userError || !userData) {
        return {
          error: 'Credenciales inválidas. Por favor verifica tu nombre de usuario y contraseña.',
          success: false,
        };
      }

      // Get email from auth.users using Admin API
      try {
        const adminClient = createServiceRoleClient();
        const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(userData.id);
        
        if (authError || !authUser?.user?.email) {
          return {
            error: 'Credenciales inválidas. Por favor verifica tu nombre de usuario y contraseña.',
            success: false,
          };
        }

        email = authUser.user.email;
        
        // Check if email is verified before attempting login
        const isEmailVerified = authUser.user.email_confirmed_at !== null && authUser.user.email_confirmed_at !== undefined;
        
        if (!isEmailVerified) {
          // Email not verified, redirect to verification page instead of showing "invalid credentials"
          // Note: redirect() throws a special exception that Next.js uses for navigation
          // We need to let it propagate, not catch it
          revalidatePath('/');
          redirect(`/auth/verify-email${email ? `?email=${encodeURIComponent(email)}` : ''}`);
        }
      } catch (adminError: any) {
        // Check if this is a redirect exception - if so, re-throw it
        if (adminError?.digest?.startsWith('NEXT_REDIRECT') || adminError?.message === 'NEXT_REDIRECT') {
          throw adminError;
        }
        console.error('Error getting user email:', adminError);
        return {
          error: 'Error al obtener la información del usuario. Por favor intenta de nuevo.',
          success: false,
        };
      }
    }

    // Sign in with email
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check if user exists but email is not verified
      // This allows us to redirect to verification page instead of showing "invalid credentials"
      try {
        const adminClient = createServiceRoleClient();
        // Use listUsers with a filter if possible, otherwise search through results
        const { data: authUserData } = await adminClient.auth.admin.listUsers();
        const user = authUserData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        
        if (user) {
          // User exists, check if email is verified
          const isEmailVerified = user.email_confirmed_at !== null && user.email_confirmed_at !== undefined;
          
          if (!isEmailVerified) {
            // Email not verified, redirect to verification page instead of showing "invalid credentials"
            // Note: redirect() throws a special exception that Next.js uses for navigation
            // We need to let it propagate, not catch it
            revalidatePath('/');
            redirect(`/auth/verify-email${email ? `?email=${encodeURIComponent(email)}` : ''}`);
          }
        }
      } catch (checkError: any) {
        // Check if this is a redirect exception - if so, re-throw it
        if (checkError?.digest?.startsWith('NEXT_REDIRECT') || checkError?.message === 'NEXT_REDIRECT') {
          throw checkError;
        }
        // If we can't check verification status, fall through to show invalid credentials error
        console.error('Error checking email verification status:', checkError);
      }
      
      // If user doesn't exist or credentials are wrong, show invalid credentials error
      return {
        error: 'Credenciales inválidas. Por favor verifica tus credenciales.',
        success: false,
      };
    }

    // Check if email is verified after successful login
    const isEmailVerified = signInData.user?.email_confirmed_at !== null && signInData.user?.email_confirmed_at !== undefined;
    
    if (!isEmailVerified) {
      // Redirect to verification page if email not verified
      revalidatePath('/');
      redirect(`/auth/verify-email${email ? `?email=${encodeURIComponent(email)}` : ''}`);
    }

    // Get redirect URL from form data or headers
    const redirectParam = formData.get('redirect') as string | null;
    let redirectTo = '/feed'; // Default to feed page
    
    if (redirectParam) {
      redirectTo = redirectParam;
    } else {
      // Fallback to checking referer header
      try {
        const headersList = await headers();
        const referer = headersList.get('referer') || '';
        if (referer) {
          const refererUrl = new URL(referer);
          const redirectFromUrl = refererUrl.searchParams.get('redirect');
          if (redirectFromUrl) {
            redirectTo = redirectFromUrl;
          }
        }
      } catch {
        // If headers() fails, use default (feed)
      }
    }

    // Revalidate paths to ensure fresh data after login
    revalidatePath('/feed');
    revalidatePath('/profile');
    revalidatePath(redirectTo);

    redirect(redirectTo);
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
    const step = formData.get('step') as string || 'credentials';
    const supabase = await createClient();

    // Step 1: Create account with credentials
    if (step === 'credentials') {
      const validatedFields = signupSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        displayName: formData.get('displayName') || 'Usuario',
        acceptTerms: formData.get('acceptTerms') === 'on',
        gender: formData.get('gender'),
        birthDate: formData.get('birthDate'),
        isPrivate: formData.get('isPrivate') === 'true',
        step: 'credentials',
      });

      if (!validatedFields.success) {
        return {
          error: validatedFields.error.errors[0].message,
          success: false,
        };
      }

      const { email, password, displayName } = validatedFields.data;

      // Sign up (Supabase will handle duplicate email check)
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
        // Handle specific Supabase auth errors for duplicate email
        const errorMessage = error.message?.toLowerCase() || '';
        if (errorMessage.includes('already registered') || 
            errorMessage.includes('already exists') ||
            errorMessage.includes('user already registered') ||
            errorMessage.includes('email address is already registered') ||
            error.code === 'signup_disabled' ||
            error.status === 400) {
          return {
            error: 'Este correo electrónico ya está registrado. Por favor inicia sesión o usa otro email.',
            success: false,
          };
        }
        
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

      // Create user record with temporary display name
      // Use service role client to bypass RLS since the session may not be fully established yet
      // This is safe because we've already verified the user was created in auth.users
      const serviceClient = createServiceRoleClient();
      
      // Check if user already exists in users table
      const { data: existingUser } = await serviceClient
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();

      // Only insert if user doesn't exist
      if (!existingUser) {
        const { error: userError } = await serviceClient
          .from('users')
          .insert({
            id: data.user.id,
            display_name: displayName,
            avatar_energy: 100,
            is_private: false,
            is_premium: false,
            coins: 0,
            streak: 0,
          });

        if (userError) {
          // Handle duplicate key error (shouldn't happen after check, but just in case)
          if (userError.code === '23505' || userError.message?.includes('duplicate key')) {
            // User already exists, continue with flow instead of failing
            console.log('User already exists in users table, continuing with registration flow...');
          } else {
            console.error('Error creating user:', userError);
            return {
              error: 'Error al crear el perfil. Por favor intenta de nuevo.',
              success: false,
            };
          }
        }
      } else {
        // User already exists in users table, continue with flow
        console.log('User already exists in users table, continuing with registration flow...');
      }

      return {
        success: true,
        message: 'Cuenta creada. Completa tu perfil.',
        userId: data.user.id, // Return user ID for step 2
        email: email, // Return email for verification page
        emailConfirmed: data.user.email_confirmed_at !== null,
      };
    }

    // Step 2: Update profile with additional info
    if (step === 'profile') {
      // Get user ID from form data (passed from step 1) or try to get from session
      const userIdFromForm = formData.get('userId') as string | null;
      
      let userId: string | null = userIdFromForm;
      
      // If no userId in form, try to get from session
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      }
      
      // If still no userId, get the most recent user created (fallback)
      if (!userId) {
        const serviceClient = createServiceRoleClient();
        const { data: recentUser } = await serviceClient
          .from('users')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (recentUser) {
          userId = recentUser.id;
        }
      }

      if (!userId) {
        return {
          error: 'No se pudo identificar tu cuenta. Por favor intenta registrarte de nuevo.',
          success: false,
        };
      }

      const displayNameValue = formData.get('displayName') as string;
      const genderValue = formData.get('gender') as string;
      const birthDateValue = formData.get('birthDate') as string;
      const isPrivateValue = formData.get('isPrivate') === 'true';

      // Use simpler validation for profile step
      if (!displayNameValue || displayNameValue.trim().length < 2) {
        return {
          error: 'El nombre de usuario debe tener al menos 2 caracteres',
          success: false,
        };
      }

      if (displayNameValue.length > 50) {
        return {
          error: 'El nombre de usuario no puede tener más de 50 caracteres',
          success: false,
        };
      }

      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(displayNameValue)) {
        return {
          error: 'El nombre solo puede contener letras, números y guiones bajos',
          success: false,
        };
      }

      // Validate birthDate format if provided
      if (birthDateValue && birthDateValue.trim() !== '') {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(birthDateValue)) {
          return {
            error: 'La fecha debe estar en formato YYYY-MM-DD',
            success: false,
          };
        }
      }

      const displayName = displayNameValue.trim();
      const gender = genderValue || null;
      const birthDate = birthDateValue && birthDateValue.trim() !== '' ? birthDateValue : null;
      const isPrivate = isPrivateValue;


      // Use service role client to check and update (bypasses RLS)
      const serviceClient = createServiceRoleClient();
      
      // Check if display name is available (excluding current user)
      const { data: existingUsers } = await serviceClient
        .from('users')
        .select('id')
        .eq('display_name', displayName);

      const isTaken = existingUsers?.some(u => u.id !== userId);

      if (isTaken) {
        return {
          error: 'Este nombre de usuario ya está en uso',
          success: false,
        };
      }

      // Update user profile using service role client
      const updateData: Record<string, any> = {
        display_name: displayName,
        is_private: isPrivate || false,
        updated_at: new Date().toISOString(),
      };

      if (gender && gender !== 'no_responder') {
        updateData.gender = gender;
      } else {
        updateData.gender = null;
      }

      if (birthDate) {
        updateData.birth_date = birthDate;
      } else {
        updateData.birth_date = null;
      }

      const { error: updateError } = await serviceClient
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        return {
          error: `Error al actualizar el perfil: ${updateError.message || 'Error desconocido'}`,
          success: false,
        };
      }

      // Update display_name in auth metadata to keep it in sync
      const { error: authUpdateError } = await serviceClient.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            display_name: displayName,
          },
        }
      );

      if (authUpdateError) {
        console.error('Error updating auth metadata:', authUpdateError);
        // Don't fail the request if auth metadata update fails, but log it
        // The users table update was successful, which is the most important
      }

      return {
        success: true,
        message: 'Perfil actualizado. Añade tu foto de perfil.',
      };
    }

    return {
      success: true,
      message: 'Registro completado.',
    };
  } catch (error) {
    console.error('Error in signup action:', error);
    if (error instanceof z.ZodError) {
      return {
        error: error.errors[0].message,
        success: false,
      };
    }

    return {
      error: error instanceof Error ? error.message : 'Error inesperado. Por favor intenta de nuevo.',
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

