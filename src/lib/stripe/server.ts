// Server-only Stripe client — routed through Lovable's connector gateway.
// The API keys here are gateway connection identifiers, NOT real Stripe secrets.
// Falls back to direct BYOK secret key if gateway keys aren't provisioned yet.
import Stripe from 'stripe';

const STRIPE_API_VERSION = '2025-12-15.clover' as const;
const GATEWAY_STRIPE_BASE = 'https://connector-gateway.lovable.dev/stripe';

export type StripeEnv = 'sandbox' | 'live';

function getEnv(key: string): string | undefined {
  const v = process.env[key];
  return v && v.length > 0 ? v : undefined;
}

function getConnectionApiKey(env: StripeEnv): string | undefined {
  return env === 'sandbox'
    ? getEnv('STRIPE_SANDBOX_API_KEY')
    : getEnv('STRIPE_LIVE_API_KEY');
}

/**
 * Create a Stripe SDK client whose HTTP transport is rewritten to route
 * through Lovable's connector gateway (which attaches the real Stripe secret).
 * Falls back to a direct-SDK client using STRIPE_SECRET_KEY when gateway keys
 * are not yet provisioned, so existing BYOK code keeps working during the
 * migration window.
 */
export function createStripeClient(env: StripeEnv = 'sandbox'): Stripe {
  const connectionApiKey = getConnectionApiKey(env);
  const lovableApiKey = getEnv('LOVABLE_API_KEY');

  // Gateway path (preferred)
  if (connectionApiKey && lovableApiKey) {
    return new Stripe(connectionApiKey, {
      apiVersion: STRIPE_API_VERSION as any,
      typescript: true,
      httpClient: Stripe.createFetchHttpClient((input: any, init?: any) => {
        const stripeUrl = input instanceof Request ? input.url : input.toString();
        const gatewayUrl = stripeUrl.replace('https://api.stripe.com', GATEWAY_STRIPE_BASE);
        const mergedHeaders = new Headers(
          init?.headers ?? (input instanceof Request ? input.headers : undefined),
        );
        mergedHeaders.set('X-Connection-Api-Key', connectionApiKey);
        mergedHeaders.set('Lovable-API-Key', lovableApiKey);
        return fetch(gatewayUrl, { ...(init || {}), headers: mergedHeaders });
      }),
    });
  }

  // Fallback: direct SDK with BYOK secret (legacy)
  const legacyKey = getEnv('STRIPE_SECRET_KEY');
  if (!legacyKey) {
    throw new Error(
      'Stripe is not configured. Missing STRIPE_SANDBOX_API_KEY/LOVABLE_API_KEY (gateway) and STRIPE_SECRET_KEY (fallback).',
    );
  }
  return new Stripe(legacyKey, {
    apiVersion: STRIPE_API_VERSION as any,
    typescript: true,
  });
}

/**
 * HMAC-SHA256 verification of a Lovable-payments webhook. Uses the env-scoped
 * signing secret provisioned by enable_stripe_payments. Does NOT depend on the
 * Stripe SDK (so it works regardless of gateway routing).
 */
export async function verifyPaymentsWebhook(
  req: Request,
  env: StripeEnv,
): Promise<{ type: string; data: { object: any }; id?: string }> {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  const secret =
    env === 'sandbox'
      ? getEnv('PAYMENTS_SANDBOX_WEBHOOK_SECRET')
      : getEnv('PAYMENTS_LIVE_WEBHOOK_SECRET');

  if (!secret) throw new Error(`Missing webhook secret for env=${env}`);
  if (!signature || !body) throw new Error('Missing signature or body');

  let timestamp: string | undefined;
  const v1Signatures: string[] = [];
  for (const part of signature.split(',')) {
    const [key, value] = part.split('=', 2);
    if (key === 't') timestamp = value;
    if (key === 'v1') v1Signatures.push(value);
  }
  if (!timestamp || v1Signatures.length === 0) throw new Error('Invalid signature format');

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) throw new Error('Webhook timestamp too old');

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signed = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${body}`),
  );
  const expected = Buffer.from(new Uint8Array(signed)).toString('hex');

  if (!v1Signatures.includes(expected)) throw new Error('Invalid webhook signature');
  return JSON.parse(body);
}

export function getStripeErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as any;
    const msg = e.raw?.message ?? e.message;
    if (msg) return msg;
  }
  return 'Stripe request failed';
}

/**
 * Resolve a human-readable price slug (e.g. "pro_monthly_usd") to a real
 * Stripe Price ID via the price's lookup_key. Cached in-memory per process.
 */
const _priceIdCache = new Map<string, string>();
export async function resolvePriceIdFromLookupKey(
  client: Stripe,
  lookupKey: string,
): Promise<string> {
  if (_priceIdCache.has(lookupKey)) return _priceIdCache.get(lookupKey)!;

  // If it already looks like a Stripe price ID, pass through
  if (lookupKey.startsWith('price_')) return lookupKey;

  const prices = await client.prices.list({ lookup_keys: [lookupKey], limit: 1, active: true });
  const priceId = prices.data[0]?.id;
  if (!priceId) throw new Error(`Price not found for lookup_key "${lookupKey}"`);
  _priceIdCache.set(lookupKey, priceId);
  return priceId;
}
