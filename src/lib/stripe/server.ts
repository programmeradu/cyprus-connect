// Server-only Stripe client for Vuneli's own Stripe account.
//
// One secret key (`STRIPE_SECRET_KEY`, set in Cloudflare) decides everything:
// `sk_test_…` / `rk_test_…` is test mode, `sk_live_…` / `rk_live_…` is live.
// The browser never chooses the mode. Webhooks are checked with
// `STRIPE_WEBHOOK_SECRET` using Web Crypto, so it runs on Workers.
import Stripe from 'stripe';

export const STRIPE_API_VERSION = '2025-12-15.clover' as const;

export type StripeEnv = 'sandbox' | 'live';

function getEnv(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v && v.length > 0 ? v : undefined;
}

/** Pure, exported for tests: which mode a secret key belongs to. */
export function stripeModeFromKey(key: string | undefined): StripeEnv | null {
  if (!key) return null;
  if (/^(sk|rk)_live_/.test(key)) return 'live';
  if (/^(sk|rk)_test_/.test(key)) return 'sandbox';
  return null;
}

export function isStripeConfigured(): boolean {
  return stripeModeFromKey(getEnv('STRIPE_SECRET_KEY')) !== null;
}

/** Mode of the configured key, or null when Stripe is not set up yet. */
export function currentStripeMode(): StripeEnv | null {
  return stripeModeFromKey(getEnv('STRIPE_SECRET_KEY'));
}

export class StripeNotConfiguredError extends Error {
  constructor() {
    super('Payments are not switched on yet.');
    this.name = 'StripeNotConfiguredError';
  }
}

export function createStripeClient(): Stripe {
  const key = getEnv('STRIPE_SECRET_KEY');
  if (!stripeModeFromKey(key)) throw new StripeNotConfiguredError();
  return new Stripe(key!, {
    apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion,
    typescript: true,
    httpClient: Stripe.createFetchHttpClient(),
  });
}

/** Pure, exported for tests: parse a `Stripe-Signature` header. */
export function parseSignatureHeader(header: string): { timestamp?: string; v1: string[] } {
  let timestamp: string | undefined;
  const v1: string[] = [];
  for (const part of header.split(',')) {
    const [key, value] = part.trim().split('=', 2);
    if (key === 't') timestamp = value;
    if (key === 'v1' && value) v1.push(value);
  }
  return { timestamp, v1 };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signed), (b) => b.toString(16).padStart(2, '0')).join('');
}

export type StripeWebhookEvent = {
  id: string;
  type: string;
  livemode?: boolean;
  data: { object: any };
};

/**
 * Pure core of webhook verification, exported for tests. Accepts every `v1`
 * signature in the header (Stripe sends several while a secret is rolled).
 */
export async function verifyStripeSignature(
  body: string,
  header: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
): Promise<StripeWebhookEvent> {
  if (!header || !body) throw new Error('Missing signature or body');
  const { timestamp, v1 } = parseSignatureHeader(header);
  if (!timestamp || v1.length === 0) throw new Error('Invalid signature format');
  if (Math.abs(nowSeconds - Number(timestamp)) > toleranceSeconds) {
    throw new Error('Webhook timestamp outside tolerance');
  }
  const expected = await hmacSha256Hex(secret, `${timestamp}.${body}`);
  if (!v1.some((sig) => timingSafeEqualHex(sig, expected))) {
    throw new Error('Invalid webhook signature');
  }
  return JSON.parse(body) as StripeWebhookEvent;
}

export async function verifyWebhook(req: Request): Promise<StripeWebhookEvent> {
  const secret = getEnv('STRIPE_WEBHOOK_SECRET');
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  const body = await req.text();
  return verifyStripeSignature(body, req.headers.get('stripe-signature'), secret);
}

export function getStripeErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as { raw?: { message?: string }; message?: string };
    const msg = e.raw?.message ?? e.message;
    if (msg) return msg;
  }
  return 'Stripe request failed';
}

/**
 * Resolve a stable price name (lookup key, e.g. "pro_monthly_eur") to the
 * Stripe price id. Cached per process; the key is the same in test and live.
 */
const _priceIdCache = new Map<string, string>();
export async function resolvePriceIdFromLookupKey(client: Stripe, lookupKey: string): Promise<string> {
  const cacheKey = `${currentStripeMode()}:${lookupKey}`;
  const hit = _priceIdCache.get(cacheKey);
  if (hit) return hit;
  const prices = await client.prices.list({ lookup_keys: [lookupKey], limit: 1, active: true });
  const priceId = prices.data[0]?.id;
  if (!priceId) throw new Error(`Price not found for lookup_key "${lookupKey}". Run scripts/stripe-setup.ts.`);
  _priceIdCache.set(cacheKey, priceId);
  return priceId;
}
