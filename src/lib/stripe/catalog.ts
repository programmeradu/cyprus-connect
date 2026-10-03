// Creates or updates Vuneli's Stripe products and prices. Idempotent: finds
// products by metadata and prices by lookup key. Used by scripts/stripe-setup.ts
// and the admin "set up prices" action.
import type Stripe from 'stripe';
import { CREDIT_PACKAGES, SUBSCRIPTION_PLANS } from './config';

const SAAS = 'txcd_10103001'; // Software as a service, business use

type PriceSpec = { lookupKey: string; amountCents: number; interval?: 'month' | 'year'; nickname: string };
type ProductSpec = { id: string; name: string; description: string; prices: PriceSpec[] };

const cents = (eur: number) => Math.round(eur * 100);

export const CATALOG: ProductSpec[] = [
  ...(['pro', 'enterprise'] as const).map((id) => {
    const p = SUBSCRIPTION_PLANS[id];
    return {
      id: `vuneli_${id}`,
      name: `Vuneli ${p.name}`,
      description: p.features.join(' · '),
      prices: [
        { lookupKey: p.lookupKeys.month, amountCents: cents(p.priceEur), interval: 'month' as const, nickname: `${p.name} monthly` },
        { lookupKey: p.lookupKeys.year, amountCents: cents(p.priceYearEur), interval: 'year' as const, nickname: `${p.name} yearly` },
      ],
    };
  }),
  ...Object.values(CREDIT_PACKAGES).map((c) => ({
    id: `vuneli_${c.id}`,
    name: `${c.credits.toLocaleString('en')} AI credits`,
    description: 'One-off AI credits for Verde and the agents.',
    prices: [{ lookupKey: c.lookupKey, amountCents: cents(c.priceEur), nickname: `${c.credits} credits` }],
  })),
];

export async function syncStripeCatalog(stripe: Stripe, log: (line: string) => void = () => {}): Promise<void> {
  const products = CATALOG;
  for (const spec of products) {
    const found = await stripe.products.search({ query: `metadata['vuneli_id']:'${spec.id}'`, limit: 1 });
    let product = found.data[0];
    if (!product) {
      product = await stripe.products.create({ name: spec.name, description: spec.description, tax_code: SAAS, metadata: { vuneli_id: spec.id } });
      log(`+ product ${spec.id}`);
    } else {
      await stripe.products.update(product.id, { name: spec.name, description: spec.description, tax_code: SAAS });
      log(`= product ${spec.id}`);
    }

    for (const price of spec.prices) {
      const existing = (await stripe.prices.list({ lookup_keys: [price.lookupKey], limit: 1 })).data[0];
      const same =
        existing &&
        existing.unit_amount === price.amountCents &&
        existing.currency === 'eur' &&
        (existing.recurring?.interval ?? undefined) === price.interval &&
        existing.tax_behavior === 'inclusive';
      if (same) {
        log(`  = ${price.lookupKey}`);
        continue;
      }
      await stripe.prices.create({
        product: product.id,
        currency: 'eur',
        unit_amount: price.amountCents,
        tax_behavior: 'inclusive', // shown prices include VAT
        nickname: price.nickname,
        lookup_key: price.lookupKey,
        transfer_lookup_key: true,
        ...(price.interval ? { recurring: { interval: price.interval } } : {}),
      });
      if (existing) await stripe.prices.update(existing.id, { active: false });
      log(`  + ${price.lookupKey} (${(price.amountCents / 100).toFixed(2)} EUR${price.interval ? ` / ${price.interval}` : ''})`);
    }
  }
}
