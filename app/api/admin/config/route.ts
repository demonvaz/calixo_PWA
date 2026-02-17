import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/config
 * Get all configuration (admin only)
 */
export async function GET() {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const { data: allConfig, error } = await supabase
      .from('config')
      .select('key, value');

    if (error) {
      throw error;
    }

    const configObject: Record<string, unknown> = {};
    (allConfig || []).forEach((item) => {
      configObject[item.key] = item.value;
    });

    return NextResponse.json(configObject);
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/config
 * Update configuration (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const updates = body as Record<string, unknown>;

    const supabase = createServiceRoleClient();
    const results: { key: string; value: unknown }[] = [];

    for (const [key, value] of Object.entries(updates)) {
      const { error } = await supabase
        .from('config')
        .upsert(
          { key, value, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
      if (error) {
        throw error;
      }
      results.push({ key, value });
    }

    return NextResponse.json({ success: true, updates: results });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    );
  }
}
