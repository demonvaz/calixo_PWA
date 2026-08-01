import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { createServiceRoleClient } from '../lib/supabase/server';

// --- Helpers from app/api/banners/route.ts ---
/**
 * GET /api/banners
 * Público: devuelve los banners activos para el feed.
 * El CalixoFeedCard elige uno aleatorio en el cliente.
 */

const router = Router();

// Migrated from app/api/banners/route.ts
router.get('/', async (req: Request, res: Response) => {
  const supabase = req.supabase!;

  try {
    const { data, error } = await supabase
      .from('feed_banners')
      .select('id, phrase, image_url')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching banners:', error);
      return res.status(500).json({ error: 'Error al cargar banners' });
    }

    return res.json(data || []);
  } catch (err) {
    console.error('Banners API error:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

export default router;