import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notificationPreferences, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_PREFERENCES = {
  emissionAlerts: true,
  goalAlerts: true,
  leaderboardAlerts: false,
  actionAlerts: true,
  insightAlerts: true,
  complianceAlerts: true,
  systemAlerts: true,
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        { error: 'userId is required and must be a non-empty string', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

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
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      emissionAlerts,
      goalAlerts,
      leaderboardAlerts,
      actionAlerts,
      insightAlerts,
      complianceAlerts,
      systemAlerts,
    } = body;

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { error: 'userId is required and must be a non-empty string', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    const booleanFields = {
      emissionAlerts,
      goalAlerts,
      leaderboardAlerts,
      actionAlerts,
      insightAlerts,
      complianceAlerts,
      systemAlerts,
    };

    for (const [field, value] of Object.entries(booleanFields)) {
      if (value !== undefined && typeof value !== 'boolean') {
        return NextResponse.json(
          { error: `${field} must be a boolean value`, code: 'INVALID_FIELD_TYPE' },
          { status: 400 }
        );
      }
    }

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
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}