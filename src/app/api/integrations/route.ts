import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { integrations, user } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const integrationType = searchParams.get('integrationType');

    // Validate userId is provided and is a valid string
    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Valid userId is required',
          code: 'INVALID_USER_ID'
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Build query conditions
    let whereConditions = and(
      eq(integrations.userId, userId),
      eq(integrations.isActive, true)
    );

    // Add integrationType filter if provided
    if (integrationType) {
      whereConditions = and(
        whereConditions,
        eq(integrations.integrationType, integrationType)
      );
    }

    // Fetch integrations
    const userIntegrations = await db.select()
      .from(integrations)
      .where(whereConditions)
      .orderBy(desc(integrations.createdAt));

    return NextResponse.json(userIntegrations, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error as Error).message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      integrationType,
      providerName,
      accessToken,
      refreshToken,
      tokenExpiresAt
    } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        {
          error: 'userId is required',
          code: 'MISSING_USER_ID'
        },
        { status: 400 }
      );
    }

    if (!integrationType) {
      return NextResponse.json(
        {
          error: 'integrationType is required',
          code: 'MISSING_INTEGRATION_TYPE'
        },
        { status: 400 }
      );
    }

    if (!providerName) {
      return NextResponse.json(
        {
          error: 'providerName is required',
          code: 'MISSING_PROVIDER_NAME'
        },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'accessToken is required',
          code: 'MISSING_ACCESS_TOKEN'
        },
        { status: 400 }
      );
    }

    if (!refreshToken) {
      return NextResponse.json(
        {
          error: 'refreshToken is required',
          code: 'MISSING_REFRESH_TOKEN'
        },
        { status: 400 }
      );
    }

    if (!tokenExpiresAt) {
      return NextResponse.json(
        {
          error: 'tokenExpiresAt is required',
          code: 'MISSING_TOKEN_EXPIRES_AT'
        },
        { status: 400 }
      );
    }

    // Validate userId is a valid string
    if (typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        {
          error: 'userId must be a valid non-empty string',
          code: 'INVALID_USER_ID'
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Check if integration already exists
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

    // If integration exists and is active, return conflict
    if (existingIntegration.length > 0 && existingIntegration[0].isActive) {
      return NextResponse.json(
        {
          error: 'Integration already exists and is active',
          code: 'INTEGRATION_EXISTS'
        },
        { status: 409 }
      );
    }

    // If integration exists but is inactive, reactivate it
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

      return NextResponse.json(
        {
          success: true,
          integration: updated[0]
        },
        { status: 201 }
      );
    }

    // Create new integration
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

    return NextResponse.json(
      {
        success: true,
        integration: newIntegration[0]
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}