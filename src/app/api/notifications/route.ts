import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications, user } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const VALID_NOTIFICATION_TYPES = [
  'emission_entry',
  'goal_achievement',
  'leaderboard_change',
  'action_completed',
  'insight_available',
  'compliance_alert',
  'system_alert'
] as const;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limitParam = searchParams.get('limit');
    const unreadOnlyParam = searchParams.get('unreadOnly');

    // Validate userId
    if (!userId || userId.trim() === '') {
      return NextResponse.json({ 
        error: 'userId is required and must be non-empty',
        code: 'MISSING_USER_ID' 
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

    // Parse and validate limit
    const limit = limitParam 
      ? Math.min(parseInt(limitParam), 100) 
      : 50;

    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({ 
        error: 'Invalid limit parameter',
        code: 'INVALID_LIMIT' 
      }, { status: 400 });
    }

    // Parse unreadOnly filter
    const unreadOnly = unreadOnlyParam === 'true';

    // Build query
    let query = db.select()
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

    const results = await query;

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET notifications error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, message, link, metadata } = body;

    // Validate required fields
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json({ 
        error: 'userId is required and must be a non-empty string',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    if (!type || typeof type !== 'string' || type.trim() === '') {
      return NextResponse.json({ 
        error: 'type is required and must be a non-empty string',
        code: 'MISSING_TYPE' 
      }, { status: 400 });
    }

    if (!VALID_NOTIFICATION_TYPES.includes(type as typeof VALID_NOTIFICATION_TYPES[number])) {
      return NextResponse.json({ 
        error: `type must be one of: ${VALID_NOTIFICATION_TYPES.join(', ')}`,
        code: 'INVALID_TYPE' 
      }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ 
        error: 'title is required and must be a non-empty string',
        code: 'MISSING_TITLE' 
      }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ 
        error: 'message is required and must be a non-empty string',
        code: 'MISSING_MESSAGE' 
      }, { status: 400 });
    }

    // Validate optional fields
    if (link !== undefined && link !== null && typeof link !== 'string') {
      return NextResponse.json({ 
        error: 'link must be a string or null',
        code: 'INVALID_LINK' 
      }, { status: 400 });
    }

    if (metadata !== undefined && metadata !== null) {
      if (typeof metadata !== 'string') {
        return NextResponse.json({ 
          error: 'metadata must be a string or null',
          code: 'INVALID_METADATA' 
        }, { status: 400 });
      }

      // Validate JSON format if metadata provided
      try {
        JSON.parse(metadata);
      } catch {
        return NextResponse.json({ 
          error: 'metadata must be valid JSON',
          code: 'INVALID_JSON_METADATA' 
        }, { status: 400 });
      }
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

    // Create notification
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
    console.error('POST notifications error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}