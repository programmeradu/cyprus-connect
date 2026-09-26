import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { notificationPreferences, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { bindSessionUser } from "@/lib/api-auth";
import { readJson } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger('notifications.preferences');

const DEFAULT_PREFERENCES = {
  emissionAlerts: true,
  goalAlerts: true,
  leaderboardAlerts: false,
  actionAlerts: true,
  insightAlerts: true,
  complianceAlerts: true,
  systemAlerts: true,
};

const putSchema = z.object({
  userId: z.string().trim().min(1).max(128).optional(),
  emissionAlerts: z.boolean().optional(),
  goalAlerts: z.boolean().optional(),
  leaderboardAlerts: z.boolean().optional(),
  actionAlerts: z.boolean().optional(),
  insightAlerts: z.boolean().optional(),
  complianceAlerts: z.boolean().optional(),
  systemAlerts: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const __auth = await bindSessionUser(request, searchParams.get('userId'));
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    const userExists = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const preferences = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    if (preferences.length === 0) {
      return NextResponse.json({
        userId,
        ...DEFAULT_PREFERENCES,
      });
    }

    return NextResponse.json(preferences[0]);
  } catch (error) {
    const ref = log.error('GET notification preferences failed', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.', ref },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const bodyResult = await readJson(request, putSchema);
    if (!bodyResult.ok) return bodyResult.response;
    const {
      userId: __claimedUserId,
      emissionAlerts,
      goalAlerts,
      leaderboardAlerts,
      actionAlerts,
      insightAlerts,
      complianceAlerts,
      systemAlerts,
    } = bodyResult.data;
    const __auth = await bindSessionUser(request, __claimedUserId);
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    const userExists = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const existingPreferences = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    const now = new Date().toISOString();

    if (existingPreferences.length > 0) {
      const updates: Record<string, any> = {
        updatedAt: now,
      };

      if (emissionAlerts !== undefined) updates.emissionAlerts = emissionAlerts;
      if (goalAlerts !== undefined) updates.goalAlerts = goalAlerts;
      if (leaderboardAlerts !== undefined) updates.leaderboardAlerts = leaderboardAlerts;
      if (actionAlerts !== undefined) updates.actionAlerts = actionAlerts;
      if (insightAlerts !== undefined) updates.insightAlerts = insightAlerts;
      if (complianceAlerts !== undefined) updates.complianceAlerts = complianceAlerts;
      if (systemAlerts !== undefined) updates.systemAlerts = systemAlerts;

      const updated = await db
        .update(notificationPreferences)
        .set(updates)
        .where(eq(notificationPreferences.userId, userId))
        .returning();

      return NextResponse.json(updated[0], { status: 200 });
    } else {
      const newPreferences = {
        userId,
        emissionAlerts: emissionAlerts ?? DEFAULT_PREFERENCES.emissionAlerts,
        goalAlerts: goalAlerts ?? DEFAULT_PREFERENCES.goalAlerts,
        leaderboardAlerts: leaderboardAlerts ?? DEFAULT_PREFERENCES.leaderboardAlerts,
        actionAlerts: actionAlerts ?? DEFAULT_PREFERENCES.actionAlerts,
        insightAlerts: insightAlerts ?? DEFAULT_PREFERENCES.insightAlerts,
        complianceAlerts: complianceAlerts ?? DEFAULT_PREFERENCES.complianceAlerts,
        systemAlerts: systemAlerts ?? DEFAULT_PREFERENCES.systemAlerts,
        createdAt: now,
        updatedAt: now,
      };

      const created = await db
        .insert(notificationPreferences)
        .values(newPreferences)
        .returning();

      return NextResponse.json(created[0], { status: 201 });
    }
  } catch (error) {
    const ref = log.error('PUT notification preferences failed', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.', ref },
      { status: 500 }
    );
  }
}
