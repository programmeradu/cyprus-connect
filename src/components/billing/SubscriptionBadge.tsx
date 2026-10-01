"use client";

import { useSubscription } from "@/hooks/useSubscription";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";

/** `overHero`: the header sits on the always-dark hero photo, so use light glass. */
export const SubscriptionBadge = ({ overHero = false }: { overHero?: boolean }) => {
  const tPlans = useTranslations("billing.planNames");
  const { data: session, isPending: isSessionPending } = useSession();
  const { plan, isLoading } = useSubscription();

  if (isSessionPending || !session?.user) return null;
  if (isLoading) return <div className="h-9 w-20 bg-background/70 backdrop-blur-xl animate-pulse rounded-full" />;

  const planId = plan?.id || "free";
  const planName = planId === "free" ? tPlans("free") : plan?.name;

  const badgeColor = overHero
    ? "border-white/25 bg-white/12 text-white hover:bg-white/20 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.6)]"
    : "border-foreground/15 bg-background/85 text-foreground hover:bg-background shadow-[0_10px_30px_-14px_rgba(0,0,0,0.35)]";
  // Plan-tier emoji is an approved exception (see mem://design/logos-and-assets).
  const badgeIcon = planId === "enterprise" ? "👑" : planId === "pro" ? "⭐" : "🌱";

  return (
    <Link href="/pricing">
      <motion.div
        className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 backdrop-blur-xl backdrop-saturate-150 ${badgeColor} text-[13px] font-semibold cursor-pointer transition-colors duration-300`}
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
