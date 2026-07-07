import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, userActions, actions } from '@/db/schema';
import { gt, desc, eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');

    // Parse and validate limit parameter
    let limit = 50; // Default limit
    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return NextResponse.json(
          { error: 'Invalid limit parameter', code: 'INVALID_LIMIT' },
          { status: 400 }
        );
      }
      limit = Math.min(parsedLimit, 100); // Max 100
    }

    // Get users with credits > 0, sorted by totalCredits DESC
    const topUsers = await db
      .select({
        userId: user.id,
        name: user.name,
        email: user.email,
        companyName: user.companyName,
        totalCredits: user.totalCredits,
      })
      .from(user)
      .where(gt(user.totalCredits, 0))
      .orderBy(desc(user.totalCredits))
      .limit(limit);

    // Get action counts and details for each user
    const leaderboardWithActions = await Promise.all(
      topUsers.map(async (userRecord, index) => {
        // Get count of completed actions
        const completedActions = await db
          .select({
            count: sql<number>`count(*)`,
          })
          .from(userActions)
          .where(eq(userActions.userId, userRecord.userId));

        const actionCount = completedActions[0]?.count || 0;

        // Get recent completed actions with details
        const recentActions = await db
          .select({
            actionId: userActions.actionId,
            completedAt: userActions.completedAt,
            title: actions.title,
            points: actions.points,
            category: actions.category,
          })
          .from(userActions)
          .leftJoin(actions, eq(userActions.actionId, actions.id))
          .where(eq(userActions.userId, userRecord.userId))
          .orderBy(desc(userActions.completedAt))
          .limit(3);

        return {
          rank: index + 1,
          ...userRecord,
          actionsCompleted: actionCount,
          recentActions: recentActions.filter(a => a.title !== null), // Filter out any null joins
        };
      })
    );

    return NextResponse.json(leaderboardWithActions, { status: 200 });
  } catch (error) {
    console.error('GET leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}