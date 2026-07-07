import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { creditsHistory, actions, user } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const { searchParams } = new URL(request.url);

    // Validate userId
    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        { error: 'Valid user ID is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Parse pagination parameters
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    let limit = 50;
    let offset = 0;

    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return NextResponse.json(
          { error: 'Invalid limit parameter', code: 'INVALID_LIMIT' },
          { status: 400 }
        );
      }
      limit = Math.min(parsedLimit, 100);
    }

    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return NextResponse.json(
          { error: 'Invalid offset parameter', code: 'INVALID_OFFSET' },
          { status: 400 }
        );
      }
      offset = parsedOffset;
    }

    // Get credit transaction history with LEFT JOIN to actions table
    const history = await db
      .select({
        id: creditsHistory.id,
        userId: creditsHistory.userId,
        amount: creditsHistory.amount,
        source: creditsHistory.source,
        actionId: creditsHistory.actionId,
        description: creditsHistory.description,
        createdAt: creditsHistory.createdAt,
        action: {
          title: actions.title,
          category: actions.category,
          points: actions.points,
        },
      })
      .from(creditsHistory)
      .leftJoin(actions, eq(creditsHistory.actionId, actions.id))
      .where(eq(creditsHistory.userId, userId))
      .orderBy(desc(creditsHistory.createdAt))
      .limit(limit)
      .offset(offset);

    // Transform results to set action to null if actionId is null
    const transformedHistory = history.map((record) => ({
      id: record.id,
      userId: record.userId,
      amount: record.amount,
      source: record.source,
      actionId: record.actionId,
      description: record.description,
      createdAt: record.createdAt,
      action: record.actionId ? record.action : null,
    }));

    return NextResponse.json(transformedHistory, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}