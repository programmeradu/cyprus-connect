import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const realmId = searchParams.get('realmId');
    const error = searchParams.get('error');
    
    // Check for authorization errors
    if (error) {
      return NextResponse.redirect(
        new URL(`/app/integrations?qb_error=${encodeURIComponent(error)}`, request.url)
      );
    }
    
    if (!code || !state || !realmId) {
      return NextResponse.redirect(
        new URL('/app/integrations?qb_error=missing_parameters', request.url)
      );
    }
    
    // Verify state parameter (CSRF protection)
    const storedState = request.cookies.get('qb_oauth_state')?.value;
    const userId = request.cookies.get('qb_oauth_user')?.value;
    
    if (!storedState || state !== storedState) {
      return NextResponse.redirect(
        new URL('/app/integrations?qb_error=invalid_state', request.url)
      );
    }
    
    if (!userId) {
      return NextResponse.redirect(
        new URL('/app/integrations?qb_error=missing_user', request.url)
      );
    }
    
    // Use dynamic redirect URI based on actual request origin
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/oauth/quickbooks/callback`;
    
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect(
        new URL('/app/integrations?qb_error=token_exchange_failed', request.url)
      );
    }
    
    const tokenData = await tokenResponse.json();
    
    // Store tokens in database
    const storeResponse = await fetch(`${request.nextUrl.origin}/api/oauth/quickbooks/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${request.cookies.get('bearer_token')?.value || ''}`
      },
      body: JSON.stringify({
        userId,
        realmId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        refreshTokenExpiresIn: tokenData.x_refresh_token_expires_in
      })
    });
    
    if (!storeResponse.ok) {
      console.error('Failed to store tokens');
      return NextResponse.redirect(
        new URL('/app/integrations?qb_error=storage_failed', request.url)
      );
    }
    
    // Clear state cookies
    const response = NextResponse.redirect(
      new URL('/app/integrations?qb_success=true', request.url)
    );
    
    response.cookies.delete('qb_oauth_state');
    response.cookies.delete('qb_oauth_user');
    
    return response;
  } catch (error) {
    console.error('QuickBooks callback error:', error);
    return NextResponse.redirect(
      new URL('/app/integrations?qb_error=callback_failed', request.url)
    );
  }
}