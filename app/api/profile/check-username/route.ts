import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/profile/check-username?username=xxx
 * Check if a username is available
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    // User is optional - during signup, they might not be fully authenticated yet

    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'El nombre de usuario es requerido' },
        { status: 400 }
      );
    }

    // Validate username format
    if (username.length < 2) {
      return NextResponse.json({
        available: false,
        message: 'El nombre debe tener al menos 2 caracteres',
      });
    }

    if (username.length > 50) {
      return NextResponse.json({
        available: false,
        message: 'El nombre no puede exceder 50 caracteres',
      });
    }

    // Check if username contains only valid characters (letters, numbers, underscores)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({
        available: false,
        message: 'El nombre solo puede contener letras, números y guiones bajos',
      });
    }

    // Use service role client to check username availability
    // This allows checking during signup when user might not be fully authenticated
    const { createServiceRoleClient } = await import('@/lib/supabase/server');
    const serviceClient = createServiceRoleClient();
    
    // Build query - exclude current user if authenticated
    let query = serviceClient
      .from('users')
      .select('id, display_name')
      .eq('display_name', username);

    // If user is authenticated, exclude their own username
    if (user?.id) {
      query = query.neq('id', user.id);
    }

    const { data: existingUser, error: queryError } = await query.single();

    if (queryError && queryError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is what we want
      console.error('Error checking username:', queryError);
      return NextResponse.json(
        { error: 'Error al verificar el nombre de usuario' },
        { status: 500 }
      );
    }

    const isAvailable = !existingUser;

    return NextResponse.json({
      available: isAvailable,
      message: isAvailable 
        ? 'Nombre de usuario disponible' 
        : 'Este nombre de usuario ya está en uso',
    });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      { error: 'Error al verificar el nombre de usuario' },
      { status: 500 }
    );
  }
}
