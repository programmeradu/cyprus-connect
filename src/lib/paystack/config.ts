export const PAYSTACK_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    amount: 0,
    paystackPlanCode: null,
    interval: null,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    amount: 4900,
    paystackPlanCode: process.env.NEXT_PUBLIC_PAYSTACK_PRO_PLAN_CODE || '',
    interval: 'monthly',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    amount: 19900,
    paystackPlanCode: process.env.NEXT_PUBLIC_PAYSTACK_ENTERPRISE_PLAN_CODE || '',
    interval: 'monthly',
  },
} as const;

export const PAYSTACK_CREDIT_PACKAGES = {
  small: {
    id: 'credits_100',
    credits: 100,
    amount: 999,
  },
  medium: {
    id: 'credits_500',
    credits: 500,
    amount: 3999,
    discount: 20,
  },
  large: {
    id: 'credits_1000',
    credits: 1000,
    amount: 6999,
    discount: 30,
  },
} as const;

export type PaystackPlanId = keyof typeof PAYSTACK_PLANS;
export type PaystackCreditPackageId = keyof typeof PAYSTACK_CREDIT_PACKAGES;
