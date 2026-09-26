import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { readJson, parseValue } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger("api.notifications.id");

const idSchema = z.coerce.number().int().positive();
const putSchema = z.object({ isRead: z.boolean() });

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const parsedId = parseValue(id, idSchema);
    if (!parsedId.ok) return parsedId.response;

    const parsed = await readJson(request, putSchema);
    if (!parsed.ok) return parsed.response;
    const { isRead } = parsed.data;

    const existingNotification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, parsedId.data))
      .limit(1);

    if (existingNotification.length === 0) {
      return NextResponse.json({ error: 'Notification not found', code: 'NOTIFICATION_NOT_FOUND' }, { status: 404 });
    }

    const updated = await db
      .update(notifications)
      .set({ isRead })
      .where(eq(notifications.id, parsedId.data))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Failed to update notification', code: 'UPDATE_FAILED' }, { status: 500 });
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    const ref = log.error('PUT /api/notifications/[id] failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const parsedId = parseValue(id, idSchema);
    if (!parsedId.ok) return parsedId.response;

    const existingNotification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, parsedId.data))
      .limit(1);

    if (existingNotification.length === 0) {
      return NextResponse.json({ error: 'Notification not found', code: 'NOTIFICATION_NOT_FOUND' }, { status: 404 });
    }

    const deleted = await db
      .delete(notifications)
      .where(eq(notifications.id, parsedId.data))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Failed to delete notification', code: 'DELETE_FAILED' }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, message: 'Notification deleted successfully', deletedNotification: deleted[0] },
      { status: 200 }
    );
  } catch (error) {
    const ref = log.error('DELETE /api/notifications/[id] failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}
