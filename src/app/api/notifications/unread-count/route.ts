import { logger } from "@/lib/log";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications, user } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { bindSessionUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const __auth = await bindSessionUser(request, searchParams.get('userId'));
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;


    // Validate userId is provided
    if (!userId) {
      return NextResponse.json({ 
        error: 'userId query parameter is required',
        code: 'MISSING_USER_ID'
      }, { status: 400 });
    }

    // Validate userId is a non-empty string
    if (typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json({ 
        error: 'userId must be a non-empty string',
        code: 'INVALID_USER_ID'
      }, { status: 400 });
    }

    // Verify user exists
    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    // Count unread notifications for this user
    const result = await db.select({
      count: sql<number>`cast(count(*) as integer)`
    })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );

    const count = result[0]?.count ?? 0;

    return NextResponse.json({ count }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error', ref: logger("api.notifications.unread-count").error('request failed', error),
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}