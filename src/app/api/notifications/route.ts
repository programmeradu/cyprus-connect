import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { notifications, user } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { bindSessionUser } from "@/lib/api-auth";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";

const log = logger("api.notifications");

const VALID_NOTIFICATION_TYPES = [
  'emission_entry',
  'goal_achievement',
  'leaderboard_change',
  'action_completed',
  'insight_available',
  'compliance_alert',
  'system_alert'
] as const;

const postSchema = z.object({
  userId: z.string().trim().min(1).max(128).optional().nullable(),
  type: z.enum(VALID_NOTIFICATION_TYPES),
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(2000),
  link: z.string().trim().max(500).nullable().optional(),
  metadata: z.string().max(10_000).nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const __auth = await bindSessionUser(request, searchParams.get('userId'));
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    const limitParam = searchParams.get('limit');
    const unreadOnlyParam = searchParams.get('unreadOnly');

    if (!userId || userId.trim() === '') {
      return NextResponse.json({ error: 'userId is required and must be non-empty', code: 'MISSING_USER_ID' }, { status: 400 });
    }

    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, { status: 404 });
    }

    const limit = limitParam
      ? Math.min(parseInt(limitParam), 100)
      : 50;

    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({ error: 'Invalid limit parameter', code: 'INVALID_LIMIT' }, { status: 400 });
    }

    const unreadOnly = unreadOnlyParam === 'true';

    const results = await db.select()
      .from(notifications)
      .where(
        unreadOnly
          ? and(
              eq(notifications.userId, userId),
              eq(notifications.isRead, false)
            )
          : eq(notifications.userId, userId)
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    const ref = log.error('GET /api/notifications failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await readJson(request, postSchema);
    if (!parsed.ok) return parsed.response;
    const { userId: __claimedUserId, type, title, message, link, metadata } = parsed.data;
    const __auth = await bindSessionUser(request, __claimedUserId ?? null);
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json({ error: 'userId is required and must be a non-empty string', code: 'MISSING_USER_ID' }, { status: 400 });
    }

    if (metadata) {
      try {
        JSON.parse(metadata);
      } catch {
        return NextResponse.json({ error: 'metadata must be valid JSON', code: 'INVALID_JSON_METADATA' }, { status: 400 });
      }
    }

    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, { status: 404 });
    }

    const newNotification = await db.insert(notifications)
      .values({
        userId: userId.trim(),
        type: type.trim(),
        title: title.trim(),
        message: message.trim(),
        link: link ? link.trim() : null,
        metadata: metadata ? metadata.trim() : null,
        isRead: false,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newNotification[0], { status: 201 });

  } catch (error) {
    const ref = log.error('POST /api/notifications failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}
