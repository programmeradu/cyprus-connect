import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { integrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }
    
    // Get existing integration
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
    
    // Refresh the access token
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
      const errorData = await tokenResponse.json();
      console.error('Token refresh error:', errorData);
      
      // If refresh token is expired, mark integration as disconnected
      await db
        .update(integrations)
        .set({
          isActive: false,
          updatedAt: new Date().toISOString()
        })
        .where(eq(integrations.id, integration.id));
      
      return NextResponse.json(
        { error: 'Failed to refresh token', details: errorData },
        { status: 401 }
      );
    }
    
    const tokenData = await tokenResponse.json();
    
    const now = new Date();
    const accessTokenExpiry = new Date(now.getTime() + tokenData.expires_in * 1000);
    
    // Update tokens
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
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
