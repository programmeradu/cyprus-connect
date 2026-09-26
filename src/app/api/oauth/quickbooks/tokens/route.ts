import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { integrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { bindSessionUser } from "@/lib/api-auth";
import { readJson } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger("api.oauth.quickbooks.tokens");

const postSchema = z.object({
  userId: z.string().trim().min(1).max(200).optional(),
  realmId: z.string().trim().min(1).max(200),
  accessToken: z.string().trim().min(1).max(4000),
  refreshToken: z.string().trim().min(1).max(4000),
  expiresIn: z.number().finite().min(0).max(100_000_000),
  refreshTokenExpiresIn: z.number().finite().min(0).max(100_000_000).optional(),
});

// Store QuickBooks tokens
export async function POST(request: NextRequest) {
  try {
    const parsed = await readJson(request, postSchema);
    if (!parsed.ok) return parsed.response;
    const { userId: __claimedUserId, realmId, accessToken, refreshToken, expiresIn } = parsed.data;
    const __auth = await bindSessionUser(request, __claimedUserId);
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    const now = new Date();
    const accessTokenExpiry = new Date(now.getTime() + expiresIn * 1000);

    // Check if integration already exists
    const existing = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.userId, userId),
          eq(integrations.providerName, 'quickbooks')
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing integration
      await db
        .update(integrations)
        .set({
          accessToken,
          refreshToken,
          tokenExpiresAt: accessTokenExpiry.toISOString(),
          integrationType: 'accounting',
          providerName: 'quickbooks',
          isActive: true,
          lastSyncAt: now.toISOString(),
          updatedAt: now.toISOString()
        })
        .where(eq(integrations.id, existing[0].id));

      return NextResponse.json({
        success: true,
        message: 'QuickBooks integration updated',
        integrationId: existing[0].id
      });
    } else {
      // Create new integration
      const [newIntegration] = await db
        .insert(integrations)
        .values({
          userId,
          integrationType: 'accounting',
          providerName: 'quickbooks',
          accessToken,
          refreshToken,
          tokenExpiresAt: accessTokenExpiry.toISOString(),
          isActive: true,
          lastSyncAt: now.toISOString(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: 'QuickBooks integration created',
        integrationId: newIntegration.id
      });
    }
  } catch (error) {
    const ref = log.error('POST /api/oauth/quickbooks/tokens failed', error);
    return NextResponse.json({ error: 'Failed to store tokens', ref }, { status: 500 });
  }
}

// Get QuickBooks tokens for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const __auth = await bindSessionUser(request, searchParams.get('userId'));
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    const integration = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.userId, userId),
          eq(integrations.providerName, 'quickbooks')
        )
      )
      .limit(1);

    if (integration.length === 0) {
      return NextResponse.json(
        { connected: false },
        { status: 200 }
      );
    }

    const data = integration[0];

    // Check if access token is expired
    const now = new Date();
    const isExpired = data.tokenExpiresAt && new Date(data.tokenExpiresAt) <= now;

    // Don't send actual tokens to client, just status
    return NextResponse.json({
      connected: true,
      status: data.isActive ? 'connected' : 'disconnected',
      isExpired,
      realmId: null,
      lastSyncedAt: data.lastSyncAt,
      environment: process.env.QB_ENVIRONMENT || 'sandbox'
    });
  } catch (error) {
    const ref = log.error('GET /api/oauth/quickbooks/tokens failed', error);
    return NextResponse.json({ error: 'Failed to get tokens', ref }, { status: 500 });
  }
}

// Delete QuickBooks integration
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const __auth = await bindSessionUser(request, searchParams.get('userId'));
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    await db
      .delete(integrations)
      .where(
        and(
          eq(integrations.userId, userId),
          eq(integrations.providerName, 'quickbooks')
        )
      );

    return NextResponse.json({
      success: true,
      message: 'QuickBooks integration disconnected'
    });
  } catch (error) {
    const ref = log.error('DELETE /api/oauth/quickbooks/tokens failed', error);
    return NextResponse.json({ error: 'Failed to disconnect integration', ref }, { status: 500 });
  }
}
