import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userProgress } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    const progress = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .limit(1);

    if (progress.length === 0) {
      return NextResponse.json(
        { error: 'User progress not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(progress[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, greenCredits, leaderboardRank, completedActionIds } = body;

    // Validate required fields
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { error: 'userId is required and must be a non-empty string', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    if (leaderboardRank === undefined || leaderboardRank === null) {
      return NextResponse.json(
        { error: 'leaderboardRank is required', code: 'MISSING_LEADERBOARD_RANK' },
        { status: 400 }
      );
    }

    if (typeof leaderboardRank !== 'number' || !Number.isInteger(leaderboardRank)) {
      return NextResponse.json(
        { error: 'leaderboardRank must be an integer', code: 'INVALID_LEADERBOARD_RANK' },
        { status: 400 }
      );
    }

    // Validate optional fields
    const credits = greenCredits !== undefined ? greenCredits : 0;
    if (typeof credits !== 'number' || !Number.isInteger(credits) || credits < 0) {
      return NextResponse.json(
        { error: 'greenCredits must be a non-negative integer', code: 'INVALID_GREEN_CREDITS' },
        { status: 400 }
      );
    }

    const actionIds = completedActionIds !== undefined ? completedActionIds : '[]';
    if (typeof actionIds !== 'string') {
      return NextResponse.json(
        { error: 'completedActionIds must be a string', code: 'INVALID_COMPLETED_ACTION_IDS' },
        { status: 400 }
      );
    }

    // Validate JSON array format
    try {
      const parsed = JSON.parse(actionIds);
      if (!Array.isArray(parsed)) {
        return NextResponse.json(
          { error: 'completedActionIds must be a valid JSON array string', code: 'INVALID_JSON_ARRAY' },
          { status: 400 }
        );
      }
    } catch (e) {
      return NextResponse.json(
        { error: 'completedActionIds must be a valid JSON array string', code: 'INVALID_JSON_FORMAT' },
        { status: 400 }
      );
    }

    // Check if user exists for upsert logic
    const existingProgress = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId.trim()))
      .limit(1);

    const currentTimestamp = Math.floor(Date.now() / 1000);

    if (existingProgress.length > 0) {
      // Update existing record
      const updated = await db
        .update(userProgress)
        .set({
          greenCredits: credits,
          leaderboardRank: leaderboardRank,
          completedActionIds: actionIds,
          updatedAt: new Date(currentTimestamp * 1000),
        })
        .where(eq(userProgress.userId, userId.trim()))
        .returning();

      return NextResponse.json(updated[0], { status: 200 });
    } else {
      // Create new record
      const newProgress = await db
        .insert(userProgress)
        .values({
          userId: userId.trim(),
          greenCredits: credits,
          leaderboardRank: leaderboardRank,
          completedActionIds: actionIds,
          updatedAt: new Date(currentTimestamp * 1000),
        })
        .returning();

      return NextResponse.json(newProgress[0], { status: 201 });
    }
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        { error: 'Valid userId parameter is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { greenCredits, leaderboardRank, completedActionIds } = body;

    // Check if record exists
    const existingProgress = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId.trim()))
      .limit(1);

    if (existingProgress.length === 0) {
      return NextResponse.json(
        { error: 'User progress not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate updates
    const updates: any = {
      updatedAt: new Date(Math.floor(Date.now() / 1000) * 1000),
    };

    if (greenCredits !== undefined) {
      if (typeof greenCredits !== 'number' || !Number.isInteger(greenCredits) || greenCredits < 0) {
        return NextResponse.json(
          { error: 'greenCredits must be a non-negative integer', code: 'INVALID_GREEN_CREDITS' },
          { status: 400 }
        );
      }
      updates.greenCredits = greenCredits;
    }

    if (leaderboardRank !== undefined) {
      if (typeof leaderboardRank !== 'number' || !Number.isInteger(leaderboardRank)) {
        return NextResponse.json(
          { error: 'leaderboardRank must be an integer', code: 'INVALID_LEADERBOARD_RANK' },
          { status: 400 }
        );
      }
      updates.leaderboardRank = leaderboardRank;
    }

    if (completedActionIds !== undefined) {
      if (typeof completedActionIds !== 'string') {
        return NextResponse.json(
          { error: 'completedActionIds must be a string', code: 'INVALID_COMPLETED_ACTION_IDS' },
          { status: 400 }
        );
      }

      try {
        const parsed = JSON.parse(completedActionIds);
        if (!Array.isArray(parsed)) {
          return NextResponse.json(
            { error: 'completedActionIds must be a valid JSON array string', code: 'INVALID_JSON_ARRAY' },
            { status: 400 }
          );
        }
        updates.completedActionIds = completedActionIds;
      } catch (e) {
        return NextResponse.json(
          { error: 'completedActionIds must be a valid JSON array string', code: 'INVALID_JSON_FORMAT' },
          { status: 400 }
        );
      }
    }

    const updated = await db
      .update(userProgress)
      .set(updates)
      .where(eq(userProgress.userId, userId.trim()))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        { error: 'Valid userId parameter is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Check if record exists
    const existingProgress = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId.trim()))
      .limit(1);

    if (existingProgress.length === 0) {
      return NextResponse.json(
        { error: 'User progress not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(userProgress)
      .where(eq(userProgress.userId, userId.trim()))
      .returning();

    return NextResponse.json(
      {
        message: 'User progress deleted successfully',
        deleted: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}