"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/app/AppHeader";
import { StatCard } from "@/components/app/StatCard";
import { Badge } from "@/components/app/Badge";
import { ExportReportButton } from "@/components/app/ExportReportButton";
import { CarbonIcon, BoltIcon, WaterIcon, RecycleIcon } from "@/components/icons/CustomIcons";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

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
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/auth?redirect=" + encodeURIComponent(window.location.pathname));
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
      setError(error.message || "Failed to load analytics data");
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAIInsights = async (data: AnalyticsData) => {
    try {
      setAiLoading(true);

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
      }
    } catch (error) {
      console.error("Failed to fetch AI insights:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalyticsData();
  };

  if (loading || isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Unable to Load Analytics</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {error || "No analytics data available"}
          </p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppHeader
        title="Analytics"
        subtitle="Detailed insights into your sustainability metrics"
      />

      {/* Export Report Button */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground font-medium text-sm hover:bg-muted/80 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
        <ExportReportButton userId={session?.user?.id} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Emissions"
          value={analyticsData.metrics.totalEmissions.value.toFixed(1)}
          change={`${analyticsData.metrics.totalEmissions.change.toFixed(1)}% YoY`}
          changeType={analyticsData.metrics.totalEmissions.change < 0 ? "positive" : "negative"}
          subtitle="tons CO2e/year"
          icon={<CarbonIcon className="w-4 h-4" />}
        />
        <StatCard
          title="Energy"
          value={analyticsData.metrics.energy.value.toFixed(1)}
          change={`${analyticsData.metrics.energy.change.toFixed(1)}% YoY`}
          changeType={analyticsData.metrics.energy.change < 0 ? "positive" : "negative"}
          subtitle="tons CO2e/year"
          icon={<BoltIcon className="w-4 h-4" />}
        />
        <StatCard
          title="Water"
          value={analyticsData.metrics.water.value.toFixed(1)}
          change={`${analyticsData.metrics.water.change.toFixed(1)}% YoY`}
          changeType={analyticsData.metrics.water.change < 0 ? "positive" : "negative"}
          subtitle="tons CO2e/year"
          icon={<WaterIcon className="w-4 h-4" />}
        />
        <StatCard
          title="Waste"
          value={analyticsData.metrics.waste.value.toFixed(1)}
          change={`${analyticsData.metrics.waste.change.toFixed(1)}% YoY`}
          changeType={analyticsData.metrics.waste.change < 0 ? "positive" : "negative"}
          subtitle="tons CO2e/year"
          icon={<RecycleIcon className="w-4 h-4" />}
        />
      </div>

      {/* Emissions Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          className="glass-strong rounded-xl p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-bold mb-4">Emissions by Category</h2>
          {analyticsData.emissionsBreakdown ? (
            <div className="space-y-4">
              {[
                { label: "Electricity", data: analyticsData.emissionsBreakdown.electricity, color: "bg-chart-1" },
                { label: "Natural Gas", data: analyticsData.emissionsBreakdown.gas, color: "bg-chart-2" },
                { label: "Transportation", data: analyticsData.emissionsBreakdown.transportation, color: "bg-chart-3" },
                { label: "Other", data: analyticsData.emissionsBreakdown.other, color: "bg-chart-4" }
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-sm text-muted-foreground">{item.data.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={`h-full ${item.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.data.percentage}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No breakdown data available</p>
          )}
        </motion.div>

        <motion.div
          className="glass-strong rounded-xl p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-bold mb-4">Monthly Trend</h2>
          <div className="space-y-3">
            {analyticsData.monthlyTrend.slice(0, 6).map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">{item.month}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm">{item.value.toFixed(1)} tons</span>
                  <Badge 
                    variant={item.change < 0 ? "success" : "warning"} 
                    size="sm"
                  >
                    {item.change > 0 ? "+" : ""}{item.change.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Industry Benchmarking */}
      <motion.div
        className="glass-strong rounded-xl p-5 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-bold mb-4">Industry Benchmarking</h2>
        {analyticsData.industryComparison ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground mb-2">Your Performance</p>
              <p className="text-2xl font-bold text-primary mb-1">
                {analyticsData.industryComparison.yourPerformance.toFixed(1)}
              </p>
              <p className="text-[10px] text-muted-foreground">tons CO2e/month</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Industry Average</p>
              <p className="text-2xl font-bold mb-1">
                {analyticsData.industryComparison.industryAverage.toFixed(1)}
              </p>
              <p className="text-[10px] text-muted-foreground">tons CO2e/month</p>
            </div>
            <div className="p-4 rounded-lg bg-chart-2/5 border border-chart-2/10">
              <p className="text-xs text-muted-foreground mb-2">You're Better By</p>
              <p className="text-2xl font-bold text-chart-2 mb-1">
                {Math.abs(analyticsData.industryComparison.betterBy).toFixed(0)}%
              </p>
              <p className="text-[10px] text-muted-foreground">
                {analyticsData.industryComparison.betterBy > 0 ? "below average" : "above average"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Complete your profile to see industry comparisons</p>
        )}
      </motion.div>

      {/* AI Insights Section */}
      {aiInsights && (
        <motion.div
          className="glass-strong rounded-xl p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">AI-Powered Insights</h2>
            {aiLoading && <Loader2 className="w-4 h-4 animate-spin text-primary ml-auto" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recommendations */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-primary mb-3">Top Recommendations</h3>
              {aiInsights.recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>

            {/* Highlights */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-chart-2 mb-3">Key Highlights</h3>
              {aiInsights.highlights.map((highlight, index) => (
                <div key={index} className="p-3 rounded-lg bg-chart-2/5 border border-chart-2/10">
                  <p className="text-sm">{highlight}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}