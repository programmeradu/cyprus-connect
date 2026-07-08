/**
 * Stripe environment resolution — auto-switches between sandbox (preview /
 * localhost) and live (published custom domain) based on the payments
 * client token prefix baked into the build by `enable_stripe_payments`.
 *
 * Client:  `getStripeEnvironment()`  — reads `NEXT_PUBLIC_PAYMENTS_CLIENT_TOKEN`
 *          or `VITE_PAYMENTS_CLIENT_TOKEN` (Vite-generated env file), throws
 *          if neither is present so the UI fails loudly rather than silently
 *          routing to live.
 * Server:  `resolveStripeEnvFromRequest(headers)` — reads the `X-Stripe-Env`
 *          request header sent by the client; falls back to sandbox for
 *          webhook / cron callers that don't set it (webhook has its own
 *          `?env=` query param resolution).
 */

export type StripeEnv = 'sandbox' | 'live';

function getClientToken(): string | undefined {
  // Next.js exposes NEXT_PUBLIC_* to the browser; the payments enable step
  // also writes VITE_PAYMENTS_CLIENT_TOKEN for Vite-based stacks. We accept
  // both so the same code works if the app is later ported.
  const t =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PAYMENTS_CLIENT_TOKEN) ||
    (typeof process !== 'undefined' && process.env?.VITE_PAYMENTS_CLIENT_TOKEN);
  return t && t.length > 0 ? t : undefined;
}

export function getStripeEnvironment(): StripeEnv {
  const token = getClientToken();
  if (token?.startsWith('pk_test_')) return 'sandbox';
  if (token?.startsWith('pk_live_')) return 'live';
  // Missing / unknown token — do NOT default to 'live'. The published build
  // was shipped before Stripe go-live finished, or the env file wasn't
  // regenerated. Fail loudly at the call site.
  throw new Error(
    'Payments are not configured for this build. Complete Stripe go-live in your Lovable project to enable checkout.',
  );
}

/** Safe variant: returns 'sandbox' instead of throwing when the token is missing. */
export function getStripeEnvironmentOrSandbox(): StripeEnv {
  try {
    return getStripeEnvironment();
  } catch {
    return 'sandbox';
  }
}

/**
 * Read the `X-Stripe-Env` header set by the client. Falls back to sandbox
 * so admin / cron / test callers without the header don't crash.
 */
export function resolveStripeEnvFromRequest(req: { headers: Headers }): StripeEnv {
  const raw = req.headers.get('x-stripe-env')?.toLowerCase();
  return raw === 'live' ? 'live' : 'sandbox';
}
