import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo';
    
    const state = nanoid();
    const codeVerifier = nanoid(128);
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    
    const clientId = process.env.XERO_CLIENT_ID || 'demo-client-id';
    const redirectUri = process.env.XERO_REDIRECT_URI || 'http://localhost:3000/api/oauth/xero/callback';
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'offline_access accounting.transactions accounting.contacts accounting.reports.read',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const authUrl = `https://login.xero.com/identity/connect/authorize?${params.toString()}`;
    
    return NextResponse.json({
      authUrl,
      message: 'Xero authorization URL generated. In production, redirect user to this URL.',
      note: 'This is a demo endpoint. Configure XERO_CLIENT_ID and XERO_CLIENT_SECRET in .env for production use.',
    });
  } catch (error) {
    console.error('Xero authorize error:', error);
    return NextResponse.json(
      { error: 'Authorization failed' },
      { status: 500 }
    );
  }
}
