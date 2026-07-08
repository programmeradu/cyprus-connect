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
  if (isLoading) return <div className="h-7 w-16 bg-muted/50 animate-pulse rounded-full" />;

  const planId = plan?.id || "free";
  const planName = planId === "free" ? tPlans("free") : plan?.name;

  const badgeColor =
    planId === "pro" || planId === "enterprise"
      ? "border-primary text-primary"
      : "border-muted-foreground/50 text-muted-foreground";
  const badgeIcon = planId === "enterprise" ? "👑" : planId === "pro" ? "⭐" : "🌱";

  return (
    <Link href="/pricing">
      <motion.div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border bg-transparent ${badgeColor} text-xs font-semibold cursor-pointer transition-all hover:bg-accent/50`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        whileHover={{ y: -1 }}
      >
        <span>{badgeIcon}</span>
        <span>{planName}</span>
      </motion.div>
    </Link>
  );
};
