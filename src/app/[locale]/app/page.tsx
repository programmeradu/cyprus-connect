"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { EnergyCostCalculator } from "@/components/app/EnergyCostCalculator";
import { BenchmarkComparator } from "@/components/app/BenchmarkComparator";
import { ComplianceChecker } from "@/components/app/ComplianceChecker";
import { formatDate, formatRelativeTime } from "@/lib/timezone-formatter";
import { useSubscription } from "@/hooks/useSubscription";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
import {
  PageShell,
  PageHeader,
  Section,
  DataTable,
  EmptyState
} from "@/components/app/shell";
import {
  ConsoleOverview,
  type OverviewDeadline
} from "@/components/app/dashboard/ConsoleOverview";

/** EU obligations that apply to a Cyprus SME. Past dates are filtered out. */
const EU_DEADLINES: OverviewDeadline[] = [
  { label: "CBAM definitive declaration (FY2026)", date: "2027-05-31", detail: "Importers of steel, cement, aluminium and fertiliser." },
  { label: "CSRD wave 3 first report", date: "2027-01-01", detail: "Listed SMEs report on financial year 2026." },
  { label: "VSME voluntary disclosure", date: "2026-12-31", detail: "Requested by banks and large customers." }
];


interface DashboardMetric {
  metricType: string;
  currentValue: number;
  previousValue: number;
  trendPercentage: number;
  periodStart: string;
  periodEnd: string;
  updatedAt: string;
}

interface HistoricalData {
  year: number;
  month: number;
  totalCo2e: number;
  renewablePercentage: number;
  efficiencyScore: number;
  wasteDiversionRate: number;
  electricityKwh: number;
  monthLabel: string;
  trend?: string;
  changePercentage?: number;
}

interface ComparisonData {
  overall_grade: string;
  overall_percentile: number;
  user_metrics: {
    carbon_footprint?: { value: number; percentile: number; grade: string };
    renewable_share?: { value: number; percentile: number; grade: string };
    waste_diversion?: { value: number; percentile: number; grade: string };
  };
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  impact: string;
  effort: string;
  timeframe: string;
}

interface ActionData {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  credits_reward: number;
  is_completed?: boolean;
  created_at?: string;
}

interface CreditsData {
  total_credits: number;
  weekly_credits: number;
}

interface LeaderboardData {
  rank: number;
  total_users: number;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard.home");
  const { data: session, isPending } = useSession();
  const { user: contextUser, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { plan, isLoading: isCustomerLoading } = useSubscription();
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [creditsData, setCreditsData] = useState<CreditsData | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [completedActions, setCompletedActions] = useState<ActionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Get user's timezone for date formatting
  const userTimezone = contextUser?.timezone || 'UTC';

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth");
    }
  }, [session, isPending, router]);

  // Unified onboarding check and data loading
  useEffect(() => {
    if (isPending || isUserLoading) {
      return;
    }

    if (!session?.user?.id) {
      // TEMPORARY open access: no session, so stop the loading state and
      // render the dashboard shell with empty data instead of spinning.
      if (APP_OPEN_ACCESS) setIsLoading(false);
      return;
    }


    if (!hasCheckedOnboarding) {
      if (!contextUser || !contextUser.onboardingCompleted) {
        if (!APP_OPEN_ACCESS) router.push("/app/onboarding");
        return;
      }
      
      setHasCheckedOnboarding(true);
      loadDashboardData(session.user.id);
    }
  }, [session?.user?.id, contextUser, isUserLoading, isPending, router, hasCheckedOnboarding]);

  // Auto-refresh dashboard when page becomes visible (e.g., returning from calculator)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && session?.user?.id && hasCheckedOnboarding) {
        loadDashboardData(session.user.id);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session?.user?.id, hasCheckedOnboarding]);

  const loadDashboardData = async (userId: string) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const token = localStorage.getItem("bearer_token");
      const headers = {
 "Authorization": `Bearer ${token}`,
 "Content-Type": "application/json"
      };

      await Promise.all([
        loadDashboardMetrics(userId, headers),
        loadHistoricalData(userId, headers),
        loadComparisonData(userId, headers),
        loadSuggestions(userId, headers),
        loadCreditsData(userId, headers),
        loadLeaderboardData(userId, headers),
        loadCompletedActions(userId, headers)
      ]);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setLoadError("The dashboard could not be refreshed. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardMetrics = async (uid: string, headers: HeadersInit) => {
    try {
      const response = await fetch(`/api/dashboard/metrics?userId=${uid}`, { headers });
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics || []);
      }
    } catch (error) {
      console.error("Failed to load dashboard metrics:", error);
    }
  };

  const loadHistoricalData = async (uid: string, headers: HeadersInit) => {
    try {
      const response = await fetch(`/api/dashboard/historical?userId=${uid}&months=6`, { headers });
      if (response.ok) {
        const data = await response.json();
        setHistoricalData(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load historical data:", error);
    }
  };

  const loadComparisonData = async (uid: string, headers: HeadersInit) => {
    try {
      const response = await fetch(`/api/dashboard/comparison?userId=${uid}`, { headers });
      if (response.ok) {
        const data = await response.json();
        setComparisonData(data);
      }
    } catch (error) {
      console.error("Failed to load comparison data:", error);
    }
  };

  const loadSuggestions = async (uid: string, headers: HeadersInit) => {
    try {
      const response = await fetch(`/api/dashboard/suggestions?userId=${uid}`, { headers });
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    }
  };

  const loadCreditsData = async (uid: string, headers: HeadersInit) => {
    try {
      const response = await fetch(`/api/credits/${uid}`, { headers });
      if (response.ok) {
        const data = await response.json();
        setCreditsData(data);
      }
    } catch (error) {
      console.error("Failed to load credits data:", error);
    }
  };

  const loadLeaderboardData = async (uid: string, headers: HeadersInit) => {
    try {
      const response = await fetch(`/api/leaderboard/${uid}/rank`, { headers });
      if (response.ok) {
        const data = await response.json();
        setLeaderboardData(data);
      }
    } catch (error) {
      console.error("Failed to load leaderboard data:", error);
    }
  };

  const loadCompletedActions = async (uid: string, headers: HeadersInit) => {
    try {
      const response = await fetch(`/api/actions/user/${uid}`, { headers });
      if (response.ok) {
        const data = await response.json();
        const completed = data.filter((action: ActionData) => action.is_completed);
        setCompletedActions(completed.slice(0, 2));
      }
    } catch (error) {
      console.error("Failed to load completed actions:", error);
    }
  };

  // Get metric values from real data
  const getMetricValue = (metricType: string): number => {
    const metric = metrics.find(m => m.metricType === metricType);
    return metric?.currentValue ?? 0;
  };

  const getMetricTrend = (metricType: string): number => {
    const metric = metrics.find(m => m.metricType === metricType);
    return metric?.trendPercentage ?? 0;
  };

  // Get plan info for badge
  const planName = plan?.id && plan.id !== 'free' ? plan.name : t("freePlan");

  if (!isPending && !session?.user) {
    return null;
  }

  const carbonFootprint = getMetricValue('carbon_footprint');
  const resourceEfficiency = getMetricValue('resource_efficiency');
  const renewableShare = getMetricValue('renewable_share');
  const wasteDiversion = getMetricValue('waste_diversion');

  const carbonTrend = getMetricTrend('carbon_footprint');
  const efficiencyTrend = getMetricTrend('resource_efficiency');
  const renewableTrend = getMetricTrend('renewable_share');

  // Console series: monthly readings, oldest to newest.
  const overviewHistory = historicalData
    .slice(0, 12)
    .reverse()
    .map((record) => ({
      label: record.monthLabel,
      carbon: Number(record.totalCo2e) || 0,
      electricity: Number(record.electricityKwh) || 0,
      renewable: Number(record.renewablePercentage) || 0,
      efficiency: Number(record.efficiencyScore) || 0
    }));




  const peerRows = comparisonData
    ? [
        { label: t("totalCarbonFootprint"), percentile: comparisonData.user_metrics.carbon_footprint?.percentile },
        { label: t("renewableShare"), percentile: comparisonData.user_metrics.renewable_share?.percentile },
        { label: t("wasteDiversion"), percentile: comparisonData.user_metrics.waste_diversion?.percentile },
        { label: t("peerComparison"), percentile: comparisonData.overall_percentile }
      ]
    : [];

  return (
    <PageShell
      loading={
        APP_OPEN_ACCESS && !session?.user
          ? false
          : isPending || isUserLoading || isLoading
      }

      error={loadError}
      onRetry={() => session?.user?.id && loadDashboardData(session.user.id)}
      header={
        <PageHeader
          title={t("title")}
          purpose={t("subtitleRealtime")}
          meta={formatDate(new Date(), { timezone: userTimezone, includeTime: true })}
          actions={
            <>
              {!isCustomerLoading && <span className="app-tag">{planName}</span>}
              <Link href="/app/analytics" className="app-btn-ghost app-btn">
                {t("reports")}
              </Link>
              <Link href="/app/settings" className="app-btn-ghost app-btn">
                {t("settings")}
              </Link>
            </>
          }
        />
      }
    >
      <ConsoleOverview
        greeting={
          contextUser?.name
            ? `Hello, ${contextUser.name.split(" ")[0]}.`
            : "Hello."
        }
        subline={
          overviewHistory.length > 1
            ? "This is where your footprint stands today, month by month."
            : "Log one electricity bill in the calculator and this console fills in."
        }
        history={overviewHistory}
        current={{
          carbon: carbonFootprint,
          carbonTrend,
          electricity: overviewHistory.at(-1)?.electricity ?? 0,
          renewable: renewableShare,
          renewableTrend,
          efficiency: resourceEfficiency,
          efficiencyTrend,
          waste: wasteDiversion
        }}
        grid={{
          value: 610,
          unit: "gCO₂/kWh",
          renewables: 24,
          source: "Cyprus grid mix, EAC transmission data."
        }}
        peers={peerRows}
        peerNote={
          leaderboardData
            ? t("rankLine", {
                rank: leaderboardData.rank ?? "-",
                total: leaderboardData.total_users ?? "-"
              })
            : undefined
        }
        deadlines={EU_DEADLINES}
        labels={{
          carbon: t("totalCarbonFootprint"),
          electricity: "Electricity used",
          renewables: t("renewableShare"),
          efficiency: t("resourceEfficiency"),
          waste: t("wasteDiversion"),
          grid: "Cyprus grid intensity",
          peers: t("peerComparison"),
          horizon: "Regulatory horizon",
          monthly: "Footprint by month",
          noDeadlines: "No obligation falls inside the next 18 months.",
          noSeries: "Log a second month of data to draw the series.",
          noPeers:
            "Run the calculator for a couple of months to compare against similar Cyprus SMEs.",
          daysLeft: (days: number) => (days === 0 ? "Due today" : `${days} days`)
        }}
      />


      <Section title={t("advancedAnalytics")} description={t("advancedAnalyticsSub")}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <EnergyCostCalculator />
          <BenchmarkComparator />
          <ComplianceChecker />
        </div>
      </Section>

      <Section title={t("recentInitiatives")}>
        <DataTable
          columns={[
            { key: "title", header: "Initiative", render: (r: ActionData) => r.title },
            {
              key: "when",
              header: "Completed",
              render: (r: ActionData) => (r.created_at ? formatRelativeTime(r.created_at, userTimezone) : t("recentlyCompleted"))
            }
          ]}
          rows={completedActions}
          rowKey={(r) => r.id}
          empty={
            <EmptyState
              title={t("noInitiatives")}
              description={t("startInitiatives")}
              action={{ label: t("viewAllInitiatives"), href: "/app/actions" }}
            />
          }
        />
        {completedActions.length > 0 && (
          <div className="mt-3">
            <Link href="/app/actions" className="app-btn-ghost app-btn">
              {t("viewAllInitiatives")}
            </Link>
          </div>
        )}
      </Section>

      <Section title={t("personalizedSuggestions")}>
        <DataTable
          columns={[
            { key: "title", header: "Suggestion", render: (r: Suggestion) => r.title },
            {
              key: "priority",
              header: "Priority",
              render: (r: Suggestion) => (
                <span className="app-tag" data-tone={r.priority === "critical" ? "critical" : r.priority === "high" ? "caution" : undefined}>
                  {["critical", "high", "medium", "low"].includes(r.priority) ? t(`priority.${r.priority}` as any) : r.priority}
                </span>
              )
            }
          ]}
          rows={suggestions.slice(0, 3)}
          rowKey={(r) => r.id}
          empty={
            <EmptyState
              title={t("noSuggestions")}
              description="Log a few weeks of consumption data in the calculator and personalized suggestions will appear here."
              action={{ label: t("exploreRecommendations"), href: "/app/actions" }}
            />
          }
        />
        {suggestions.length > 0 && (
          <div className="mt-3">
            <Link href="/app/actions" className="app-btn">
              {t("exploreRecommendations")}
            </Link>
          </div>
        )}
      </Section>
    </PageShell>
  );
}
