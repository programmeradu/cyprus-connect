"use client";

import { motion } from "framer-motion";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface UpgradePromptProps {
  feature: string;
  description?: string;
  requiredPlan: "pro" | "enterprise";
  currentPlan?: string;
}

export const UpgradePrompt = ({
  feature,
  description,
  requiredPlan,
  currentPlan = "free",
}: UpgradePromptProps) => {
  const t = useTranslations("billing.upgradePrompt");
  const tPlans = useTranslations("billing.planNames");

  const planDetails = {
    pro: {
      name: tPlans("professional"),
      price: "$49/mo",
    },
    enterprise: {
      name: tPlans("enterprise"),
      price: "$199/mo",
    },
  };


  const plan = planDetails[requiredPlan];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center min-h-[400px] p-4"
    >
      <PremiumCard className="max-w-md w-full p-8 text-center">
        {/* Eyebrow */}
        <p className="eyebrow mb-3">
          {t("planFeature", { name: plan.name })}
        </p>

        {/* Title */}
        <motion.h3
          className="text-2xl font-semibold mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{ fontFamily: 'var(--editorial-display)', letterSpacing: '-0.02em' }}
        >
          {feature}
        </motion.h3>

        {/* Description */}
        {description && (
          <motion.p
            className="text-sm text-muted-foreground mb-6 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            {description}
          </motion.p>
        )}

        {/* Feature List */}
        <motion.div
          className="text-left mb-6 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-xs text-muted-foreground mb-2">
            {t("upgradeToUnlock")}
          </div>
          {(t.raw(requiredPlan === "pro" ? "proFeatures" : "enterpriseFeatures") as string[]).map((f) => (
            <FeatureItem key={f}>{f}</FeatureItem>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Link href="/pricing">
            <PremiumButton className="w-full" size="sm">
              {t("upgradeCta", { name: plan.name, price: plan.price })}
            </PremiumButton>
          </Link>
          <Link href="/app">
            <PremiumButton variant="outline" className="w-full" size="sm">
              {t("backToDashboard")}
            </PremiumButton>
          </Link>
        </motion.div>

        {/* Current Plan */}
        {currentPlan && (
          <p className="text-xs text-muted-foreground mt-4">
            {t("currentPlan")} <span className="font-medium capitalize">{currentPlan}</span>
          </p>
        )}

      </PremiumCard>
    </motion.div>
  );
};

const FeatureItem = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 text-xs">
    <svg
      className="w-3.5 h-3.5 text-primary flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M5 13l4 4L19 7"
      />
    </svg>
    <span className="text-muted-foreground">{children}</span>
  </div>
);
