import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { integrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Store QuickBooks tokens
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, realmId, accessToken, refreshToken, expiresIn, refreshTokenExpiresIn } = body;
    
    if (!userId || !realmId || !accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
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
    console.error('Store tokens error:', error);
    return NextResponse.json(
      { error: 'Failed to store tokens' },
      { status: 500 }
    );
  }
}

// Get QuickBooks tokens for a user
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }
    
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
    console.error('Get tokens error:', error);
    return NextResponse.json(
      { error: 'Failed to get tokens' },
      { status: 500 }
    );
  }
}

// Delete QuickBooks integration
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }
    
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
    console.error('Delete integration error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect integration' },
      { status: 500 }
    );
  }
}
