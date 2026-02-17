import { NextRequest, NextResponse } from 'next/server';
import { requireModerator } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

const resolveSchema = z.object({
  status: z.enum(['reviewed', 'resolved']),
  action: z.enum(['approve', 'reject', 'delete']).optional(),
});

/**
 * PUT /api/admin/moderation/[id]/resolve
 * Resolve a report (moderator/admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isModerator = await requireModerator();
    if (!isModerator) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const reportId = parseInt(id);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = resolveSchema.parse(body);

    const supabase = createServiceRoleClient();

    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // If action is delete and there's a feed_item_id, delete the feed item
    if (validatedData.action === 'delete' && report.feed_item_id) {
      await supabase.from('feed_items').delete().eq('id', report.feed_item_id);
    }

    // Map status: approve -> resolved, reject -> dismissed
    const newStatus =
      validatedData.action === 'approve'
        ? 'resolved'
        : validatedData.action === 'reject'
          ? 'dismissed'
          : 'resolved';

    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update({ status: newStatus })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      report: updatedReport,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error resolving report:', error);
    return NextResponse.json(
      { error: 'Failed to resolve report' },
      { status: 500 }
    );
  }
}
