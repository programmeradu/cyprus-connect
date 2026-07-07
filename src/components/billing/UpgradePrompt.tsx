"use client";

import { motion } from "framer-motion";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import Link from "next/link";
import { Lock, Zap, Crown } from "lucide-react";
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
      name: "Pro",
      price: "$49/mo",
      icon: Zap,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    enterprise: {
      name: "Enterprise",
      price: "$199/mo",
      icon: Crown,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  };

  const plan = planDetails[requiredPlan];
  const Icon = plan.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center min-h-[400px] p-4"
    >
      <PremiumCard className="max-w-md w-full p-8 text-center">
        {/* Icon */}
        <motion.div
          className={`w-20 h-20 rounded-2xl ${plan.bgColor} flex items-center justify-center mx-auto mb-6`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        >
          <Lock className={`w-10 h-10 ${plan.color}`} />
        </motion.div>

        {/* Title */}
        <motion.h3
          className="text-2xl font-bold mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {feature}
        </motion.h3>

        {/* Description */}
        {description && (
          <motion.p
            className="text-sm text-muted-foreground mb-6 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {description}
          </motion.p>
        )}

        {/* Plan Badge */}
        <motion.div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${plan.bgColor} mb-6`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Icon className={`w-4 h-4 ${plan.color}`} />
          <span className={`text-sm font-semibold ${plan.color}`}>
            {plan.name} Feature
          </span>
        </motion.div>

        {/* Feature List */}
        <motion.div
          className="text-left mb-6 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-xs text-muted-foreground mb-2">
            Upgrade to unlock:
          </div>
          {requiredPlan === "pro" ? (
            <>
              <FeatureItem>Unlimited actions per month</FeatureItem>
              <FeatureItem>1,000 AI credits/month</FeatureItem>
              <FeatureItem>Advanced analytics & insights</FeatureItem>
              <FeatureItem>Up to 5 team members</FeatureItem>
              <FeatureItem>Priority email support</FeatureItem>
            </>
          ) : (
            <>
              <FeatureItem>10,000 AI credits/month</FeatureItem>
              <FeatureItem>Unlimited team members</FeatureItem>
              <FeatureItem>White-label reports</FeatureItem>
              <FeatureItem>Dedicated account manager</FeatureItem>
              <FeatureItem>Custom AI model training</FeatureItem>
            </>
          )}
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
              Upgrade to {plan.name} - {plan.price}
            </PremiumButton>
          </Link>
          <Link href="/app">
            <PremiumButton variant="outline" className="w-full" size="sm">
              Back to Dashboard
            </PremiumButton>
          </Link>
        </motion.div>

        {/* Current Plan */}
        {currentPlan && (
          <p className="text-xs text-muted-foreground mt-4">
            Current plan: <span className="font-medium capitalize">{currentPlan}</span>
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
