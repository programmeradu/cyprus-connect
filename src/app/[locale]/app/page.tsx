"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/app/AppHeader";
import { Loader2, TrendingDown, TrendingUp, Zap, Droplet, Recycle, Leaf, Battery, ChevronDown } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import Link from "next/link";
import { EnergyCostCalculator } from "@/components/app/EnergyCostCalculator";
import { BenchmarkComparator } from "@/components/app/BenchmarkComparator";
import { ComplianceChecker } from "@/components/app/ComplianceChecker";
import { formatDate, formatRelativeTime } from "@/lib/timezone-formatter";
import { useSubscription } from "@/hooks/useSubscription";
import { Sparkles, Crown, Zap as ZapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

  // Get user's timezone for date formatting
  const userTimezone = contextUser?.timezone || 'UTC';

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/auth");
    }
  }, [session, isPending, router]);

  // Unified onboarding check and data loading
  useEffect(() => {
    if (isPending || isUserLoading) {
      return;
    }

    if (!session?.user?.id) {
      return;
    }

    if (!hasCheckedOnboarding) {
      if (!contextUser || !contextUser.onboardingCompleted) {
        router.push("/app/onboarding");
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
        console.log("🔄 Page visible again, refreshing dashboard data...");
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

  if (isPending || isUserLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const carbonFootprint = getMetricValue('carbon_footprint');
  const resourceEfficiency = getMetricValue('resource_efficiency');
  const renewableShare = getMetricValue('renewable_share');
  const wasteDiversion = getMetricValue('waste_diversion');

  const carbonTrend = getMetricTrend('carbon_footprint');
  const efficiencyTrend = getMetricTrend('resource_efficiency');
  const renewableTrend = getMetricTrend('renewable_share');

  // Transform historical data for chart (reverse to show oldest to newest)
  const chartData = historicalData.slice(0, 6).reverse().map(record => ({
    year: `${record.monthLabel}`,
    renewable: record.renewablePercentage,
    target: 0
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitleRealtime")} • {formatDate(new Date(), { timezone: userTimezone, includeTime: true })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Plan Badge */}
          {!isCustomerLoading && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/50 bg-transparent text-xs font-medium text-muted-foreground">
              <Leaf className="w-3 h-3" />
              <span>{planName}</span>
            </div>
          )}
          <Link href="/app/analytics">
            <PremiumButton variant="outline" size="sm" className="text-xs">
              {t("reports")}
              <ChevronDown className="w-3 h-3 ml-1" />
            </PremiumButton>
          </Link>
          <Link href="/app/settings">
            <PremiumButton variant="outline" size="sm" className="text-xs">
              {t("settings")}
            </PremiumButton>
          </Link>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Carbon Footprint */}
        <motion.div
          className="surface-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{t("totalCarbonFootprint")}</p>
              <p className="text-2xl font-bold">
                {carbonFootprint > 0 ? carbonFootprint.toFixed(1) : '0'} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span>
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-1 text-[10px] ${carbonTrend < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} mb-3`}>
            {carbonTrend < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            <span className="font-medium">{t("sinceLastPeriod", { value: Math.abs(carbonTrend).toFixed(1) })}</span>
          </div>
          {/* Mini line chart */}
          <svg viewBox="0 0 200 40" className="w-full h-8 opacity-60">
            <polyline
              points={historicalData.slice(0, 6).reverse().map((d, i) => 
                `${i * 40},${40 - (d.totalCo2e / carbonFootprint) * 20}`
              ).join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary"
            />
          </svg>
        </motion.div>

        {/* Resource Efficiency */}
        <motion.div
          className="surface-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <p className="text-xs font-medium text-muted-foreground mb-2">{t("resourceEfficiency")}</p>
          <p className="text-2xl font-bold mb-3">
            {resourceEfficiency > 0 ? resourceEfficiency.toFixed(0) : '0'}<span className="text-sm font-normal text-muted-foreground">%</span>
          </p>
          
          {/* Circular progress */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-muted/20"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - resourceEfficiency / 100)}`}
                  className="text-primary transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold">{resourceEfficiency.toFixed(0)}%</span>
              </div>
            </div>
            <div className={`flex items-center gap-1 text-[10px] ${efficiencyTrend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {efficiencyTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="font-medium">{t("change", { value: Math.abs(efficiencyTrend).toFixed(1) })}</span>
            </div>
          </div>
        </motion.div>

        {/* Renewable Energy */}
        <motion.div
          className="surface-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-xs font-medium text-muted-foreground mb-2">{t("renewableShare")}</p>
          <p className="text-2xl font-bold mb-3">{renewableShare.toFixed(0)}%</p>
          
          <div className="flex items-center justify-center mb-3">
            <div className="relative w-12 h-16">
              <Battery className="w-12 h-16 text-muted/30" />
              <div
                className="absolute bottom-1 left-1.5 right-1.5 bg-primary rounded-b transition-all duration-1000"
                style={{ height: `${Math.min(renewableShare * 0.85, 85)}%` }}
              />
            </div>
          </div>
          
          <div className={`flex items-center justify-center gap-1 text-[10px] ${renewableTrend > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
            {renewableTrend > 0 && <TrendingUp className="w-3 h-3" />}
            <span className="font-medium">{renewableTrend > 0 ? `+${renewableTrend.toFixed(1)}%` : t("renewableGoal")}</span>
          </div>
        </motion.div>

        {/* Waste Diversion */}
        <motion.div
          className="surface-card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p className="text-xs font-medium text-muted-foreground mb-2">{t("wasteDiversion")}</p>
          <p className="text-2xl font-bold mb-3">{wasteDiversion.toFixed(0)}%</p>
          
          <div className="flex items-center justify-center mb-3">
            <Recycle className="w-12 h-12 text-primary" />
          </div>
          
          <p className="text-[10px] text-muted-foreground text-center">
            {comparisonData?.user_metrics.waste_diversion
              ? t("industryAvgPercentile", { percentile: comparisonData.user_metrics.waste_diversion.percentile.toFixed(0) })
              : t("trackIndustry")}
          </p>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Towards Net-Zero */}
        <motion.div
          className="lg:col-span-2 surface-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-base font-bold mb-4">{t("renewableProgress")}</h3>
          
          <div className="h-64">
            {chartData.length > 0 ? (
              <svg viewBox="0 0 600 200" className="w-full h-full">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((value, i) => (
                  <g key={i}>
                    <line
                      x1="50"
                      y1={160 - (value * 1.2)}
                      x2="580"
                      y2={160 - (value * 1.2)}
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-border opacity-30"
                    />
                    <text
                      x="20"
                      y={165 - (value * 1.2)}
                      fontSize="10"
                      fill="currentColor"
                      className="text-muted-foreground"
                    >
                      {value}% 
                    </text>
                  </g>
                ))}
                
                {/* X-axis labels */}
                {chartData.map((point, i) => (
                  <text
                    key={i}
                    x={50 + (i * (530 / (chartData.length - 1 || 1)))}
                    y="185"
                    fontSize="10"
                    fill="currentColor"
                    className="text-muted-foreground"
                    textAnchor="middle"
                  >
                    {point.year}
                  </text>
                ))}
                
                {/* Renewable adoption line */}
                <polyline
                  points={chartData.map((p, i) => `${50 + (i * (530 / (chartData.length - 1 || 1)))},${160 - (p.renewable * 1.2)}`).join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-primary"
                />
                
                {/* Data points */}
                {chartData.map((point, i) => (
                  <circle
                    key={i}
                    cx={50 + (i * (530 / (chartData.length - 1 || 1)))}
                    cy={160 - (point.renewable * 1.2)}
                    r="4"
                    fill="currentColor"
                    className="text-primary"
                  />
                ))}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                {t("noHistorical")}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-primary" />
              <span className="text-muted-foreground">{t("renewableAdoption")}</span>
            </div>
          </div>
        </motion.div>

        {/* Peer Comparison */}
        <motion.div
          className="surface-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h3 className="text-base font-bold mb-6">{t("peerComparison")}</h3>
          
          {/* Circular grade */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted/20"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - (comparisonData?.overall_percentile ?? 50) / 100)}`}
                  className="text-primary transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold">
                  {comparisonData?.overall_grade.split(' ')[0] || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">{t("yourCompany")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-3" />
                <span className="text-muted-foreground">{t("topPerformer")}</span>
              </div>
            </div>
            
            {comparisonData && (
              <div className="text-center space-y-1">
                <p className="text-[10px] text-muted-foreground">
                  {comparisonData.overall_grade}
                </p>
                <p className="text-[10px] font-semibold text-primary">
                  {t("percentile", { value: comparisonData.overall_percentile.toFixed(0) })}
                </p>
              </div>
            )}
            
            <div className="pt-3 border-t border-border space-y-1">
              <p className="text-[10px] text-muted-foreground">{t("rankLine", { rank: leaderboardData?.rank ?? "-", total: leaderboardData?.total_users ?? "-" })}</p>
              {contextUser?.companyIndustry && (
                <p className="text-[10px] text-muted-foreground capitalize">{t("industryLine", { industry: contextUser.companyIndustry })}</p>
              )}
            </div>
          </div>
          
          {/* Mini bar chart */}
          <div className="flex items-end justify-center gap-2 h-12">
            {comparisonData ? (
              [
                comparisonData.user_metrics.carbon_footprint?.percentile ?? 50,
                comparisonData.user_metrics.renewable_share?.percentile ?? 50,
                comparisonData.user_metrics.waste_diversion?.percentile ?? 50,
                comparisonData.overall_percentile
              ].map((percentile, i) => (
                <div
                  key={i}
                  className="w-8 rounded-t transition-all duration-1000"
                  style={{
                    height: `${percentile}%`,
                    backgroundColor: i === 0 ? 'var(--color-primary)' : 'var(--color-muted)'
                  }}
                />
              ))
            ) : (
              [65, 45, 30, 55].map((height, i) => (
                <div
                  key={i}
                  className="w-8 rounded-t transition-all duration-1000"
                  style={{
                    height: `${height}%`,
                    backgroundColor: i === 0 ? 'var(--color-primary)' : 'var(--color-muted)'
                  }}
                />
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* New Features Section - Energy, Benchmarks & Compliance */}
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold">{t("advancedAnalytics")}</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t("advancedAnalyticsSub")}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div>
              <EnergyCostCalculator />
            </div>

            <div>
              <BenchmarkComparator />
            </div>

            <div>
              <ComplianceChecker />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Initiatives */}
        <motion.div
          className="surface-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-base font-bold mb-4">{t("recentInitiatives")}</h3>
          
          <div className="space-y-4">
            {completedActions.length > 0 ? (
              completedActions.map((action) => (
                <div key={action.id} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {action.category === "energy" ? (
                      <Zap className="w-4 h-4 text-primary" />
                    ) : action.category === "waste" ? (
                      <Recycle className="w-4 h-4 text-primary" />
                    ) : (
                      <Leaf className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-0.5">{action.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.created_at 
                        ? formatRelativeTime(action.created_at, userTimezone)
                        : t("recentlyCompleted")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">{t("noInitiatives")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("startInitiatives")}</p>
              </div>
            )}
          </div>
          
          <Link href="/app/actions">
            <PremiumButton variant="outline" size="sm" className="w-full mt-4 text-xs">
              {t("viewAllInitiatives")}
            </PremiumButton>
          </Link>
        </motion.div>

        {/* Suggestions */}
        <motion.div
          className="surface-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h3 className="text-base font-bold mb-4">{t("personalizedSuggestions")}</h3>
          
          {suggestions.length > 0 ? (
            <ol className="space-y-2 mb-6 list-decimal list-inside text-sm">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <li key={suggestion.id} className="text-muted-foreground">
                  {suggestion.title}
                  <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${
                    suggestion.priority === 'critical' ? 'bg-red-500/10 text-red-600' :
                    suggestion.priority === 'high' ? 'bg-orange-500/10 text-orange-600' :
                    'bg-blue-500/10 text-blue-600'
                  }`}>
                    {(["critical","high","medium","low"].includes(suggestion.priority) ? t(`priority.${suggestion.priority}` as any) : suggestion.priority)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="text-center py-8 mb-6">
              <p className="text-sm text-muted-foreground">{t("noSuggestions")}</p>
            </div>
          )}
          
          <Link href="/app/actions">
            <PremiumButton size="sm" className="w-full text-xs">
              {t("exploreRecommendations")}
            </PremiumButton>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}