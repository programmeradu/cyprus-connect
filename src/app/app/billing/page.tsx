"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { BillingDashboard } from "@/components/billing/BillingDashboard";
import { PricingTable } from "@/components/billing/PricingTable";
import { useSubscription } from "@/hooks/useSubscription";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BillingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { subscription, plan } = useSubscription();
  const [activeTab, setActiveTab] = useState<'overview' | 'plans'>('overview');

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push(`/auth?redirect=${encodeURIComponent('/app/billing')}`);
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Billing & Subscriptions</h1>
              <p className="text-sm text-muted-foreground">
                Manage your subscription, payments, and billing information
              </p>
            </div>
            <PremiumButton
              variant="outline"
              size="sm"
              onClick={() => router.push('/app')}
            >
              ← Back to Dashboard
            </PremiumButton>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'plans'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Plans & Pricing
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' ? (
          <BillingDashboard />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold mb-3">
                Choose Your <span className="gradient-text">Plan</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Unlock powerful sustainability features and scale your impact
              </p>
            </div>
            <PricingTable currentPlanId={subscription?.planId || 'free'} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
