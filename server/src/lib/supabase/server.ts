import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Backend (Express) equivalents of the original Next.js Supabase helpers.
 * Instead of reading cookies, auth is done via a Bearer JWT (Supabase access_token)
 * sent by the Android app. See middleware/auth.ts.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Create a Supabase client scoped to a specific user's access token.
 * Postgres RLS policies apply exactly as they would for that user in the app.
 * If no token is provided, behaves like an anonymous (public) client.
 */
export function createUserClient(accessToken?: string): SupabaseClient {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}

/**
 * Create a Supabase client with the service role key for admin operations.
 * Bypasses RLS policies - use with caution! Mirrors the original Next.js helper.
 */
export function createServiceRoleClient(): SupabaseClient {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createSupabaseClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
