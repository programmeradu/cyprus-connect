"use client";

import { useEffect, useState } from 'react';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from '@/lib/stripe/config';
import { useSession } from '@/lib/auth-client';

interface Subscription {
  id: number;
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  planId: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  plan: typeof SUBSCRIPTION_PLANS[SubscriptionPlanId];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { data: session, isPending: isSessionPending } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState(SUBSCRIPTION_PLANS.free);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    // Don't fetch if user is not authenticated
    if (!session?.user) {
      setSubscription(null);
      setPlan(SUBSCRIPTION_PLANS.free);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('bearer_token');
      const { getStripeEnvironmentOrSandbox } = await import('@/lib/stripe/env');
      const response = await fetch('/api/stripe/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Stripe-Env': getStripeEnvironmentOrSandbox(),
        },
      });


      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      setSubscription(data.subscription);
      setPlan(data.plan);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching subscription:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Wait for session to load
    if (isSessionPending) {
      return;
    }

    fetchSubscription();
  }, [session, isSessionPending]);

  // Auto-refetch when page becomes visible (e.g., returning from Stripe checkout)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && session?.user) {
        console.log("🔄 Page visible - refetching subscription data");
        fetchSubscription();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session?.user]);

  return {
    subscription,
    plan,
    isLoading: isLoading || isSessionPending,
    error,
    refetch: fetchSubscription,
  };
}