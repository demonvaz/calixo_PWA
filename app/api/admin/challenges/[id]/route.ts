import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

const challengeUpdateSchema = z.object({
  type: z.enum(['daily', 'focus', 'social']).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  reward: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(1).optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * PUT /api/admin/challenges/[id]
 * Update a challenge (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const challengeId = parseInt(id);
    if (isNaN(challengeId)) {
      return NextResponse.json({ error: 'Invalid challenge ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = challengeUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.reward !== undefined) updateData.reward = validatedData.reward;
    if (validatedData.durationMinutes !== undefined) updateData.duration_minutes = validatedData.durationMinutes;
    if (validatedData.isActive !== undefined) updateData.is_active = validatedData.isActive;

    const supabase = createServiceRoleClient();
    const { data: updatedChallenge, error } = await supabase
      .from('challenges')
      .update(updateData)
      .eq('id', challengeId)
      .select()
      .single();

    if (error || !updatedChallenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    return NextResponse.json(updatedChallenge);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to update challenge' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/challenges/[id]
 * Delete a challenge (admin only) - marks as inactive
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const challengeId = parseInt(id);
    if (isNaN(challengeId)) {
      return NextResponse.json({ error: 'Invalid challenge ID' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data: challenge, error: fetchError } = await supabase
      .from('challenges')
      .select('id')
      .eq('id', challengeId)
      .single();

    if (fetchError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    await supabase
      .from('challenges')
      .update({ is_active: false })
      .eq('id', challengeId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    return NextResponse.json(
      { error: 'Failed to delete challenge' },
      { status: 500 }
    );
  }
}
