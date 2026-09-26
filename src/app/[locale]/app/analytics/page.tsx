"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { ExportReportButton } from "@/components/app/ExportReportButton";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useWorkspaceResource, workspaceRequest } from "@/components/app/console/workspace-store";
import {
  PageShell,
  PageHeader,
  Section,
  DataTable,
  Metric,
  MetricRow,
  Empty,
  AiUnavailable
} from "@/components/app/console/kit";
import { APP_OPEN_ACCESS } from "@/lib/open-access";

interface AnalyticsData {
  metrics: {
    totalEmissions: { value: number; change: number };
    energy: { value: number; change: number };
    water: { value: number; change: number };
    waste: { value: number; change: number };
  };
  emissionsBreakdown: {
    electricity: { value: number; percentage: number };
    gas: { value: number; percentage: number };
    transportation: { value: number; percentage: number };
    other: { value: number; percentage: number };
  } | null;
  monthlyTrend: Array<{ month: string; value: number; change: number }>;
  industryComparison: {
    yourPerformance: number;
    industryAverage: number;
    betterBy: number;
  } | null;
  currentPeriod: { month: number; year: number } | null;
}

interface AIInsights {
  observations: string[];
  recommendations: string[];
  highlights: string[];
  risks: string[];
}

export default function AnalyticsPage() {
  const t = useTranslations("dashboard.analytics");
  const tc = useTranslations("common");
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const userId = session?.user?.id ?? null;

  // Shared records: the same copies the dashboard and settings read.
  const analytics = useWorkspaceResource<{ data: AnalyticsData }>(
    userId ? `/api/analytics?userId=${encodeURIComponent(userId)}` : null,
  );
  const profile = useWorkspaceResource<Record<string, unknown>>(userId ? `/api/users/${userId}` : null);
  const analyticsData = analytics.data?.data ?? null;

  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth?redirect=" + encodeURIComponent(window.location.pathname));
    }
  }, [session, isPending, router]);

  const fetchAIInsights = useCallback(
    async (data: AnalyticsData) => {
      setAiLoading(true);
      setAiError(false);
      try {
        const p = profile.data ?? {};
        const res = await workspaceRequest<{ insights: AIInsights }>("/api/analytics/insights", {
          method: "POST",
          body: {
            metricsData: data.metrics,
            emissionsBreakdown: data.emissionsBreakdown,
            monthlyTrend: data.monthlyTrend,
            industryComparison: data.industryComparison,
            userProfile: {
              companyName: typeof p.companyName === "string" ? p.companyName : undefined,
              companyIndustry: typeof p.companyIndustry === "string" ? p.companyIndustry : undefined,
              teamSize: typeof p.teamSize === "string" || typeof p.teamSize === "number" ? p.teamSize : undefined,
            },
          },
        });
        setAiInsights(res.insights);
      } catch {
        setAiError(true);
      } finally {
        setAiLoading(false);
      }
    },
    [profile.data],
  );

  // Ask for insights once per fresh copy of the numbers (and once the profile is known).
  const insightsFor = useRef<AnalyticsData | null>(null);
  useEffect(() => {
    if (!analyticsData || profile.loading || insightsFor.current === analyticsData) return;
    insightsFor.current = analyticsData;
    void fetchAIInsights(analyticsData);
  }, [analyticsData, profile.loading, fetchAIInsights]);

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
      signedOut={!isPending && !session?.user}
      loading={isPending || analytics.loading}
      error={isPending ? null : analytics.error}
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
                userId={session?.user?.id}
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
          <Section title={t("title")}>
            <MetricRow>
              <Metric
                label={t("totalEmissions")}
                value={analyticsData.metrics.totalEmissions.value.toFixed(1)}
                unit={t("tonsPerYear")}
                delta={t("yoy", { value: analyticsData.metrics.totalEmissions.change.toFixed(1) })}
                deltaTone={analyticsData.metrics.totalEmissions.change < 0 ? "positive" : "negative"}
              />
              <Metric
                label={t("energy")}
                value={analyticsData.metrics.energy.value.toFixed(1)}
                unit={t("tonsPerYear")}
                delta={t("yoy", { value: analyticsData.metrics.energy.change.toFixed(1) })}
                deltaTone={analyticsData.metrics.energy.change < 0 ? "positive" : "negative"}
              />
              <Metric
                label={t("water")}
                value={analyticsData.metrics.water.value.toFixed(1)}
                unit={t("tonsPerYear")}
                delta={t("yoy", { value: analyticsData.metrics.water.change.toFixed(1) })}
                deltaTone={analyticsData.metrics.water.change < 0 ? "positive" : "negative"}
              />
              <Metric
                label={t("waste")}
                value={analyticsData.metrics.waste.value.toFixed(1)}
                unit={t("tonsPerYear")}
                delta={t("yoy", { value: analyticsData.metrics.waste.change.toFixed(1) })}
                deltaTone={analyticsData.metrics.waste.change < 0 ? "positive" : "negative"}
              />
            </MetricRow>
          </Section>

          <Section title={t("byCategory")}>
            <DataTable
              columns={[
                { key: "label", header: "Category", render: (r) => r.label },
                { key: "pct", header: "Share", numeric: true, render: (r) => `${r.percentage.toFixed(0)}%` }
              ]}
              rows={breakdownRows}
              rowKey={(r) => r.label}
              empty={<Empty title="No breakdown available yet" body={t("noBreakdown")} />}
            />
          </Section>

          <Section title={t("monthlyTrend")}>
            <DataTable
              columns={[
                { key: "month", header: "Month", render: (r) => r.month },
                { key: "value", header: "Emissions", numeric: true, render: (r) => t("tons", { value: r.value.toFixed(1) }) },
                {
                  key: "change",
                  header: "Change",
                  numeric: true,
                  render: (r) => (
                    <span className="vck-tag" data-tone={r.change < 0 ? "positive" : "caution"}>
                      {r.change > 0 ? "+" : ""}
                      {r.change.toFixed(1)}%
                    </span>
                  )
                }
              ]}
              rows={analyticsData.monthlyTrend.slice(0, 6)}
              rowKey={(r) => r.month}
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
              <Empty title="Industry comparison not available yet" body={t("profilePrompt")} />
            )}
          </Section>

          <Section title={t("aiTitle")}>
            {aiError ? (
              <AiUnavailable feature="generate AI insights for this analysis" onRetry={() => fetchAIInsights(analyticsData)} />
            ) : aiInsights ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="vck-label mb-3">{t("topRecommendations")}</h3>
                  <ul className="space-y-2">
                    {aiInsights.recommendations.slice(0, 3).map((rec, index) => (
                      <li key={index} className="vck-inset px-3 py-2.5 text-sm break-words">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="vck-label mb-3">{t("keyHighlights")}</h3>
                  <ul className="space-y-2">
                    {aiInsights.highlights.map((highlight, index) => (
                      <li key={index} className="vck-inset px-3 py-2.5 text-sm break-words">
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : aiLoading ? (
              <Empty title="Generating insights" body="Vuneli is analyzing your latest metrics for observations and recommendations." />
            ) : (
              <Empty title="No insights yet" body="Insights are generated automatically once analytics data is available." />
            )}
          </Section>
        </>
      )}
    </PageShell>
  );
}
