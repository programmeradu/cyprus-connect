"use client";

import { useSubscription } from "@/hooks/useSubscription";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";

export const SubscriptionBadge = () => {
  const tPlans = useTranslations("billing.planNames");
  const { data: session, isPending: isSessionPending } = useSession();
  const { plan, isLoading } = useSubscription();

  if (isSessionPending || !session?.user) return null;
  if (isLoading) return <div className="h-7 w-16 bg-muted/50 animate-pulse rounded-[4px]" />;

  const planId = plan?.id || "free";
  const planName = planId === "free" ? tPlans("free") : plan?.name;

  const badgeColor =
    planId === "pro" || planId === "enterprise"
      ? "border-primary/60 text-primary"
      : "border-foreground/20 text-muted-foreground";
  // Plan-tier emoji is an approved exception (see mem://design/logos-and-assets).
  const badgeIcon = planId === "enterprise" ? "👑" : planId === "pro" ? "⭐" : "🌱";

  return (
    <Link href="/pricing">
      <motion.div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border bg-transparent ${badgeColor} text-xs font-medium cursor-pointer transition-colors hover:bg-muted/50`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <span aria-hidden>{badgeIcon}</span>
        <span>{planName}</span>
      </motion.div>
    </Link>
  );
};
