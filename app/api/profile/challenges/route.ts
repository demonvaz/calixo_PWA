import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/profile/challenges?page=1&limit=5
 * Get all challenges for the current user with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('user_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error counting challenges:', countError);
    }

    // Get paginated user challenges
    const { data: userChallenges, error: challengesError } = await supabase
      .from('user_challenges')
      .select('id, challenge_id, status, started_at, completed_at, failed_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (challengesError) {
      console.error('Error fetching challenges:', challengesError);
      return NextResponse.json(
        { error: 'Error al obtener los retos' },
        { status: 500 }
      );
    }

    if (!userChallenges || userChallenges.length === 0) {
      return NextResponse.json({
        challenges: [],
        total: 0,
      });
    }

    // Get challenge IDs
    const challengeIds = userChallenges.map(uc => uc.challenge_id);

    // Get challenge details
    const { data: challenges, error: challengeDetailsError } = await supabase
      .from('challenges')
      .select('id, title, type, reward')
      .in('id', challengeIds);

    if (challengeDetailsError) {
      console.error('Error fetching challenge details:', challengeDetailsError);
      return NextResponse.json(
        { error: 'Error al obtener los detalles de los retos' },
        { status: 500 }
      );
    }

    // Create a map of challenge details
    const challengeMap = new Map(
      (challenges || []).map(c => [c.id, c])
    );

    // Format the response
    const formattedChallenges = userChallenges.map((uc) => {
      const challenge = challengeMap.get(uc.challenge_id);
      // Determine the date to show based on status
      let statusDate = uc.created_at;
      if (uc.status === 'completed' && uc.completed_at) {
        statusDate = uc.completed_at;
      } else if ((uc.status === 'failed' || uc.status === 'canceled') && uc.failed_at) {
        statusDate = uc.failed_at;
      } else if (uc.started_at) {
        statusDate = uc.started_at;
      }
      
      return {
        id: uc.id,
        challengeId: uc.challenge_id,
        challengeTitle: challenge?.title || 'Reto desconocido',
        challengeType: challenge?.type || 'unknown',
        reward: challenge?.reward || 0,
        status: uc.status,
        statusDate: statusDate,
        startedAt: uc.started_at,
        completedAt: uc.completed_at,
        failedAt: uc.failed_at,
      };
    });

    const totalPages = totalCount ? Math.ceil(totalCount / limit) : 0;

    return NextResponse.json({
      challenges: formattedChallenges,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching completed challenges:', error);
    return NextResponse.json(
      { error: 'Error al obtener los retos completados' },
      { status: 500 }
    );
  }
}
