"use client";
import { getStripeEnvironmentOrSandbox } from "@/lib/stripe/env";

import { PremiumButton } from "@/components/ui/PremiumButton";
import { SUBSCRIPTION_PLANS, CYPRUS_VAT_RATE } from "@/lib/stripe/config";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/hooks/useCurrencyFormatter";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PricingTableProps {
  currentPlanId?: string;
}

export const PricingTable = ({ currentPlanId = "free" }: PricingTableProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const locale = useLocale();
  const isEur = locale === "el";
  const currency = isEur ? "EUR" : "USD";
  const t = useTranslations("billing.pricingTable");

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") {
      toast.info(t("alreadyFree"));
      return;
    }
    if (planId === currentPlanId) {
      toast.info(t("alreadyOnPlan"));
      return;
    }

    try {
      setLoading(planId);
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Stripe-Env": getStripeEnvironmentOrSandbox(),
        },
        body: JSON.stringify({ type: "subscription", planId, currency, locale }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("checkoutFailed"));
      }

      const { url } = await response.json();
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url } }, "*");
      } else {
        window.location.href = url;
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error(error.message || t("subscriptionFailed"));
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    { ...SUBSCRIPTION_PLANS.free, popular: false },
    { ...SUBSCRIPTION_PLANS.pro, popular: true },
    { ...SUBSCRIPTION_PLANS.enterprise, popular: false },
  ];

  return (
    <div className="grid grid-cols-1 gap-px bg-border/60 md:grid-cols-3">
      {plans.map((plan, index) => {
        const isCurrentPlan = plan.id === currentPlanId;
        const isPopular = Boolean((plan as any).popular);
        const planName = t(`planNames.${plan.id as "free" | "pro" | "enterprise"}`);
        const features = t.raw(`features.${plan.id as "free" | "pro" | "enterprise"}`) as string[];
        const intervalLabel = plan.interval
          ? t(`intervals.${plan.interval as "month" | "year"}`)
          : null;
        const displayPrice = isEur ? plan.priceEur : plan.price;
        const priceLabel = formatCurrency(displayPrice, currency, locale);

        return (
          <div
            key={plan.id}
            className={`relative flex flex-col bg-background p-6 sm:p-8 ${
              isPopular ? "md:-my-2 md:bg-muted/20" : ""
            }`}
          >
            {/* Numeric marker */}
            <div className="mb-6 flex items-baseline justify-between">
              <span className="text-xs tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              {isPopular && (
                <span className="eyebrow text-primary">{t("mostPopular")}</span>
              )}
            </div>

            {/* Plan name */}
            <h3
              className="text-2xl leading-none tracking-tight sm:text-3xl"
              style={{ fontFamily: "var(--editorial-serif)", fontWeight: 400 }}
            >
              {planName}
            </h3>

            {/* Price */}
            <div className="mt-6 flex items-baseline gap-1.5">
              <span
                className="text-4xl tabular-nums tracking-tight sm:text-5xl"
                style={{ fontFamily: "var(--editorial-serif)", fontWeight: 400 }}
              >
                {priceLabel}
              </span>
              {intervalLabel && (
                <span className="text-sm text-muted-foreground">/ {intervalLabel}</span>
              )}
            </div>
            {isEur && displayPrice > 0 ? (
              <p className="mt-2 text-[11px] text-muted-foreground/70">
                {t("vatIncluded", { pct: Math.round(CYPRUS_VAT_RATE * 100) })}
              </p>
            ) : (
              <p className="mt-2 text-[11px] text-transparent select-none">.</p>
            )}

            {/* CTA */}
            <div className="mt-6">
              <PremiumButton
                className="h-11 w-full text-sm"
                variant={isPopular ? "primary" : "outline"}
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrentPlan || loading === plan.id}
              >
                {loading === plan.id
                  ? t("processing")
                  : isCurrentPlan
                    ? t("currentPlan")
                    : plan.id === "free"
                      ? t("getStarted")
                      : t("upgradeTo", { plan: planName })}
              </PremiumButton>
            </div>

            {/* Features */}
            <div className="mt-8 border-t border-border/60 pt-6">
              <div className="eyebrow mb-4">Includes</div>
              <ul className="space-y-3">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-baseline gap-3 text-sm leading-relaxed">
                    <span className="shrink-0 tabular-nums text-muted-foreground/60 text-[11px]">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-foreground/85">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
};
