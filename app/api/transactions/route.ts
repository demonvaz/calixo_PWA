import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { transactions, storeItems, challenges } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/transactions
 * Get user's transaction history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'earn' or 'spend'
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get user's transactions
    let query = db
      .select({
        transaction: transactions,
        item: storeItems,
        challenge: challenges,
      })
      .from(transactions)
      .leftJoin(storeItems, eq(transactions.itemId, storeItems.id))
      .leftJoin(challenges, eq(transactions.challengeId, challenges.id))
      .where(eq(transactions.userId, user.id))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    const results = await query;

    // Filter by type if specified
    let filteredResults = results;
    if (type) {
      filteredResults = results.filter(r => r.transaction.type === type);
    }

    // Calculate totals
    const totalEarned = results
      .filter(r => r.transaction.type === 'earn')
      .reduce((sum, r) => sum + r.transaction.amount, 0);

    const totalSpent = results
      .filter(r => r.transaction.type === 'spend')
      .reduce((sum, r) => sum + Math.abs(r.transaction.amount), 0);

    return NextResponse.json({
      transactions: filteredResults,
      totals: {
        earned: totalEarned,
        spent: totalSpent,
        net: totalEarned - totalSpent,
      },
      count: filteredResults.length,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Error al obtener transacciones' },
      { status: 500 }
    );
  }
}



