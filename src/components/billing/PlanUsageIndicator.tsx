"use client";

import { useSubscription } from "@/hooks/useSubscription";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";

export const PlanUsageIndicator = () => {
  const t = useTranslations("billing.planUsage");
  const tPlans = useTranslations("billing.planNames");
  const locale = useLocale();
  const { data: session } = useSession();
  const { plan, isLoading } = useSubscription();
  const [aiCreditsUsed, setAiCreditsUsed] = useState<number | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    const token = localStorage.getItem("bearer_token");
    fetch(`/api/users/${session.user.id}/credits`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.aiCreditsRemaining != null) setAiCreditsUsed(d.aiCreditsRemaining);
      })
      .catch(() => {});
  }, [session?.user]);

  if (!session?.user) return null;
  if (isLoading) {
    return (
      <PremiumCard className="p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-24 mb-3" />
        <div className="space-y-3">
          <div className="h-8 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
        </div>
      </PremiumCard>
    );
  }

  const planId = plan?.id || "free";
  const planName = planId === "free" ? tPlans("free") : plan?.name;

  const planColor =
    planId === "enterprise"
      ? "border-primary/60 text-primary"
      : planId === "pro"
        ? "border-primary/60 text-primary"
        : "border-foreground/20 text-muted-foreground";

  // Show AI credits + a couple of headline limits from the plan.
  const aiLimit: number = plan?.limits?.aiCredits ?? 0;
  const isUnlimitedAi = (aiLimit as number) === -1;

  const aiRemaining = aiCreditsUsed ?? 0;
  const aiPct = !isUnlimitedAi && aiLimit > 0 ? Math.max(0, Math.min(100, 100 - (aiRemaining / aiLimit) * 100)) : 0;

  return (
    <PremiumCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">{t("yourPlan")}</h3>
        <div
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-[4px] border text-xs font-medium",
            planColor,
          )}
        >
          <span>{planName}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-muted-foreground font-medium">AI Credits</span>
            <span className="font-mono text-xs font-semibold">
              {isUnlimitedAi ? (
                <span className="text-primary">{t("unlimited")}</span>
              ) : (
                <span
                  className={cn(
                    aiPct > 90 ? "text-destructive" : aiPct > 75 ? "text-orange-500" : "text-foreground",
                  )}
                >
                  {aiRemaining.toLocaleString(locale)}/{aiLimit.toLocaleString(locale)}
                </span>
              )}
            </span>
          </div>
          {!isUnlimitedAi && (
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  aiPct > 90 ? "bg-destructive" : aiPct > 75 ? "bg-orange-500" : "bg-primary",
                )}
                initial={{ width: 0 }}
                animate={{ width: `${aiPct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          )}
        </div>
      </div>

      <Link href="/pricing">
        <motion.button
          className="w-full mt-4 py-2 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-colors border border-transparent hover:border-primary/20"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {planId === "free" ? t("upgradePlan") : t("managePlan")} →
        </motion.button>
      </Link>
    </PremiumCard>
  );
};
