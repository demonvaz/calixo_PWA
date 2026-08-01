import { SupabaseClient } from '@supabase/supabase-js';

export type AdminRole = 'admin' | 'moderator';

export interface AdminPermission {
  isAdmin: boolean;
  isModerator: boolean;
  role: AdminRole | null;
}

/**
 * Check if a given (already authenticated) user has admin permissions.
 * Express equivalent of the original cookie-based checkAdminPermissions().
 */
export async function checkAdminPermissions(
  supabase: SupabaseClient,
  userId: string | undefined
): Promise<AdminPermission> {
  try {
    if (!userId) {
      return { isAdmin: false, isModerator: false, role: null };
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Error checking is_admin (¿columna existe?):', error.message);
      return { isAdmin: false, isModerator: false, role: null };
    }

    const isAdmin = userData?.is_admin === true;
    return {
      isAdmin,
      isModerator: isAdmin,
      role: isAdmin ? 'admin' : null,
    };
  } catch (error) {
    console.error('Error checking admin permissions:', error);
    return { isAdmin: false, isModerator: false, role: null };
  }
}
