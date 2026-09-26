import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { notifications, user } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { bindSessionUser } from "@/lib/api-auth";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";

const log = logger("api.notifications.mark-all-read");

const putSchema = z.object({
  userId: z.string().trim().min(1).max(128).optional().nullable(),
});

export async function PUT(request: NextRequest) {
  try {
    const parsed = await readJson(request, putSchema);
    if (!parsed.ok) return parsed.response;
    const __auth = await bindSessionUser(request, parsed.data.userId ?? null);
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json({ error: "Valid user ID is required", code: "INVALID_USER_ID" }, { status: 400 });
    }

    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, { status: 404 });
    }

    const updatedNotifications = await db.update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )
      .returning();

    const updatedCount = updatedNotifications.length;

    return NextResponse.json({
      success: true,
      updatedCount,
      message: 'All notifications marked as read'
    }, { status: 200 });

  } catch (error) {
    const ref = log.error('PUT /api/notifications/mark-all-read failed', error);
    return NextResponse.json({ error: 'Internal server error', ref, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
