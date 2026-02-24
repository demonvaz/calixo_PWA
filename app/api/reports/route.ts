import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const reportSchema = z.object({
  reportedUserId: z.string().uuid().optional(),
  feedItemId: z.number().int().optional(),
  feedCommentId: z.number().int().optional(),
  reason: z.string().min(1).max(500),
  description: z.string().optional(),
});

/**
 * POST /api/reports
 * Create a report (any authenticated user)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reportSchema.parse(body);

    // At least one of reportedUserId, feedItemId or feedCommentId must be provided
    if (!validatedData.reportedUserId && !validatedData.feedItemId && !validatedData.feedCommentId) {
      return NextResponse.json(
        { error: 'Debes reportar un usuario, una publicación o un comentario' },
        { status: 400 }
      );
    }

    const { data: newReport, error: insertError } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_user_id: validatedData.reportedUserId || null,
        feed_item_id: validatedData.feedItemId || null,
        feed_comment_id: validatedData.feedCommentId || null,
        reason: validatedData.reason,
        description: validatedData.description || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !newReport) {
      throw insertError;
    }

    return NextResponse.json({
      id: newReport.id,
      reporterId: newReport.reporter_id,
      reportedUserId: newReport.reported_user_id,
      feedItemId: newReport.feed_item_id,
      feedCommentId: (newReport as { feed_comment_id?: number }).feed_comment_id ?? null,
      reason: newReport.reason,
      description: newReport.description,
      status: newReport.status,
      createdAt: newReport.created_at,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

