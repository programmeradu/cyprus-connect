"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ExportReportButton } from "@/components/app/ExportReportButton";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PageShell,
  PageHeader,
  Section,
  DataTable,
  Metric,
  MetricRow,
  EmptyState,
  AiUnavailable
} from "@/components/app/shell";
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth?redirect=" + encodeURIComponent(window.location.pathname));
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchAnalyticsData();
    }
  }, [session?.user?.id]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Fetch analytics data
      const analyticsResponse = await fetch(`/api/analytics?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
      });

      if (!analyticsResponse.ok) {
        const errorData = await analyticsResponse.json();
        throw new Error(errorData.error || "Failed to fetch analytics data");
      }

      const analyticsResult = await analyticsResponse.json();
      setAnalyticsData(analyticsResult.data);

      // Fetch AI insights
      fetchAIInsights(analyticsResult.data);
    } catch (error: any) {
      console.error("Failed to fetch analytics data:", error);
      setError(error.message || t("loadFailed"));
      toast.error(t("toastFailed"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAIInsights = async (data: AnalyticsData) => {
    try {
      setAiLoading(true);
      setAiError(false);

      const userId = session?.user?.id;
      if (!userId) return;

      // Fetch user profile
      const userResponse = await fetch(`/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
      });

      let userProfile = {};
      if (userResponse.ok) {
        userProfile = await userResponse.json();
      }

      const insightsResponse = await fetch("/api/analytics/insights", {
        method: "POST",
        headers: {
 "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          metricsData: data.metrics,
          emissionsBreakdown: data.emissionsBreakdown,
          monthlyTrend: data.monthlyTrend,
          industryComparison: data.industryComparison,
          userProfile,
        }),
      });

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setAiInsights(insightsData.insights);
      } else {
        setAiError(true);
      }
    } catch (error) {
      console.error("Failed to fetch AI insights:", error);
      setAiError(true);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalyticsData();
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
      loading={loading || isPending}
      error={!loading && !isPending ? error : null}
      onRetry={handleRefresh}
      header={
        <PageHeader
          title={t("title")}
          purpose={t("subtitle")}
          actions={
            <>
              <button type="button" onClick={handleRefresh} disabled={refreshing} className="app-btn-ghost app-btn">
                {refreshing ? tc("refreshing") : tc("refresh")}
              </button>
              {session?.user?.id && <ExportReportButton userId={session.user.id} />}
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
              empty={<EmptyState title="No breakdown available yet" description={t("noBreakdown")} />}
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
                    <span className="app-tag" data-tone={r.change < 0 ? "positive" : "caution"}>
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
              <EmptyState title="Industry comparison not available yet" description={t("profilePrompt")} />
            )}
          </Section>

          <Section title={t("aiTitle")}>
            {aiError ? (
              <AiUnavailable feature="generate AI insights for this analysis" onRetry={() => fetchAIInsights(analyticsData)} />
            ) : aiInsights ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="app-label mb-3">{t("topRecommendations")}</h3>
                  <ul className="space-y-2">
                    {aiInsights.recommendations.slice(0, 3).map((rec, index) => (
                      <li key={index} className="app-card-inset px-3 py-2.5 text-sm break-words">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="app-label mb-3">{t("keyHighlights")}</h3>
                  <ul className="space-y-2">
                    {aiInsights.highlights.map((highlight, index) => (
                      <li key={index} className="app-card-inset px-3 py-2.5 text-sm break-words">
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : aiLoading ? (
              <EmptyState title="Generating insights" description="Vuneli is analyzing your latest metrics for observations and recommendations." />
            ) : (
              <EmptyState title="No insights yet" description="Insights are generated automatically once analytics data is available." />
            )}
          </Section>
        </>
      )}
    </PageShell>
  );
}
