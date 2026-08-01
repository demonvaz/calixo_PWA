import { Request, Response, NextFunction } from 'express';
import { checkAdminPermissions } from '../lib/permissions';

/**
 * Route-level guard for /api/admin/* endpoints.
 * Must run after requireAuth (needs req.user + req.supabase already set).
 * Mirrors the original `requireAdmin()` checks done in each Next.js admin route.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.supabase) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const permissions = await checkAdminPermissions(req.supabase, req.user.id);
  if (!permissions.isAdmin) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  req.isAdmin = true;
  next();
}
