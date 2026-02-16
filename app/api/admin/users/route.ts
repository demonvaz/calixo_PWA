import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/users
 * Lista todos los usuarios con filtros (solo is_admin)
 */
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.trim();
    const isPremium = searchParams.get('isPremium');

    let query = supabase
      .from('users')
      .select('id, display_name, is_premium, coins, streak, created_at, is_admin')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('display_name', `%${search}%`);
    }

    if (isPremium === 'true') {
      query = query.eq('is_premium', true);
    } else if (isPremium === 'false') {
      query = query.eq('is_premium', false);
    }

    const { data: usersData, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Error al obtener usuarios' },
        { status: 500 }
      );
    }

    // Obtener emails de auth.users (solo si hay API para ello - Supabase no expone email directamente en users)
    // La tabla users de Supabase puede no tener email - se obtiene de auth
    const users = (usersData || []).map((u) => ({
      id: u.id,
      email: null as string | null, // Email viene de auth.users
      displayName: u.display_name || null,
      isPremium: u.is_premium ?? false,
      coins: u.coins ?? 0,
      streak: u.streak ?? 0,
      createdAt: u.created_at,
      isAdmin: u.is_admin ?? false,
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}
