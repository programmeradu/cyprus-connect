"use client";
import { getStripeEnvironmentOrSandbox } from "@/lib/stripe/env";


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
  // Vuneli is Cyprus-only: every plan is billed in EUR, in both locales.
  const isEur = true;
  const currency = "EUR";

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
            <div className="mb-6 flex items-baseline justify-between gap-4">
              <span
                aria-hidden
                className="font-[family-name:var(--editorial-display)] text-[1.15rem] italic leading-none tracking-[-0.03em] text-foreground/30"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              {isPopular && (
                <span className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-foreground/70">
                  {t("mostPopular")}
                </span>
              )}
            </div>

            {/* Plan name */}
            <h3 className="font-[family-name:var(--editorial-display)] text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[2.1rem]">
              {planName}
            </h3>

            {/* Price */}
            <div className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-[family-name:var(--editorial-display)] text-[2.5rem] font-semibold tabular-nums leading-none tracking-[-0.03em] sm:text-[3rem]">
                {priceLabel}
              </span>
              {intervalLabel && (
                <span className="text-[14.5px] font-medium text-foreground/60">/ {intervalLabel}</span>
              )}
            </div>
            {isEur && displayPrice > 0 ? (
              <p className="mt-2 text-[13.5px] font-medium text-foreground/55">
                {t("vatIncluded", { pct: Math.round(CYPRUS_VAT_RATE * 100) })}
              </p>
            ) : (
              <p className="mt-2 select-none text-[13.5px] text-transparent">.</p>
            )}

            {/* CTA */}
            <div className="mt-7">
              <button
                type="button"
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrentPlan || loading === plan.id}
                className={[
                  "inline-flex h-11 w-full items-center justify-center rounded-full px-6 text-[15px] font-semibold tracking-[-0.01em] transition-transform disabled:cursor-not-allowed disabled:opacity-55",
                  isPopular
                    ? "bg-[var(--accent-lime)] text-[var(--accent-lime-foreground)] shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--accent-lime)_55%,transparent)] hover:scale-[1.02] disabled:hover:scale-100"
                    : "border border-foreground/25 text-foreground hover:border-foreground",
                ].join(" ")}
              >
                {loading === plan.id
                  ? t("processing")
                  : isCurrentPlan
                    ? t("currentPlan")
                    : plan.id === "free"
                      ? t("getStarted")
                      : t("upgradeTo", { plan: planName })}
              </button>
            </div>

            {/* Features */}
            <div className="mt-8 border-t border-border/60 pt-6">
              <div className="mb-4 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-foreground/60">
                {locale === "el" ? "Περιλαμβάνει" : "Includes"}
              </div>

              <ul className="space-y-3.5">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-baseline gap-3 text-[15px] leading-[1.55]">
                    <span aria-hidden className="shrink-0 text-[12.5px] font-semibold tabular-nums text-foreground/35">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-foreground/80">{feature}</span>
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
