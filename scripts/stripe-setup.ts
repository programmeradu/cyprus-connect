/**
 * Creates Vuneli's products and prices in Stripe (safe to re-run).
 *   STRIPE_SECRET_KEY=sk_test_... bun scripts/stripe-setup.ts
 * Or, once deployed, an admin can POST /api/admin/billing/setup-prices.
 */
import Stripe from 'stripe';
import { syncStripeCatalog } from '../src/lib/stripe/catalog';

async function main() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || !/^(sk|rk)_(test|live)_/.test(key)) throw new Error('Set STRIPE_SECRET_KEY to a Stripe secret key.');
  console.log(`Stripe ${key.includes('_live_') ? 'LIVE' : 'test'} mode`);
  await syncStripeCatalog(new Stripe(key), (l) => console.log(l));
  console.log('Done.');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
