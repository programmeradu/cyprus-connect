"use client";

import { useSubscription } from './useSubscription';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/config';

type FeatureKey = keyof typeof SUBSCRIPTION_PLANS.free.limits;

export function useFeatureAccess(feature: FeatureKey): {
  hasAccess: boolean;
  limit: number | boolean;
  isLoading: boolean;
  planName: string;
} {
  const { plan, isLoading } = useSubscription();

  const limit = plan.limits[feature];
  const hasAccess = limit === -1 || limit === true || (typeof limit === 'number' && limit > 0);

  return {
    hasAccess,
    limit,
    isLoading,
    planName: plan.name,
  };
}

export function useFeatureLimit(feature: FeatureKey): {
  limit: number;
  isUnlimited: boolean;
  isLoading: boolean;
} {
  const { plan, isLoading } = useSubscription();

  const limit = plan.limits[feature];
  const numericLimit = typeof limit === 'number' ? limit : 0;
  const isUnlimited = numericLimit === -1;

  return {
    limit: numericLimit,
    isUnlimited,
    isLoading,
  };
}
