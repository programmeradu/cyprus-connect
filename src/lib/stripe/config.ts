// Client-safe Stripe configuration (no secrets)
// This file can be imported by both client and server code

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
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
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
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
      actionsPerMonth: -1, // unlimited
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
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || '',
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
      teamMembers: -1, // unlimited
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
    priceId: process.env.NEXT_PUBLIC_STRIPE_CREDITS_100_PRICE_ID || '',
  },
  medium: {
    id: 'credits_500',
    credits: 500,
    price: 39.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_CREDITS_500_PRICE_ID || '',
    discount: 20, // 20% off
  },
  large: {
    id: 'credits_1000',
    credits: 1000,
    price: 69.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_CREDITS_1000_PRICE_ID || '',
    discount: 30, // 30% off
  },
} as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;
export type CreditPackageId = keyof typeof CREDIT_PACKAGES;