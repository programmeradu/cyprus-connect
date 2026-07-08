// Client-safe Stripe configuration (no secrets)
// This file can be imported by both client and server code

// Cyprus VAT (standard rate, 2026). Applied automatically by Stripe Tax
// when the customer's billing country is CY. The constant is exported for
// UI-side "incl. 19% VAT" hints only — never for computing charges.
export const CYPRUS_VAT_RATE = 0.19;

// Subscription Plans Configuration.
// Prices are gross EUR for the EU (Cyprus-based merchant) and gross USD
// for the rest of the world. Stripe Tax computes VAT from the billing
// address at checkout; the shown prices are tax-inclusive for EU customers.
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceEur: 0,
    priceId: null,
    priceIdEur: null,
    interval: null,
    features: [
      'Basic carbon calculator',
      'Up to 10 actions per month',
      'Monthly sustainability reports',
      'Email support',
      '100 AI credits/month',
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
    price: 49,
    priceEur: 45,
    // Stable lookup_keys created in Lovable Payments (test + live parity)
    priceId: 'pro_monthly_usd',
    priceIdEur: 'pro_monthly_eur',
    interval: 'month',
    features: [
      'Everything in Free',
      'Unlimited actions',
      'Advanced carbon analytics',
      'Weekly sustainability insights',
      'Priority email support',
      '1,000 AI credits/month',
      'Up to 5 team members',
      '3 integrations (QuickBooks, Xero, etc.)',
      'Custom branded reports',
      'API access',
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
    price: 199,
    priceEur: 185,
    priceId: 'enterprise_monthly_usd',
    priceIdEur: 'enterprise_monthly_eur',
    interval: 'month',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Unlimited integrations',
      'White-label reports',
      'Dedicated account manager',
      'Custom AI model training',
      'SLA guarantee (99.9% uptime)',
      '10,000 AI credits/month',
      'Advanced compliance tools',
      'API rate limit: 100k/day',
      'SSO & advanced security',
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

// Credit packages for one-time purchases
export const CREDIT_PACKAGES = {
  small: {
    id: 'credits_100',
    credits: 100,
    price: 9.99,
    priceEur: 8.99,
    priceId: 'credits_100_usd',
    priceIdEur: 'credits_100_eur',
  },
  medium: {
    id: 'credits_500',
    credits: 500,
    price: 39.99,
    priceEur: 35.99,
    priceId: 'credits_500_usd',
    priceIdEur: 'credits_500_eur',
    discount: 20,
  },
  large: {
    id: 'credits_1000',
    credits: 1000,
    price: 69.99,
    priceEur: 62.99,
    priceId: 'credits_1000_usd',
    priceIdEur: 'credits_1000_eur',
    discount: 30,
  },

} as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;
export type CreditPackageId = keyof typeof CREDIT_PACKAGES;

/**
 * Resolve which Stripe currency variant to charge based on the requested
 * currency. EUR prices are used for EU/Cyprus checkouts (Stripe Tax then
 * layers 19% VAT for CY customers); USD is the default elsewhere.
 */
export function resolveStripeVariant(currency?: string): 'eur' | 'usd' {
  return (currency || '').toUpperCase() === 'EUR' ? 'eur' : 'usd';
}
