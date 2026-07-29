"use client";

import { useState, useEffect } from "react";
import { BillingDashboard } from "@/components/billing/BillingDashboard";
import { PricingTable } from "@/components/billing/PricingTable";
import { PaymentTestModeBanner } from "@/components/billing/PaymentTestModeBanner";
import { useSubscription } from "@/hooks/useSubscription";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
import { PageShell, PageHeader, PageToolbar, ToolbarTabs, Section } from "@/components/app/shell";

export default function BillingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { subscription } = useSubscription();
  const [activeTab, setActiveTab] = useState<'overview' | 'plans'>('overview');
  const t = useTranslations("dashboard.billing");

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push(`/auth?redirect=${encodeURIComponent('/app/billing')}`);
    }
  }, [session, isPending, router]);

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
