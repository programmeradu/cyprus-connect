import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { integrations, user } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { bindSessionUser } from "@/lib/api-auth";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";

const log = logger("api.integrations");

const postSchema = z.object({
  userId: z.string().trim().min(1).max(128).optional().nullable(),
  integrationType: z.string().trim().min(1).max(64),
  providerName: z.string().trim().min(1).max(64),
  accessToken: z.string().trim().min(1).max(4096),
  refreshToken: z.string().trim().min(1).max(4096),
  tokenExpiresAt: z.string().trim().min(1).max(64),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const __auth = await bindSessionUser(request, searchParams.get('userId'));
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    const integrationType = searchParams.get('integrationType');

    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, { status: 404 });
    }

    let whereConditions = and(
      eq(integrations.userId, userId),
      eq(integrations.isActive, true)
    );

    if (integrationType) {
      whereConditions = and(
        whereConditions,
        eq(integrations.integrationType, integrationType)
      );
    }

    const userIntegrations = await db.select()
      .from(integrations)
      .where(whereConditions)
      .orderBy(desc(integrations.createdAt));

    return NextResponse.json(userIntegrations, { status: 200 });
  } catch (error) {
    const ref = log.error('GET /api/integrations failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await readJson(request, postSchema);
    if (!parsed.ok) return parsed.response;
    const {
      userId: __claimedUserId,
      integrationType,
      providerName,
      accessToken,
      refreshToken,
      tokenExpiresAt
    } = parsed.data;
    const __auth = await bindSessionUser(request, __claimedUserId ?? null);
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required', code: 'MISSING_USER_ID' }, { status: 400 });
    }

    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, { status: 404 });
    }

    const existingIntegration = await db.select()
      .from(integrations)
      .where(
        and(
          eq(integrations.userId, userId),
          eq(integrations.integrationType, integrationType),
          eq(integrations.providerName, providerName)
        )
      )
      .limit(1);

    if (existingIntegration.length > 0 && existingIntegration[0].isActive) {
      return NextResponse.json(
        { error: 'Integration already exists and is active', code: 'INTEGRATION_EXISTS' },
        { status: 409 }
      );
    }

    if (existingIntegration.length > 0 && !existingIntegration[0].isActive) {
      const updated = await db.update(integrations)
        .set({
          accessToken,
          refreshToken,
          tokenExpiresAt,
          isActive: true,
          lastSyncAt: null,
          updatedAt: new Date().toISOString()
        })
        .where(eq(integrations.id, existingIntegration[0].id))
        .returning();

      return NextResponse.json({ success: true, integration: updated[0] }, { status: 201 });
    }

    const newIntegration = await db.insert(integrations)
      .values({
        userId: userId,
        integrationType,
        providerName,
        accessToken,
        refreshToken,
        tokenExpiresAt,
        isActive: true,
        lastSyncAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json({ success: true, integration: newIntegration[0] }, { status: 201 });
  } catch (error) {
    const ref = log.error('POST /api/integrations failed', error);
    return NextResponse.json({ error: 'Internal server error', ref }, { status: 500 });
  }
}
