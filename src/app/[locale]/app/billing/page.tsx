"use client";

import { useState, useEffect } from "react";
import { BillingDashboard } from "@/components/billing/BillingDashboard";
import { PricingTable } from "@/components/billing/PricingTable";
import { AdminStripeTools } from "@/components/billing/AdminStripeTools";
import { PaymentTestModeBanner } from "@/components/billing/PaymentTestModeBanner";
import { useSubscription } from "@/hooks/useSubscription";
import { useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
import { PageShell, PageHeader, PageToolbar, ToolbarTabs, Section } from "@/components/app/console/kit";

export default function BillingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscription } = useSubscription();
  const [activeTab, setActiveTab] = useState<'overview' | 'plans'>('overview');
  const t = useTranslations("dashboard.billing");

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push(`/auth?redirect=${encodeURIComponent('/app/billing')}`);
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const plan = searchParams.get("plan");
    if (plan) {
      setActiveTab("plans");
    }
    if (checkout === "canceled" || checkout === "cancelled") {
      toast.info(t("checkoutCanceled"));
      // Clean query parameter from address bar
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("checkout");
        window.history.replaceState(null, "", url.pathname + (url.search ? url.search : ""));
      }
    }
  }, [searchParams, t]);

  return (
    <PageShell
      loading={isPending}
      header={<PageHeader title={t("title")} purpose={t("subtitle")} />}
      toolbar={
        <PageToolbar>
          <ToolbarTabs
            options={[
              { value: 'overview', label: t("tabOverview") },
              { value: 'plans', label: t("tabPlans") }
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />
        </PageToolbar>
      }
    >
      <PaymentTestModeBanner />
      <AdminStripeTools />

      {activeTab === 'overview' ? (
        <BillingDashboard />
      ) : (
        <Section title={`${t("chooseYour")} ${t("plan")}`} description={t("planSubtitle")}>
          <PricingTable currentPlanId={subscription?.planId || 'free'} />
        </Section>
      )}
    </PageShell>
  );
}
