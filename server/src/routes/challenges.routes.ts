import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { updateEnergyOnChallengeComplete } from '../lib/avatar-energy';
import { getDateKey, getDateKeyForTimestamp } from '../lib/challenge-date';
import { createServiceRoleClient } from '../lib/supabase/server';

// --- Helpers from app/api/challenges/route.ts ---
/** PRNG determinístico con semilla (mismo seed = misma secuencia) */
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash;
  }
  return function () {
    hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
    hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
    return ((hash ^ (hash >>> 16)) >>> 0) / 0xffffffff;
  };
}

/** Selecciona 3 retos diarios: 1 corto (≤30min), 1 medio (31-60min), 1 largo (>60min) */
function selectDailyChallenges<T extends { id: number; duration_minutes?: number | null }>(
  challenges: T[],
  seed: string
): T[] {
  const rand = seededRandom(seed);

  const short = challenges.filter((c) => (c.duration_minutes ?? 30) <= 30);
  const medium = challenges.filter((c) => {
    const m = c.duration_minutes ?? 45;
    return m > 30 && m <= 60;
  });
  const long = challenges.filter((c) => (c.duration_minutes ?? 90) > 60);

  const pickOne = (arr: T[]): T | null => {
    if (arr.length === 0) return null;
    return arr[Math.floor(rand() * arr.length)];
  };

  const selected: T[] = [];
  const pickedShort = pickOne(short);
  const pickedMedium = pickOne(medium);
  const pickedLong = pickOne(long);

  if (pickedShort) selected.push(pickedShort);
  if (pickedMedium) selected.push(pickedMedium);
  if (pickedLong) selected.push(pickedLong);

  const remaining = challenges.filter((c) => !selected.includes(c));
  while (selected.length < 3 && remaining.length > 0) {
    const idx = Math.floor(rand() * remaining.length);
    selected.push(remaining.splice(idx, 1)[0]);
  }

  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected;
}

// --- Helpers from app/api/challenges/fail/route.ts ---
/**
 * POST /api/challenges/fail
 * Mark a challenge as failed (e.g., due to interruption)
 */

// --- Helpers from app/api/challenges/social/route.ts ---
/**
 * GET /api/challenges/social
 * Get social challenges for the authenticated user
 */


/**
 * POST /api/challenges/social
 * Create a new social challenge invitation
 */

// --- Helpers from app/api/challenges/social/[sessionId]/accept/route.ts ---
/**
 * POST /api/challenges/social/[sessionId]/accept
 * Accept a social challenge invitation
 */

// --- Helpers from app/api/challenges/finish/route.ts ---
/**
 * POST /api/challenges/finish
 * Marca un reto como finalizado cuando el timer termina (sistema de confianza)
 * Crea una notificación para que el usuario pueda reclamarlo
 */

// --- Helpers from app/api/challenges/active/route.ts ---
/**
 * GET /api/challenges/active
 * Get the currently active challenge for the authenticated user
 * Retos 'finished' no reclamados expiran a las 2:00 AM (Madrid) y pasan a 'not_claimed'
 */

// --- Helpers from app/api/challenges/cancel/route.ts ---
/**
 * POST /api/challenges/cancel
 * Cancel a challenge that is in progress
 */

// --- Helpers from app/api/challenges/start/route.ts ---
/**
 * POST /api/challenges/start
 * Start a new challenge for the authenticated user
 */

// --- Helpers from app/api/challenges/claim/route.ts ---
/**
 * POST /api/challenges/claim
 * Reclama un reto finalizado y lo completa automáticamente otorgando las monedas base
 * El reto se marca como 'completed' y se otorgan las monedas base inmediatamente
 * Si el usuario comparte después, puede obtener 2 monedas extra mediante /api/challenges/complete
 */

// --- Helpers from app/api/challenges/complete/route.ts ---
/**
 * POST /api/challenges/complete
 * Compartir un reto ya completado y obtener bonus de 2 monedas extra
 * El reto debe estar en status 'completed' (ya fue reclamado y completado)
 * Si se comparte (note o imageUrl), se otorgan 2 puntos extra además de las monedas base ya otorgadas
 */

const router = Router();

// Migrated from app/api/challenges/route.ts
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    // Get query parameters
    const searchParams = new URLSearchParams(req.query as any);
    const type = searchParams.get('type') as 'daily' | 'focus' | 'social' | null;

    // Build query for challenges
    let query = supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true);

    if (type) {
      query = query.eq('type', type);
    }

    const { data: availableChallenges, error: challengesError } = await query;

    if (challengesError) {
      console.error('Error fetching challenges from database:', challengesError);
      throw challengesError;
    }

    console.log('Available challenges from DB:', availableChallenges);
    console.log('Type filter:', type);
    console.log('Number of challenges found:', availableChallenges?.length || 0);

    // Try to get user profile (optional for MVP)
    let userProfile = null;
    let maxDailyChallenges = 1;
    let todaysChallengesCount = 0;
    let activeChallengeIds: number[] = [];

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userData) {
        userProfile = userData;
        maxDailyChallenges = userData.is_premium ? 3 : 1;

        // Get today's challenges count (excluding canceled challenges)
        // Usa la misma definición de "día" que getDateKey: 2:00 AM Madrid
        const dateKey = getDateKey();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const { data: recentChallenges } = await supabase
          .from('user_challenges')
          .select('created_at')
          .eq('user_id', user.id)
          .not('status', 'in', '("canceled","not_claimed")')
          .gte('created_at', threeDaysAgo.toISOString());

        todaysChallengesCount =
          recentChallenges?.filter((uc) => getDateKeyForTimestamp(uc.created_at) === dateKey).length ?? 0;

        // Get active challenge IDs to exclude from the list
        const { data: activeChallenges } = await supabase
          .from('user_challenges')
          .select('challenge_id')
          .eq('user_id', user.id)
          .eq('status', 'in_progress');

        if (activeChallenges && activeChallenges.length > 0) {
          activeChallengeIds = activeChallenges.map(ac => ac.challenge_id);
        }
      }
    } catch (profileError) {
      // Profile table might not exist yet, use defaults
      console.log('Profile table not available, using defaults');
    }

    // Ensure we have an array
    let challenges = Array.isArray(availableChallenges) ? availableChallenges : [];
    
    // Filter out challenges that are currently active (solo para el tipo solicitado)
    if (type === 'daily' && activeChallengeIds.length > 0) {
      challenges = challenges.filter(challenge => !activeChallengeIds.includes(challenge.id));
      console.log(`Filtered out ${activeChallengeIds.length} active challenge(s) from list`);
    } else if (type !== 'daily' && activeChallengeIds.length > 0) {
      challenges = challenges.filter(challenge => !activeChallengeIds.includes(challenge.id));
    }
    
    console.log('Processing challenges:', challenges.length);

    // Para type=daily: seleccionar 3 retos (1 corto, 1 medio, 1 largo) por usuario y día
    if (type === 'daily' && challenges.length > 0) {
      const dateKey = getDateKey();
      const seed = `${dateKey}-${user.id}`;
      challenges = selectDailyChallenges(challenges, seed);
      console.log('Selected', challenges.length, 'daily challenges for', dateKey);
    }

    // Para type=daily, obtener también el primer reto focus (para el banner Modo Focus)
    let focusChallenge = null;
    if (type === 'daily') {
      const { data: focusChallenges } = await supabase
        .from('challenges')
        .select('id, title, description, type')
        .eq('type', 'focus')
        .eq('is_active', true)
        .limit(1);
      focusChallenge = focusChallenges?.[0] || null;
    }

    // Add metadata to challenges
    const challengesWithMetadata = challenges.map((challenge) => {
      let canStart = true;
      let reason = '';

      if (challenge.type === 'daily' && userProfile) {
        const dailyChallengesCount = todaysChallengesCount;
        if (dailyChallengesCount >= maxDailyChallenges) {
          canStart = false;
          reason = userProfile.is_premium
            ? 'Has alcanzado el límite de retos diarios (3)'
            : 'Has alcanzado el límite de retos diarios gratuitos (1). Actualiza a Premium para más retos.';
        }
      }

      return {
        id: challenge.id,
        type: challenge.type,
        title: challenge.title,
        description: challenge.description,
        reward: challenge.reward,
        durationMinutes: challenge.duration_minutes,
        isActive: challenge.is_active,
        createdAt: challenge.created_at,
        canStart,
        reason,
      };
    });

    const response = {
      challenges: challengesWithMetadata,
      userProfile: {
        isPremium: userProfile?.is_premium || false,
        maxDailyChallenges,
        todaysChallengesCount,
      },
      focusChallenge: type === 'daily' ? focusChallenge : undefined,
    };

    console.log('Sending response with', challengesWithMetadata.length, 'challenges');
    
    return res.json(response);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return res.status(500).json({ error: 'Error al obtener los retos' });
  }
});

// Migrated from app/api/challenges/fail/route.ts
router.post('/fail', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const { userChallengeId, reason, sessionData } = body;

    if (!userChallengeId) {
      return res.status(400).json({ error: 'User Challenge ID es requerido' });
    }

    // Get the user challenge
    const { data: userChallenge, error: challengeError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('id', userChallengeId)
      .eq('user_id', user.id)
      .single();

    if (challengeError || !userChallenge) {
      return res.status(404).json({ error: 'Reto no encontrado' });
    }

    if (userChallenge.status !== 'in_progress') {
      return res.status(400).json({ error: 'Este reto ya no está en progreso' });
    }

    // Update user challenge to failed
    const updatedSessionData = {
      ...(userChallenge.session_data || {}),
      ...sessionData,
      failureReason: reason,
    };

    const { error: updateError } = await supabase
      .from('user_challenges')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        session_data: updatedSessionData,
      })
      .eq('id', userChallengeId);

    if (updateError) {
      throw updateError;
    }

    // Create focus session record if it's a focus challenge
    if (sessionData) {
      await supabase.from('focus_sessions').insert({
        user_challenge_id: userChallenge.id,
        duration_seconds: sessionData.durationSeconds || 0,
        interruptions: sessionData.interruptions || 0,
        completed_successfully: false,
      });
    }

    return res.json({
      success: true,
      message: 'Reto marcado como fallido',
    });
  } catch (error) {
    console.error('Error failing challenge:', error);
    return res.status(500).json({ error: 'Error al marcar el reto como fallido' });
  }
});

// Migrated from app/api/challenges/social/route.ts
router.get('/social', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const adminSupabase = createServiceRoleClient();
    const { data: sessions, error } = await adminSupabase
      .from('social_sessions')
      .select('*')
      .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`);

    if (error) {
      throw error;
    }

    return res.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('Error fetching social challenges:', error);
    return res.status(500).json({ error: 'Error al obtener retos sociales' });
  }
});

// Migrated from app/api/challenges/social/route.ts
router.post('/social', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const { inviteeId, challengeId } = body;

    if (!inviteeId || !challengeId) {
      return res.status(400).json({ error: 'inviteeId y challengeId son requeridos' });
    }

    const adminSupabase = createServiceRoleClient();

    // Check if invitee exists in users table
    const { data: invitee, error: inviteeError } = await adminSupabase
      .from('users')
      .select('id')
      .eq('id', inviteeId)
      .single();

    if (inviteeError || !invitee) {
      return res.status(404).json({ error: 'Usuario invitado no encontrado' });
    }

    const { data: session, error } = await adminSupabase
      .from('social_sessions')
      .insert({
        inviter_id: user.id,
        invitee_id: inviteeId,
        challenge_id: challengeId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create notification for invitee
    await adminSupabase.from('notifications').insert({
      user_id: inviteeId,
      type: 'social',
      title: 'Invitación a reto social',
      message: 'Te han invitado a un reto social',
      payload: {
        type: 'social_challenge_invite',
        inviterId: user.id,
        challengeId,
        sessionId: session.id,
      },
      seen: false,
    });

    return res.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error creating social challenge:', error);
    return res.status(500).json({ error: 'Error al crear reto social' });
  }
});

// Migrated from app/api/challenges/social/[sessionId]/accept/route.ts
router.post('/social/:sessionId/accept', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const { sessionId: sessionIdParam } = req.params;
    const sessionId = parseInt(sessionIdParam);

    const adminSupabase = createServiceRoleClient();
    const { data: session, error: fetchError } = await adminSupabase
      .from('social_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('invitee_id', user.id)
      .single();

    if (fetchError || !session) {
      return res.status(404).json({ error: 'Invitación no encontrada' });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({ error: 'Esta invitación ya fue respondida' });
    }

    await adminSupabase
      .from('social_sessions')
      .update({
        status: 'in_progress',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    // Notify the inviter
    await adminSupabase.from('notifications').insert({
      user_id: session.inviter_id,
      type: 'social',
      title: 'Reto aceptado',
      message: 'Tu invitación a reto social fue aceptada',
      payload: {
        type: 'social_challenge_accepted',
        inviteeId: user.id,
        sessionId: session.id,
      },
      seen: false,
    });

    return res.json({
      success: true,
      message: 'Invitación aceptada',
    });
  } catch (error) {
    console.error('Error accepting social challenge:', error);
    return res.status(500).json({ error: 'Error al aceptar la invitación' });
  }
});

// Migrated from app/api/challenges/finish/route.ts
router.post('/finish', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const { userChallengeId, sessionData } = body;

    if (!userChallengeId) {
      return res.status(400).json({ error: 'User Challenge ID es requerido' });
    }

    // Get the user challenge
    const { data: userChallenge, error: challengeError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('id', userChallengeId)
      .eq('user_id', user.id)
      .single();

    if (challengeError || !userChallenge) {
      return res.status(404).json({ error: 'Reto no encontrado' });
    }

    if (userChallenge.status !== 'in_progress') {
      return res.status(400).json({ error: 'Este reto no está en progreso' });
    }

    // Get challenge details
    const { data: challenge, error: challengeDetailsError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', userChallenge.challenge_id)
      .single();

    if (challengeDetailsError || !challenge) {
      return res.status(404).json({ error: 'Reto no encontrado' });
    }

    // Update user challenge to finished
    const finishedAt = new Date().toISOString();
    const { error: updateChallengeError } = await supabase
      .from('user_challenges')
      .update({
        status: 'finished',
        finished_at: finishedAt,
        session_data: sessionData || userChallenge.session_data,
      })
      .eq('id', userChallengeId);

    if (updateChallengeError) {
      throw updateChallengeError;
    }

    // Ya no creamos notificaciones de retos completados
    // El usuario verá el badge en Retos y el banner cuando vaya a esa página

    return res.json({
      success: true,
      userChallenge: {
        id: userChallenge.id,
        userId: userChallenge.user_id,
        challengeId: userChallenge.challenge_id,
        status: 'finished',
        startedAt: userChallenge.started_at,
        finishedAt,
        sessionData: sessionData || userChallenge.session_data,
      },
      challenge: {
        id: challenge.id,
        type: challenge.type,
        title: challenge.title,
        description: challenge.description,
        reward: challenge.reward,
        durationMinutes: challenge.duration_minutes,
      },
    });
  } catch (error) {
    console.error('Error finishing challenge:', error);
    return res.status(500).json({ error: 'Error al finalizar el reto' });
  }
});

// Migrated from app/api/challenges/active/route.ts
router.get('/active', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    // Get active challenge (in_progress) or finished challenge
    const { data: activeChallenge, error: challengeError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['in_progress', 'finished'])
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (challengeError) {
      // No active or finished challenge found
      if (challengeError.code === 'PGRST116') {
        return res.json({
          activeChallenge: null,
        });
      }
      throw challengeError;
    }

    if (!activeChallenge) {
      return res.json({
        activeChallenge: null,
      });
    }

    // Si está 'finished' y es de un día anterior (pasó el cambio de retos a las 2 AM), expirar
    if (activeChallenge.status === 'finished' && activeChallenge.finished_at) {
      const challengeDateKey = getDateKeyForTimestamp(activeChallenge.finished_at);
      const todayDateKey = getDateKey();
      if (challengeDateKey < todayDateKey) {
        await supabase
          .from('user_challenges')
          .update({ status: 'not_claimed' })
          .eq('id', activeChallenge.id)
          .eq('user_id', user.id);
        return res.json({
          activeChallenge: null,
        });
      }
    }

    // Get challenge details
    const { data: challenge, error: challengeDetailsError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', activeChallenge.challenge_id)
      .single();

    if (challengeDetailsError || !challenge) {
      return res.json({
        activeChallenge: null,
      });
    }

    // Get duration from session_data if available (for custom focus challenges)
    let durationMinutes = challenge.duration_minutes || 60;
    let reward = challenge.reward;
    if (activeChallenge.session_data && typeof activeChallenge.session_data === 'object') {
      const sessionData = activeChallenge.session_data as { durationMinutes?: number };
      if (sessionData.durationMinutes) {
        durationMinutes = sessionData.durationMinutes;
        // Para focus: 1 moneda por hora
        if (challenge.type === 'focus') {
          reward = Math.floor(durationMinutes / 60);
        }
      }
    }

    return res.json({
      activeChallenge: {
        id: activeChallenge.id,
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        challengeType: challenge.type,
        status: activeChallenge.status,
        startedAt: activeChallenge.started_at,
        finishedAt: activeChallenge.finished_at,
        durationMinutes,
        reward,
      },
    });
  } catch (error) {
    console.error('Error fetching active challenge:', error);
    return res.status(500).json({ error: 'Error al obtener el reto activo' });
  }
});

// Migrated from app/api/challenges/cancel/route.ts
router.post('/cancel', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const { userChallengeId } = body;

    if (!userChallengeId) {
      return res.status(400).json({ error: 'User Challenge ID es requerido' });
    }

    // Get the user challenge
    const { data: userChallenge, error: challengeError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('id', userChallengeId)
      .eq('user_id', user.id)
      .single();

    if (challengeError || !userChallenge) {
      return res.status(404).json({ error: 'Reto no encontrado' });
    }

    if (userChallenge.status !== 'in_progress') {
      return res.status(400).json({ error: 'Este reto ya no está en progreso' });
    }

    // Prepare update data - use 'failed' status since 'canceled' is not in the enum
    // We'll mark it as failed but add cancellation info in session_data
    const updateData: any = {
      status: 'failed', // Using 'failed' since 'canceled' is not in the enum
      failed_at: new Date().toISOString(),
    };

    // Update session_data to indicate it was canceled by user
    if (userChallenge.session_data) {
      updateData.session_data = {
        ...userChallenge.session_data,
        cancellationReason: 'Cancelado por el usuario',
        cancelledAt: new Date().toISOString(),
        wasCanceled: true,
      };
    } else {
      updateData.session_data = {
        cancellationReason: 'Cancelado por el usuario',
        cancelledAt: new Date().toISOString(),
        wasCanceled: true,
      };
    }

    console.log('Updating challenge with data:', updateData);

    const { data: updatedChallenge, error: updateError } = await supabase
      .from('user_challenges')
      .update(updateData)
      .eq('id', userChallengeId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating challenge status:', updateError);
      console.error('Update error details:', JSON.stringify(updateError, null, 2));
      return res.status(500).json({ 
          error: 'Error al cancelar el reto',
          details: updateError.message || 'Error desconocido'
        });
    }

    if (!updatedChallenge) {
      console.error('Challenge was not updated - no data returned');
      return res.status(500).json({ error: 'No se pudo actualizar el reto' });
    }

    // Verify the status was actually updated to 'failed'
    if (updatedChallenge.status !== 'failed') {
      console.error('Challenge status was not updated to failed. Current status:', updatedChallenge.status);
      return res.status(500).json({ error: 'El estado del reto no se actualizó correctamente' });
    }

    console.log('Challenge canceled successfully (marked as failed):', updatedChallenge);

    return res.json({
      success: true,
      message: 'Reto cancelado exitosamente',
      challenge: updatedChallenge,
    });
  } catch (error: any) {
    console.error('Error canceling challenge:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
        error: 'Error al cancelar el reto',
        details: error.message || 'Error desconocido'
      });
  }
});

// Migrated from app/api/challenges/start/route.ts
router.post('/start', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    let body;
    try {
      body = req.body;
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return res.status(400).json({ error: 'Cuerpo de la solicitud inválido' });
    }

    const { challengeId, customDuration } = body;
    console.log('Request body:', { challengeId, customDuration, body });

    if (!challengeId) {
      console.error('Missing challengeId in request');
      return res.status(400).json({ error: 'Challenge ID es requerido' });
    }

    if (typeof challengeId !== 'number' && typeof challengeId !== 'string') {
      console.error('Invalid challengeId type:', typeof challengeId);
      return res.status(400).json({ error: 'Challenge ID debe ser un número' });
    }

    // Verify challenge exists and is active
    const challengeIdNum = typeof challengeId === 'string' ? parseInt(challengeId, 10) : challengeId;
    if (isNaN(challengeIdNum)) {
      console.error('Invalid challengeId conversion:', challengeId);
      return res.status(400).json({ error: 'Challenge ID inválido' });
    }

    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeIdNum)
      .eq('is_active', true)
      .single();

    if (challengeError) {
      console.error('Error fetching challenge:', challengeError);
      return res.status(404).json({ error: `Error al buscar el reto: ${challengeError.message}` });
    }

    if (!challenge) {
      console.error('Challenge not found or inactive:', challengeIdNum);
      return res.status(404).json({ error: 'Reto no encontrado o inactivo' });
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
      return res.status(400).json({ 
          error: 'Ya tienes un reto en progreso. Complétalo primero.',
          existingChallenges: existingChallenge.map(c => ({ id: c.id, challengeId: c.challenge_id, status: c.status }))
        });
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
        return res.status(403).json({ error: 'El Modo Focus es exclusivo para usuarios Premium. Actualiza tu suscripción para acceder.' });
      }

      if (customDuration === undefined || customDuration === null) {
        return res.status(400).json({ error: 'Debes especificar la duración para el Modo Focus' });
      }
      if (typeof customDuration !== 'number' || isNaN(customDuration)) {
        return res.status(400).json({ error: 'La duración personalizada debe ser un número válido' });
      }
      if (customDuration < 15) {
        return res.status(400).json({ error: 'La duración mínima es de 15 minutos' });
      }
      if (customDuration > 5 * 60) {
        return res.status(400).json({ error: 'La duración máxima es de 5 horas' });
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
      return res.status(500).json({ error: `Error al crear el reto: ${insertError.message}` });
    }

    if (!newUserChallenge) {
      console.error('No user challenge returned after insert');
      return res.status(500).json({ error: 'Error al crear el reto: no se recibió respuesta' });
    }

    return res.json({
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
    return res.status(500).json({ error: `Error al iniciar el reto: ${errorMessage}` });
  }
});

// Migrated from app/api/challenges/claim/route.ts
router.post('/claim', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const { userChallengeId } = body;

    if (!userChallengeId) {
      return res.status(400).json({ error: 'User Challenge ID es requerido' });
    }

    // Get the user challenge
    const { data: userChallenge, error: challengeError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('id', userChallengeId)
      .eq('user_id', user.id)
      .single();

    if (challengeError || !userChallenge) {
      return res.status(404).json({ error: 'Reto no encontrado' });
    }

    if (userChallenge.status !== 'finished') {
      return res.status(400).json({ error: 'Este reto no está finalizado. Solo puedes reclamar retos que hayan terminado.' });
    }

    // Get challenge details
    const { data: challenge, error: challengeDetailsError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', userChallenge.challenge_id)
      .single();

    if (challengeDetailsError || !challenge) {
      return res.status(404).json({ error: 'Reto no encontrado' });
    }

    // Completar el reto automáticamente y otorgar monedas base
    const claimedAt = new Date().toISOString();
    const completedAt = new Date().toISOString();
    
    // Update user challenge to completed (con recompensa base)
    const { error: updateChallengeError } = await supabase
      .from('user_challenges')
      .update({
        status: 'completed',
        claimed_at: claimedAt,
        completed_at: completedAt,
        shared: false, // Aún no se ha compartido
      })
      .eq('id', userChallengeId);

    if (updateChallengeError) {
      throw updateChallengeError;
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Para retos focus: 1 moneda por hora (calculado desde session_data)
    let baseReward = challenge.reward;
    if (challenge.type === 'focus' && userChallenge.session_data) {
      const sessionData = userChallenge.session_data as { durationMinutes?: number };
      const durationMinutes = sessionData.durationMinutes || 60;
      baseReward = Math.floor(durationMinutes / 60); // 1 moneda por hora
    }
    const newCoins = userData.coins + baseReward;
    const newStreak = userData.streak + 1;
    const newEnergy = updateEnergyOnChallengeComplete(
      userData.avatar_energy,
      challenge.type as 'daily' | 'focus' | 'social'
    );

    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        coins: newCoins,
        streak: newStreak,
        avatar_energy: newEnergy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateUserError) {
      throw updateUserError;
    }

    // Create transaction record for base reward
    await supabase.from('transactions').insert({
      user_id: user.id,
      amount: baseReward,
      type: 'earn',
      description: `Reto completado: ${challenge.title}`,
      challenge_id: challenge.id,
    });

    // Create focus session record if it's a focus challenge
    if (challenge.type === 'focus' && userChallenge.session_data) {
      const sessionData = userChallenge.session_data;
      await supabase.from('focus_sessions').insert({
        user_challenge_id: userChallenge.id,
        duration_seconds: sessionData.durationSeconds || 0,
        interruptions: sessionData.interruptions || 0,
        completed_successfully: true,
      });
    }

    return res.json({
      success: true,
      userChallenge: {
        id: userChallenge.id,
        userId: userChallenge.user_id,
        challengeId: userChallenge.challenge_id,
        status: 'completed',
        startedAt: userChallenge.started_at,
        finishedAt: userChallenge.finished_at,
        claimedAt,
        completedAt,
        sessionData: userChallenge.session_data,
      },
      challenge: {
        id: challenge.id,
        type: challenge.type,
        title: challenge.title,
        description: challenge.description,
        reward: challenge.reward,
        durationMinutes: challenge.duration_minutes,
      },
      coinsEarned: baseReward,
      baseReward: baseReward,
      shareBonus: 0,
      shared: false,
      newCoins,
      newStreak,
      newEnergy,
    });
  } catch (error) {
    console.error('Error claiming challenge:', error);
    return res.status(500).json({ error: 'Error al reclamar el reto' });
  }
});

// Migrated from app/api/challenges/complete/route.ts
router.post('/complete', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const { userChallengeId, imageUrl, note, sessionData } = body;

    if (!userChallengeId) {
      return res.status(400).json({ error: 'User Challenge ID es requerido' });
    }

    // Get the user challenge
    const { data: userChallenge, error: challengeError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('id', userChallengeId)
      .eq('user_id', user.id)
      .single();

    if (challengeError || !userChallenge) {
      return res.status(404).json({ error: 'Reto no encontrado' });
    }

    // Solo aceptamos retos que ya están completados (reclamados)
    if (userChallenge.status !== 'completed') {
      return res.status(400).json({ error: 'Este reto no está completado. Debes reclamarlo primero.' });
    }

    // Verificar que el reto no haya sido compartido ya
    if (userChallenge.shared) {
      return res.status(400).json({ error: 'Este reto ya fue compartido anteriormente' });
    }

    // Get challenge details
    const { data: challenge, error: challengeDetailsError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', userChallenge.challenge_id)
      .single();

    if (challengeDetailsError || !challenge) {
      return res.status(404).json({ error: 'Reto no encontrado' });
    }

    // Determinar si se compartió (tiene note o imageUrl)
    const shared = !!(note || imageUrl);
    const shareBonus = shared ? 2 : 0; // 2 puntos extra por compartir

    if (!shared) {
      return res.status(400).json({ error: 'Debes proporcionar una imagen o nota para compartir' });
    }

    // Update user challenge para marcar como compartido
    const { error: updateChallengeError } = await supabase
      .from('user_challenges')
      .update({
        shared: true,
        session_data: sessionData || userChallenge.session_data,
      })
      .eq('id', userChallengeId);

    if (updateChallengeError) {
      throw updateChallengeError;
    }

    // Get user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Solo agregar el bonus de compartir (las monedas base ya fueron otorgadas al reclamar)
    const newCoins = userData.coins + shareBonus;

    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        coins: newCoins,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateUserError) {
      throw updateUserError;
    }

    // Crear transacción solo por el bonus de compartir
    if (shareBonus > 0) {
      await supabase.from('transactions').insert({
        user_id: user.id,
        amount: shareBonus,
        type: 'earn',
        description: `Bonus por compartir: ${challenge.title}`,
        challenge_id: challenge.id,
      });
    }

    // Create focus session record if it's a focus challenge
    if (challenge.type === 'focus' && sessionData) {
      await supabase.from('focus_sessions').insert({
        user_challenge_id: userChallenge.id,
        duration_seconds: sessionData.durationSeconds || 0,
        interruptions: sessionData.interruptions || 0,
        completed_successfully: true,
      });
    }

    // Create feed item if se compartió (note o imageUrl)
    let feedItem = null;
    if (shared && (note || imageUrl)) {
      const { data: newFeedItem, error: feedError } = await supabase
        .from('feed_items')
        .insert({
          user_id: user.id,
          user_challenge_id: userChallenge.id,
          image_url: imageUrl || null,
          note,
        })
        .select()
        .single();

      if (!feedError && newFeedItem) {
        feedItem = {
          id: newFeedItem.id,
          userId: newFeedItem.user_id,
          userChallengeId: newFeedItem.user_challenge_id,
          imageUrl: newFeedItem.image_url,
          note: newFeedItem.note,
          likesCount: newFeedItem.likes_count,
          commentsCount: newFeedItem.comments_count,
          createdAt: newFeedItem.created_at,
        };
      }
    }

    return res.json({
      success: true,
      userChallenge: {
        id: userChallenge.id,
        userId: userChallenge.user_id,
        challengeId: userChallenge.challenge_id,
        status: 'completed',
        startedAt: userChallenge.started_at,
        completedAt: new Date().toISOString(),
        sessionData: sessionData || userChallenge.session_data,
        createdAt: userChallenge.created_at,
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
      coinsEarned: shareBonus, // Solo el bonus de compartir
      baseReward: challenge.reward, // Ya otorgado al reclamar
      shareBonus: shareBonus,
      shared: shared,
      newCoins,
      feedItem,
    });
  } catch (error) {
    console.error('Error completing challenge:', error);
    return res.status(500).json({ error: 'Error al completar el reto' });
  }
});

export default router;