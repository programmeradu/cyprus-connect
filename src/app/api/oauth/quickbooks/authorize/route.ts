import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }
    
    const clientId = process.env.QB_CLIENT_ID;
    const environment = process.env.QB_ENVIRONMENT || 'sandbox';
    
    // Use dynamic redirect URI based on actual request origin
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/oauth/quickbooks/callback`;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'QuickBooks credentials not configured' },
        { status: 500 }
      );
    }
    
    // Generate state parameter for CSRF protection
    const state = nanoid();
    
    // Store state in a cookie for verification (you could also use database)
    const response = NextResponse.json({
      authUrl: `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&response_type=code&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`,
      message: 'Redirect user to authUrl to complete QuickBooks authorization'
    });
    
    // Set state cookie (7 days expiry)
    response.cookies.set('qb_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });
    
    // Set userId cookie for callback
    response.cookies.set('qb_oauth_user', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });
    
    return response;
  } catch (error) {
    console.error('QuickBooks authorize error:', error);
    return NextResponse.json(
      { error: 'Authorization failed' },
      { status: 500 }
    );
  }
}