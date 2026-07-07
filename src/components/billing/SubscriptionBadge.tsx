"use client";

import { useCustomer } from "autumn-js/react";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import Link from "next/link";

export const SubscriptionBadge = () => {
  const { data: session, isPending: isSessionPending } = useSession();
  const { customer, isLoading } = useCustomer();

  // Don't render if user is not authenticated
  if (isSessionPending || !session?.user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="h-7 w-16 bg-muted/50 animate-pulse rounded-full" />
    );
  }

  // Prioritize subscriptions over one-time credit purchases
  const subscription = customer?.products?.find(p => {
    const name = p.name?.toLowerCase() || '';
    return name.includes('pro') || name.includes('enterprise') || name.includes('subscription');
  });
  
  const currentPlan = subscription || customer?.products?.at(-1);
  const planName = currentPlan?.name || "Free";
  const planId = currentPlan?.id || "free";

  const getBadgeColor = () => {
    switch (planId) {
      case 'professional':
      case 'enterprise':
        return 'border-primary text-primary';
      default:
        return 'border-muted-foreground/50 text-muted-foreground';
    }
  };

  const getBadgeIcon = () => {
    switch (planId) {
      case 'professional':
        return '⭐';
      case 'enterprise':
        return '👑';
      default:
        return '🌱';
    }
  };

  return (
    <Link href="/pricing">
      <motion.div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border bg-transparent ${getBadgeColor()} text-xs font-semibold cursor-pointer transition-all hover:bg-accent/50`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        whileHover={{ y: -1 }}
      >
        <span>{getBadgeIcon()}</span>
        <span>{planName}</span>
      </motion.div>
    </Link>
  );
};