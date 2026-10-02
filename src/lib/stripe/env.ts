/**
 * Payments mode is decided on the server by the Stripe secret key (see
 * `server.ts`). The browser asks `/api/stripe/status` when it needs to show
 * the test-mode banner; it never picks test or live itself.
 */
export type StripeEnv = 'sandbox' | 'live';

export type PaymentsStatus = { configured: boolean; mode: StripeEnv | null };
