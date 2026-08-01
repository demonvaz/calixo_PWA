import { z } from 'zod';

/**
 * Validation schemas for authentication forms
 */

export const loginSchema = z.object({
  emailOrUsername: z
    .string()
    .min(1, 'El correo electrónico o nombre de usuario es requerido')
    .min(3, 'Debe tener al menos 3 caracteres'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

// Schema for step 1 (credentials)
export const signupCredentialsSchema = z
  .object({
    email: z
      .string()
      .min(1, 'El correo electrónico es requerido')
      .email('Correo electrónico inválido'),
    password: z
      .string()
      .min(1, 'La contraseña es requerida')
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
      ),
    confirmPassword: z
      .string()
      .min(1, 'Por favor confirma tu contraseña'),
    displayName: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede tener más de 50 caracteres')
      .regex(/^[a-zA-Z0-9_]+$/, 'El nombre solo puede contener letras, números y guiones bajos'),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: 'Debes aceptar los términos y condiciones',
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

// Schema for step 2 (profile)
export const signupProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El nombre solo puede contener letras, números y guiones bajos'),
  gender: z.enum(['femenino', 'masculino', 'no_responder']).optional().nullable(),
  birthDate: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || val === '' || /^\d{4}-\d{2}-\d{2}$/.test(val),
      'La fecha debe estar en formato YYYY-MM-DD'
    ),
  isPrivate: z.boolean().optional(),
});

// Combined schema for backward compatibility
export const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, 'El correo electrónico es requerido')
      .email('Correo electrónico inválido')
      .optional(),
    password: z
      .string()
      .optional(),
    confirmPassword: z
      .string()
      .optional(),
    displayName: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede tener más de 50 caracteres')
      .regex(/^[a-zA-Z0-9_]+$/, 'El nombre solo puede contener letras, números y guiones bajos'),
    acceptTerms: z
      .boolean()
      .optional(),
    gender: z.enum(['femenino', 'masculino', 'no_responder']).optional().nullable(),
    birthDate: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => !val || val === '' || /^\d{4}-\d{2}-\d{2}$/.test(val),
        'La fecha debe estar en formato YYYY-MM-DD'
      ),
    isPrivate: z.boolean().optional(),
    step: z.enum(['credentials', 'profile', 'photo']).optional(),
  })
  .refine((data) => {
    // Only validate password match if passwords are provided
    if (data.password && data.confirmPassword) {
      return data.password === data.confirmPassword;
    }
    return true;
  }, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Correo electrónico inválido'),
});

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

