import { SupabaseClient, User } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      /**
       * Supabase client scoped to the requester.
       * - If a valid Bearer token was sent, RLS applies as that user.
       * - If no token was sent, this is an anonymous (public) client.
       */
      supabase?: SupabaseClient;
      /** The authenticated Supabase user, if a valid Bearer token was provided. */
      user?: User;
      /** Raw access token extracted from the Authorization header, if present. */
      accessToken?: string;
      /** Set to true by the requireAdmin middleware once verified. */
      isAdmin?: boolean;
    }
  }
}

export {};
