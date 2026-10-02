// Client-safe Stripe configuration (no secrets).
// Imported by both browser and server code.
//
// Every plan lists only what the product does today. Feature wording lives
// in messages/{en,el}.json under billing.pricingTable.features; the English
// copy below must match it (tests/stripe-billing.test.ts checks this and
// rejects promises of things that are not built).

// Cyprus VAT (standard rate). Stripe Tax applies it at checkout; this
// constant is only for the "incl. 19% VAT" hint, never for charging.
export const CYPRUS_VAT_RATE = 0.19;

export type BillingInterval = 'month' | 'year';

/** Yearly price = 10 x monthly (two months free). */
export const YEARLY_MONTHS_CHARGED = 10;

// Prices are gross EUR (VAT included). Lookup keys are stable names that
// exist in both test and live Stripe (created by scripts/stripe-setup.ts).
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceEur: 0,
    priceYearEur: 0,
    lookupKeys: null,
    interval: null,
    features: [
      'Footprint from the bills you upload or forward by email',
      'Legal deadlines that apply to your business',
      'Verde, your copilot, with 100 AI credits a month',
      'Up to 10 agent actions a month',
    ],
    limits: {
      actionsPerMonth: 10,
      teamMembers: 1,
      integrations: 0,
      apiCalls: 100,
      aiCredits: 100,
      documentUploads: 5,
      customReports: false,
      advancedAnalytics: false,
      prioritySupport: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 45,
    priceEur: 45,
    priceYearEur: 45 * YEARLY_MONTHS_CHARGED,
    lookupKeys: { month: 'pro_monthly_eur', year: 'pro_yearly_eur' },
    interval: 'month',
    features: [
      'Everything in Free',
      'Unlimited agent actions',
      '1,000 AI credits a month',
      'Board Summary and report PDFs anyone can verify',
      'Supplier list with EU sanctions screening',
      'Funding calls matched to your business',
      'Priority email support',
    ],
    limits: {
      actionsPerMonth: -1,
      teamMembers: 5,
      integrations: 3,
      apiCalls: 10000,
      aiCredits: 1000,
      documentUploads: 50,
      customReports: true,
      advancedAnalytics: true,
      prioritySupport: false,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 185,
    priceEur: 185,
    priceYearEur: 185 * YEARLY_MONTHS_CHARGED,
    lookupKeys: { month: 'enterprise_monthly_eur', year: 'enterprise_yearly_eur' },
    interval: 'month',
    features: [
      'Everything in Pro',
      '10,000 AI credits a month',
      'CBAM reports with official EU values',
      'Pay by invoice and bank transfer',
      'Set-up help from the Vuneli team',
    ],
    limits: {
      actionsPerMonth: -1,
      teamMembers: -1,
      integrations: -1,
      apiCalls: 100000,
      aiCredits: 10000,
      documentUploads: -1,
      customReports: true,
      advancedAnalytics: true,
      prioritySupport: true,
    },
  },
} as const;

// One-time AI credit packs (EUR, VAT included).
export const CREDIT_PACKAGES = {
  small: { id: 'credits_100', credits: 100, price: 8.99, priceEur: 8.99, lookupKey: 'credits_100_eur' },
  medium: { id: 'credits_500', credits: 500, price: 35.99, priceEur: 35.99, lookupKey: 'credits_500_eur', discount: 20 },
  large: { id: 'credits_1000', credits: 1000, price: 62.99, priceEur: 62.99, lookupKey: 'credits_1000_eur', discount: 30 },
} as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;
export type PaidPlanId = Exclude<SubscriptionPlanId, 'free'>;
export type CreditPackageId = keyof typeof CREDIT_PACKAGES;

export function lookupKeyFor(planId: PaidPlanId, interval: BillingInterval): string {
  return SUBSCRIPTION_PLANS[planId].lookupKeys[interval];
}

/** Pure: lookup key -> plan + interval. Unknown keys map to free. */
export function planFromLookupKey(lookupKey?: string | null): { planId: SubscriptionPlanId; interval: BillingInterval | null } {
  for (const id of ['pro', 'enterprise'] as const) {
    const keys = SUBSCRIPTION_PLANS[id].lookupKeys;
    if (lookupKey === keys.month) return { planId: id, interval: 'month' };
    if (lookupKey === keys.year) return { planId: id, interval: 'year' };
  }
  // Older keys from the first integration (e.g. "pro_monthly_usd").
  if (lookupKey?.startsWith('pro_')) return { planId: 'pro', interval: lookupKey.includes('year') ? 'year' : 'month' };
  if (lookupKey?.startsWith('enterprise_')) return { planId: 'enterprise', interval: lookupKey.includes('year') ? 'year' : 'month' };
  return { planId: 'free', interval: null };
}

export function priceFor(planId: SubscriptionPlanId, interval: BillingInterval): number {
  const p = SUBSCRIPTION_PLANS[planId];
  return interval === 'year' ? p.priceYearEur : p.priceEur;
}
