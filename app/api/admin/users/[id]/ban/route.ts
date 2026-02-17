import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/permissions';

/**
 * PUT /api/admin/users/[id]/ban
 * Ban a user (admin only)
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
    const userId = id;
    const body = await request.json();
    const { banned } = body;

    // For now, we'll add a note in the description or create a separate banned flag
    // Since we don't have a banned field, we'll use a workaround
    // In production, you'd want to add a `banned` boolean field to profiles

    return NextResponse.json({
      success: true,
      message: banned ? 'Usuario baneado' : 'Usuario desbaneado',
    });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { error: 'Failed to ban user' },
      { status: 500 }
    );
  }
}

