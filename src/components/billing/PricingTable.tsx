"use client";

import { motion } from "framer-motion";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe/config";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PricingTableProps {
  currentPlanId?: string;
}

export const PricingTable = ({ currentPlanId = 'free' }: PricingTableProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      toast.info('You are already on the free plan');
      return;
    }

    if (planId === currentPlanId) {
      toast.info('You are already on this plan');
      return;
    }

    try {
      setLoading(planId);
      const token = localStorage.getItem('bearer_token');

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'subscription',
          planId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Handle iframe compatibility
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url } }, "*");
      } else {
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to start subscription');
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    { ...SUBSCRIPTION_PLANS.free, icon: FreeIcon },
    { ...SUBSCRIPTION_PLANS.pro, icon: ProIcon, popular: true },
    { ...SUBSCRIPTION_PLANS.enterprise, icon: EnterpriseIcon },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-4 max-w-6xl mx-auto">
      {plans.map((plan, index) => {
        const Icon = plan.icon;
        const isCurrentPlan = plan.id === currentPlanId;
        const isPopular = 'popular' in plan && Boolean((plan as any).popular);

        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {isPopular && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-primary text-primary-foreground px-3 py-0.5 rounded-full text-[10px] font-semibold shadow-md">
                  Most Popular
                </div>
              </div>
            )}

            <PremiumCard className={`h-full p-4 ${isPopular ? 'ring-1 ring-primary shadow-lg' : ''}`}>
              {/* Icon */}
              <div className="mb-3">
                <div className="w-8 h-8 rounded-lg border border-border/50 inline-flex items-center justify-center">
                  <Icon />
                </div>
              </div>

              {/* Plan Name */}
              <h3 className="text-base font-bold mb-1.5">{plan.name}</h3>

              {/* Price */}
              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">${plan.price}</span>
                  {plan.interval && (
                    <span className="text-muted-foreground text-xs">/{plan.interval}</span>
                  )}
                </div>
              </div>

              {/* CTA Button */}
              <PremiumButton
                className="w-full mb-3 text-xs py-1.5 h-auto"
                variant={isPopular ? "primary" : "outline"}
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrentPlan || loading === plan.id}
              >
                {loading === plan.id ? (
                  'Processing...'
                ) : isCurrentPlan ? (
                  'Current Plan'
                ) : plan.id === 'free' ? (
                  'Get Started'
                ) : (
                  `Upgrade to ${plan.name}`
                )}
              </PremiumButton>

              {/* Features */}
              <div className="space-y-1.5">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckIcon />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </PremiumCard>
          </motion.div>
        );
      })}
    </div>
  );
};

// Thin, Transparent Custom SVG Icons
const FreeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-foreground/60">
    <path
      d="M12 3 L6 7 L6 17 L12 21 L18 17 L18 7 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="12"
      r="2"
      fill="currentColor"
      opacity="0.5"
    />
  </svg>
);

const ProIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-foreground/60">
    <circle
      cx="12"
      cy="12"
      r="8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M12 6 L15 10 L20 12 L15 14 L12 18 L9 14 L4 12 L9 10 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="12"
      r="1.5"
      fill="currentColor"
      opacity="0.5"
    />
  </svg>
);

const EnterpriseIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-foreground/60">
    <rect
      x="5"
      y="7"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      rx="2"
    />
    <circle
      cx="12"
      cy="14"
      r="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M12 3 L13 6 L12 7 L11 6 Z"
      fill="currentColor"
      opacity="0.5"
    />
    <circle cx="8" cy="11" r="0.5" fill="currentColor" opacity="0.5" />
    <circle cx="16" cy="11" r="0.5" fill="currentColor" opacity="0.5" />
    <circle cx="12" cy="18" r="0.5" fill="currentColor" opacity="0.5" />
  </svg>
);

const CheckIcon = () => (
  <svg
    className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);