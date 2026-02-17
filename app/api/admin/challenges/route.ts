import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

const challengeSchema = z.object({
  type: z.enum(['daily', 'focus', 'social']),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  reward: z.number().int().min(0),
  durationMinutes: z.number().int().min(1).optional(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/admin/challenges
 * List all challenges (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('isActive');

    let query = supabase.from('challenges').select('*').order('created_at', { ascending: true });

    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: allChallenges, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(allChallenges || []);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/challenges
 * Create a new challenge (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = challengeSchema.parse(body);

    const supabase = createServiceRoleClient();
    const { data: newChallenge, error } = await supabase
      .from('challenges')
      .insert({
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description || null,
        reward: validatedData.reward,
        duration_minutes: validatedData.durationMinutes ?? null,
        is_active: validatedData.isActive,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(newChallenge, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
}
