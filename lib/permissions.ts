import { createClient } from '@/lib/supabase/server';

export type AdminRole = 'admin' | 'moderator';

export interface AdminPermission {
  isAdmin: boolean;
  isModerator: boolean;
  role: AdminRole | null;
}

/**
 * Check if the current user has admin permissions
 * Solo accesible a usuarios con is_admin = true en la tabla users
 */
export async function checkAdminPermissions(): Promise<AdminPermission> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { isAdmin: false, isModerator: false, role: null };
    }

    // Verificar is_admin en la tabla users (único criterio de acceso al admin)
    // Requiere que la columna is_admin exista - ejecutar migración en supabase/migrations
    const { data: userData, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (error) {
      console.warn('Error checking is_admin (¿columna existe?):', error.message);
      return { isAdmin: false, isModerator: false, role: null };
    }

    const isAdmin = userData?.is_admin === true;
    return {
      isAdmin,
      isModerator: isAdmin, // Solo admins tienen acceso
      role: isAdmin ? 'admin' : null,
    };
  } catch (error) {
    console.error('Error checking admin permissions:', error);
    return { isAdmin: false, isModerator: false, role: null };
  }
}

/**
 * Check if user has admin role (not just moderator)
 */
export async function requireAdmin(): Promise<boolean> {
  const permissions = await checkAdminPermissions();
  return permissions.isAdmin;
}

/**
 * Check if user has moderator or admin role
 */
export async function requireModerator(): Promise<boolean> {
  const permissions = await checkAdminPermissions();
  return permissions.isModerator;
}

/**
 * Export AdminRole type for use in components
 */
export type { AdminRole };

