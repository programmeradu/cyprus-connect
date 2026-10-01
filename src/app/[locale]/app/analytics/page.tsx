"use client";

import { useEffect, useState } from "react";
import { QA_ACCOUNT, isQaClient } from "@/lib/qa-bypass";
import { LiveInsights } from "@/components/app/console/LiveInsights";
import { useTranslations } from "next-intl";
import { ExportReportButton } from "@/components/app/ExportReportButton";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useWorkspaceResource } from "@/components/app/console/workspace-store";
import {
  PageShell,
  PageHeader,
  Section,
  DataTable,
  Metric,
  MetricRow,
  Empty
} from "@/components/app/console/kit";
import { APP_OPEN_ACCESS } from "@/lib/open-access";

interface AnalyticsData {
  metrics: {
    totalEmissions: { value: number; change: number | null };
    energy: { value: number; change: number | null };
    water: { value: number; change: number | null };
    waste: { value: number; change: number | null };
  };
  emissionsBreakdown: {
    electricity: { value: number; percentage: number };
    gas: { value: number; percentage: number };
    transportation: { value: number; percentage: number };
    other: { value: number; percentage: number };
  } | null;
  monthlyTrend: Array<{ month: string; value: number; change: number | null }>;
  industryComparison: {
    yourPerformance: number;
    industryAverage: number;
    betterBy: number;
  } | null;
  currentPeriod: { month: number; year: number } | null;
}

export default function AnalyticsPage() {
  const t = useTranslations("dashboard.analytics");
  const tc = useTranslations("common");
  const { data: session, isPending } = useSession();
  const router = useRouter();
  // Preview QA mode: the server already accepts the test identity.
  const [qa, setQa] = useState(false);
  useEffect(() => setQa(isQaClient()), []);
  const userId = session?.user?.id ?? (qa ? QA_ACCOUNT.id : null);
  const signedIn = Boolean(session?.user) || qa;

  // Shared records: the same copies the dashboard and settings read.
  const analytics = useWorkspaceResource<{ data: AnalyticsData }>(
    userId ? `/api/analytics?userId=${encodeURIComponent(userId)}` : null,
  );
  const analyticsData = analytics.data?.data ?? null;
  // No line at all when there is no same month last year (never a fake 0%).
  const yoyDelta = (change: number | null) =>
    change === null
      ? {}
      : {
          delta: t("yoy", { value: `${change > 0 ? "+" : ""}${change.toFixed(1)}` }),
          deltaTone: (change < 0 ? "positive" : change > 0 ? "negative" : "neutral") as "positive" | "negative" | "neutral",
        };

  useEffect(() => {
    if (!isPending && !session?.user && !isQaClient()) {
      if (!APP_OPEN_ACCESS) router.push("/auth?redirect=" + encodeURIComponent(window.location.pathname));
    }
  }, [session, isPending, router]);

  const refreshing = analytics.refreshing;
  const handleRefresh = () => {
    analytics.reload();
  };

  const breakdownRows = analyticsData?.emissionsBreakdown
    ? [
        { label: t("electricity"), ...analyticsData.emissionsBreakdown.electricity },
        { label: t("naturalGas"), ...analyticsData.emissionsBreakdown.gas },
        { label: t("transportation"), ...analyticsData.emissionsBreakdown.transportation },
        { label: t("other"), ...analyticsData.emissionsBreakdown.other }
      ]
    : [];

  return (
    <PageShell
      signedOut={!qa && !isPending && !signedIn}
      loading={(!qa && isPending) || analytics.loading}
      error={!qa && isPending ? null : analytics.error}
      onRetry={handleRefresh}
      header={
        <PageHeader
          title={t("title")}
          purpose={t("subtitle")}
          actions={
            <>
              <button type="button" onClick={handleRefresh} disabled={refreshing} className="vck-btn">
                {refreshing ? tc("refreshing") : tc("refresh")}
              </button>
              <ExportReportButton
                userId={userId ?? undefined}
                analyticsData={analyticsData}
                companyName={session?.user?.name || "Pilot Enterprise"}
              />
            </>
          }
        />
      }
    >
      {analyticsData && (
        <>
          <Section title={t("latestMonth")}>
            <MetricRow>
              <Metric
                label={t("totalEmissions")}
                value={analyticsData.metrics.totalEmissions.value.toFixed(2)}
                unit={t("tonsPerYear")}
                {...yoyDelta(analyticsData.metrics.totalEmissions.change)}
              />
              <Metric
                label={t("energy")}
                value={analyticsData.metrics.energy.value.toFixed(2)}
                unit={t("tonsPerYear")}
                {...yoyDelta(analyticsData.metrics.energy.change)}
              />
              <Metric
                label={t("water")}
                value={analyticsData.metrics.water.value.toFixed(2)}
                unit={t("tonsPerYear")}
                {...yoyDelta(analyticsData.metrics.water.change)}
              />
              <Metric
                label={t("waste")}
                value={analyticsData.metrics.waste.value.toFixed(2)}
                unit={t("tonsPerYear")}
                {...yoyDelta(analyticsData.metrics.waste.change)}
              />
            </MetricRow>
          </Section>

          <Section title={t("byCategory")}>
            <DataTable
              columns={[
                { key: "label", header: t("x.category"), render: (r) => r.label },
                { key: "pct", header: t("x.share"), numeric: true, render: (r) => `${r.percentage.toFixed(0)}%` }
              ]}
              rows={breakdownRows}
              rowKey={(r) => r.label}
              empty={<Empty title={t("x.noBreakdown")} body={t("noBreakdown")} />}
            />
          </Section>

          <Section title={t("benchmarking")}>
            {analyticsData.industryComparison ? (
              <MetricRow columns={3}>
                <Metric label={t("yourPerformance")} value={analyticsData.industryComparison.yourPerformance.toFixed(1)} unit={t("tonsPerMonth")} />
                <Metric label={t("industryAverage")} value={analyticsData.industryComparison.industryAverage.toFixed(1)} unit={t("tonsPerMonth")} />
                <Metric
                  label={t("betterBy")}
                  value={`${Math.abs(analyticsData.industryComparison.betterBy).toFixed(0)}%`}
                  note={analyticsData.industryComparison.betterBy > 0 ? t("belowAverage") : t("aboveAverage")}
                />
              </MetricRow>
            ) : (
              <Empty title={t("x.noIndustry")} body={t("profilePrompt")} />
            )}
          </Section>

          <LiveInsights />
        </>
      )}
    </PageShell>
  );
}
