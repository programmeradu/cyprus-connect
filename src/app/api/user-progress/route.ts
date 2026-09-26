import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { userProgress } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { bindSessionUser } from "@/lib/api-auth";
import { readJson } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger("api.user-progress");

const actionIdsSchema = z.string().max(20000).refine((s) => {
  try {
    return Array.isArray(JSON.parse(s));
  } catch {
    return false;
  }
}, { message: 'completedActionIds must be a valid JSON array string' });

const postSchema = z.object({
  userId: z.string().trim().min(1).max(200).optional(),
  greenCredits: z.number().int().min(0).max(1_000_000_000).optional(),
  leaderboardRank: z.number().int().min(0).max(1_000_000_000),
  completedActionIds: actionIdsSchema.optional(),
});

const putSchema = z.object({
  greenCredits: z.number().int().min(0).max(1_000_000_000).optional(),
  leaderboardRank: z.number().int().optional(),
  completedActionIds: actionIdsSchema.optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const __auth = await bindSessionUser(request, searchParams.get('userId'));
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

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
    const ref = log.error('GET /api/user-progress failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await readJson(request, postSchema);
    if (!parsed.ok) return parsed.response;
    const { userId: __claimedUserId, greenCredits, leaderboardRank, completedActionIds } = parsed.data;
    const __auth = await bindSessionUser(request, __claimedUserId);
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    const credits = greenCredits ?? 0;
    const actionIds = completedActionIds ?? '[]';

    const existingProgress = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .limit(1);

    const currentTimestamp = Math.floor(Date.now() / 1000);

    if (existingProgress.length > 0) {
      const updated = await db
        .update(userProgress)
        .set({
          greenCredits: credits,
          leaderboardRank,
          completedActionIds: actionIds,
          updatedAt: new Date(currentTimestamp * 1000),
        })
        .where(eq(userProgress.userId, userId))
        .returning();

      return NextResponse.json(updated[0], { status: 200 });
    } else {
      const newProgress = await db
        .insert(userProgress)
        .values({
          userId,
          greenCredits: credits,
          leaderboardRank,
          completedActionIds: actionIds,
          updatedAt: new Date(currentTimestamp * 1000),
        })
        .returning();

      return NextResponse.json(newProgress[0], { status: 201 });
    }
  } catch (error) {
    const ref = log.error('POST /api/user-progress failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const __auth = await bindSessionUser(request, searchParams.get('userId'));
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    const existingProgress = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .limit(1);

    if (existingProgress.length === 0) {
      return NextResponse.json(
        { error: 'User progress not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const parsed = await readJson(request, putSchema);
    if (!parsed.ok) return parsed.response;
    const { greenCredits, leaderboardRank, completedActionIds } = parsed.data;

    const updates: any = {
      updatedAt: new Date(Math.floor(Date.now() / 1000) * 1000),
    };

    if (greenCredits !== undefined) updates.greenCredits = greenCredits;
    if (leaderboardRank !== undefined) updates.leaderboardRank = leaderboardRank;
    if (completedActionIds !== undefined) updates.completedActionIds = completedActionIds;

    const updated = await db
      .update(userProgress)
      .set(updates)
      .where(eq(userProgress.userId, userId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    const ref = log.error('PUT /api/user-progress failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const __auth = await bindSessionUser(request, searchParams.get('userId'));
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    const existingProgress = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .limit(1);

    if (existingProgress.length === 0) {
      return NextResponse.json(
        { error: 'User progress not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(userProgress)
      .where(eq(userProgress.userId, userId))
      .returning();

    return NextResponse.json(
      {
        message: 'User progress deleted successfully',
        deleted: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    const ref = log.error('DELETE /api/user-progress failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}
