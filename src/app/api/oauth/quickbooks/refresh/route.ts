import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { integrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";

const log = logger("oauth.quickbooks.refresh");

const bodySchema = z.object({
  userId: z.string().trim().min(1).max(100),
});

export async function POST(request: NextRequest) {
  const parsed = await readJson(request, bodySchema);
  if (!parsed.ok) return parsed.response;
  const { userId } = parsed.data;

  try {
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

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'QuickBooks integration not found' },
        { status: 404 }
      );
    }

    const integration = existing[0];

    if (!integration.refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token available' },
        { status: 400 }
      );
    }

    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: integration.refreshToken
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => undefined);
      log.warn('Token refresh error', { errorData });

      await db
        .update(integrations)
        .set({
          isActive: false,
          updatedAt: new Date().toISOString()
        })
        .where(eq(integrations.id, integration.id));

      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();

    const now = new Date();
    const accessTokenExpiry = new Date(now.getTime() + tokenData.expires_in * 1000);

    await db
      .update(integrations)
      .set({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: accessTokenExpiry.toISOString(),
        lastSyncAt: now.toISOString(),
        isActive: true,
        updatedAt: now.toISOString()
      })
      .where(eq(integrations.id, integration.id));

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    const ref = log.error('Refresh token error', error);
    return NextResponse.json(
      { error: 'Failed to refresh token', ref },
      { status: 500 }
    );
  }
}
