import { Request, Response, NextFunction } from 'express';
import { createUserClient } from '../lib/supabase/server';

/**
 * Global context middleware. Runs on every request.
 *
 * Android sends the Supabase access_token obtained from Supabase Auth
 * (email/password, Google, etc.) as:
 *
 *   Authorization: Bearer <supabase_access_token>
 *
 * This mirrors exactly what the original Next.js app did via cookies:
 * req.supabase is a client scoped to that user, so RLS policies apply
 * identically to how they did in the PWA.
 *
 * If no token is sent, req.supabase is an anonymous client (used by public
 * endpoints like GET /api/banners) and req.user stays undefined.
 */
export async function supabaseContext(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;

  req.accessToken = token;
  req.supabase = createUserClient(token);

  if (token) {
    try {
      const { data, error } = await req.supabase.auth.getUser(token);
      if (!error && data?.user) {
        req.user = data.user;
      }
    } catch (err) {
      console.error('Error validating access token:', err);
    }
  }

  next();
}

/**
 * Route-level guard. Use on any endpoint that required
 * `supabase.auth.getUser()` + 401 check in the original Next.js route.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}
