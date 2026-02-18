import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/permissions';

/**
 * GET /api/admin/banners - Listar todos los banners
 * POST /api/admin/banners - Crear banner
 */
export async function GET() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('feed_banners')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching banners:', error);
      return NextResponse.json({ error: 'Error al cargar banners' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Admin banners GET error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { phrase, image_url, sort_order, is_active } = body;

    if (!phrase || typeof phrase !== 'string' || !phrase.trim()) {
      return NextResponse.json({ error: 'La frase es obligatoria' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('feed_banners')
      .insert({
        phrase: phrase.trim(),
        image_url: image_url?.trim() || null,
        sort_order: typeof sort_order === 'number' ? sort_order : 0,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating banner:', error);
      return NextResponse.json({ error: 'Error al crear banner' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Admin banners POST error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
