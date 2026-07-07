"use client";

import { useCustomer } from "autumn-js/react";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Sparkles, TrendingUp, Zap } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

export const PlanUsageIndicator = () => {
  const t = useTranslations("billing.planUsage");
  const tPlans = useTranslations("billing.planNames");
  const locale = useLocale();
  const { data: session } = useSession();
  const { customer, isLoading } = useCustomer();


  if (!session?.user) {
    return null;
  }

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

  const currentPlan = customer?.products?.at(-1);
  const planId = currentPlan?.id || "free";
  const planName = currentPlan?.name || tPlans("free");
  const features = customer?.features || {};


  // Get icon based on plan
  const getPlanIcon = () => {
    switch (planId) {
      case 'professional':
        return <Zap className="h-4 w-4 text-primary" />;
      case 'enterprise':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPlanColor = () => {
    switch (planId) {
      case 'professional':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'enterprise':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <PremiumCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">{t("yourPlan")}</h3>
        <motion.div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium",
            getPlanColor()
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {getPlanIcon()}
          <span>{planName}</span>
        </motion.div>
      </div>

      <div className="space-y-3">
        {Object.entries(features).map(([featureId, feature]: [string, any]) => {
          const hasLimit = typeof feature.included_usage === 'number' && feature.included_usage !== -1;
          const usage = feature.usage || 0;
          const limit = feature.included_usage;
          const isUnlimited = limit === -1;
          const percentage = hasLimit ? Math.min(100, (usage / limit) * 100) : 0;

          // Format feature name from ID
          const featureName = featureId
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          return (
            <motion.div
              key={featureId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-muted-foreground font-medium">
                  {featureName}
                </span>
                <span className="font-mono text-xs font-semibold">
                  {isUnlimited ? (
                    <span className="text-primary">{t("unlimited")}</span>
                  ) : hasLimit ? (
                    <span className={cn(
                      percentage > 90 ? "text-destructive" :
                      percentage > 75 ? "text-orange-500" : "text-foreground"
                    )}>
                      {usage.toLocaleString(locale)}/{limit.toLocaleString(locale)}
                    </span>
                  ) : (
                    <span className="text-primary">{t("enabled")}</span>
                  )}

                </span>
              </div>

              {hasLimit && (
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      percentage > 90 ? "bg-destructive" :
                      percentage > 75 ? "bg-orange-500" : "bg-primary"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              )}

              {hasLimit && feature.next_reset_at && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Resets {new Date(feature.next_reset_at).toLocaleDateString()}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      <Link href="/pricing">
        <motion.button
          className="w-full mt-4 py-2 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-colors border border-transparent hover:border-primary/20"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {planId === 'free' ? 'Upgrade Plan' : 'Manage Plan'} →
        </motion.button>
      </Link>
    </PremiumCard>
  );
};
