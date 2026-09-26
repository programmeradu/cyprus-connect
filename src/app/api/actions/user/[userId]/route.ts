import { logger } from "@/lib/log";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userActions, actions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { bindSessionUser } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const __auth = await bindSessionUser(request, (await context.params).userId);
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;


    // Validate userId is valid string
    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        {
          error: 'Valid user ID is required',
          code: 'INVALID_USER_ID',
        },
        { status: 400 }
      );
    }

    // Query userActions with join to actions table
    const completedActions = await db
      .select({
        // userAction data
        id: userActions.id,
        userId: userActions.userId,
        actionId: userActions.actionId,
        completedAt: userActions.completedAt,
        notes: userActions.notes,
        // action data
        title: actions.title,
        description: actions.description,
        category: actions.category,
        impact: actions.impact,
        difficulty: actions.difficulty,
        points: actions.points,
        iconName: actions.iconName,
      })
      .from(userActions)
      .innerJoin(actions, eq(userActions.actionId, actions.id))
      .where(eq(userActions.userId, userId))
      .orderBy(desc(userActions.completedAt));

    return NextResponse.json(completedActions, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error', ref: logger("api.actions.user.userId").error("request failed", error),
      },
      { status: 500 }
    );
  }
}