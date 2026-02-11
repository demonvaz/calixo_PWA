import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/challenges/start
 * Start a new challenge for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Cuerpo de la solicitud inválido' },
        { status: 400 }
      );
    }

    const { challengeId, customDuration } = body;
    console.log('Request body:', { challengeId, customDuration, body });

    if (!challengeId) {
      console.error('Missing challengeId in request');
      return NextResponse.json(
        { error: 'Challenge ID es requerido' },
        { status: 400 }
      );
    }

    if (typeof challengeId !== 'number' && typeof challengeId !== 'string') {
      console.error('Invalid challengeId type:', typeof challengeId);
      return NextResponse.json(
        { error: 'Challenge ID debe ser un número' },
        { status: 400 }
      );
    }

    // Verify challenge exists and is active
    const challengeIdNum = typeof challengeId === 'string' ? parseInt(challengeId, 10) : challengeId;
    if (isNaN(challengeIdNum)) {
      console.error('Invalid challengeId conversion:', challengeId);
      return NextResponse.json(
        { error: 'Challenge ID inválido' },
        { status: 400 }
      );
    }

    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeIdNum)
      .eq('is_active', true)
      .single();

    if (challengeError) {
      console.error('Error fetching challenge:', challengeError);
      return NextResponse.json(
        { error: `Error al buscar el reto: ${challengeError.message}` },
        { status: 404 }
      );
    }

    if (!challenge) {
      console.error('Challenge not found or inactive:', challengeIdNum);
      return NextResponse.json(
        { error: 'Reto no encontrado o inactivo' },
        { status: 404 }
      );
    }

    // Check if user already has an active challenge of this type
    const { data: existingChallenge, error: existingError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'in_progress');

    if (existingError) {
      console.error('Error checking existing challenges:', existingError);
    }

    if (existingChallenge && existingChallenge.length > 0) {
      console.log('User already has active challenges:', existingChallenge);
      return NextResponse.json(
        { 
          error: 'Ya tienes un reto en progreso. Complétalo primero.',
          existingChallenges: existingChallenge.map(c => ({ id: c.id, challengeId: c.challenge_id, status: c.status }))
        },
        { status: 400 }
      );
    }

    // For focus challenges: solo premium, validar duración (max 5 horas)
    let duration = challenge.duration_minutes;
    if (challenge.type === 'focus') {
      // Verificar que el usuario sea premium
      const { data: userData } = await supabase
        .from('users')
        .select('is_premium')
        .eq('id', user.id)
        .single();

      if (!userData?.is_premium) {
        return NextResponse.json(
          { error: 'El Modo Focus es exclusivo para usuarios Premium. Actualiza tu suscripción para acceder.' },
          { status: 403 }
        );
      }

      if (customDuration === undefined || customDuration === null) {
        return NextResponse.json(
          { error: 'Debes especificar la duración para el Modo Focus' },
          { status: 400 }
        );
      }
      if (typeof customDuration !== 'number' || isNaN(customDuration)) {
        return NextResponse.json(
          { error: 'La duración personalizada debe ser un número válido' },
          { status: 400 }
        );
      }
      if (customDuration < 15) {
        return NextResponse.json(
          { error: 'La duración mínima es de 15 minutos' },
          { status: 400 }
        );
      }
      if (customDuration > 5 * 60) {
        return NextResponse.json(
          { error: 'La duración máxima es de 5 horas' },
          { status: 400 }
        );
      }
      duration = customDuration;
    }

    // Create new user challenge
    const insertData = {
      user_id: user.id,
      challenge_id: challenge.id,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      session_data: {
        durationMinutes: duration,
        startTime: new Date().toISOString(),
        interruptions: 0,
      },
    };
    console.log('Inserting user challenge:', insertData);

    const { data: newUserChallenge, error: insertError } = await supabase
      .from('user_challenges')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting user challenge:', insertError);
      return NextResponse.json(
        { error: `Error al crear el reto: ${insertError.message}` },
        { status: 500 }
      );
    }

    if (!newUserChallenge) {
      console.error('No user challenge returned after insert');
      return NextResponse.json(
        { error: 'Error al crear el reto: no se recibió respuesta' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userChallenge: {
        id: newUserChallenge.id,
        userId: newUserChallenge.user_id,
        challengeId: newUserChallenge.challenge_id,
        status: newUserChallenge.status,
        startedAt: newUserChallenge.started_at,
        sessionData: newUserChallenge.session_data,
        createdAt: newUserChallenge.created_at,
      },
      challenge: {
        id: challenge.id,
        type: challenge.type,
        title: challenge.title,
        description: challenge.description,
        reward: challenge.reward,
        durationMinutes: challenge.duration_minutes,
        isActive: challenge.is_active,
        createdAt: challenge.created_at,
      },
    });
  } catch (error) {
    console.error('Error starting challenge:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: `Error al iniciar el reto: ${errorMessage}` },
      { status: 500 }
    );
  }
}






