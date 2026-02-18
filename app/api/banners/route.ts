import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/banners
 * Público: devuelve los banners activos para el feed.
 * El CalixoFeedCard elige uno aleatorio en el cliente.
 */
export async function GET() {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('feed_banners')
      .select('id, phrase, image_url')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching banners:', error);
      return NextResponse.json({ error: 'Error al cargar banners' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Banners API error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
