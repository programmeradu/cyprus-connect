"use client";

import { useState, useEffect } from "react";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import {
  PageShell,
  PageHeader,
  Section,
  Metric,
  MetricRow,
  EmptyState,
  AiUnavailable
} from "@/components/app/shell";
import { APP_OPEN_ACCESS } from "@/lib/open-access";

interface EnergyPricingData {
  zone: string;
  carbonIntensity: any;
  powerBreakdown: any;
  utilityRates: any;
  costSavings: any;
  forecast: any[];
}

interface BenchmarkData {
  sector: string;
  country: string;
  sectorBenchmarks: any;
  peerComparison: any;
  insights: string[];
}

interface ComplianceData {
  score: number;
  regulations: Array<{
    id: number;
    name: string;
    status: string;
    nextDeadline: string;
    jurisdiction: string;
  }>;
  documents: Array<{
    id: number;
    title: string;
    framework: string;
    status: string;
  }>;
  urgentCount: number;
  upcomingCount: number;
}

interface UserPreferences {
  energyZone: string | null;
  countryCode: string | null;
  preferredCurrency: string | null;
}

interface UserData {
  companyIndustry: string | null;
  totalCredits: number;
  companyName: string | null;
  teamSize: string | null;
}

interface AIRecommendations {
  complianceRecommendations: string[];
  industryInsights: string[];
  energyOptimizationTips: string[];
}

export default function InsightsPage() {
  const t = useTranslations("dashboard.insights");
  const [energyData, setEnergyData] = useState<EnergyPricingData | null>(null);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFailed, setAiFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [userLocation, setUserLocation] = useState<{
    country: string;
    countryCode: string;
  } | null>(null);

  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth?redirect=" + encodeURIComponent(window.location.pathname));
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchAllData();
    }
  }, [session?.user?.id]);

  const fetchAllData = async () => {
    if (refreshing) return;

    setLoading(true);
    setError(null);

    try {
      const userId = session?.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      const [preferencesRes, geoRes, userRes] = await Promise.all([
        fetch(`/api/users/${userId}/preferences`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` }
        }),
        fetch("/api/geolocation"),
        fetch(`/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` }
        })
      ]);

      let preferences: UserPreferences = {
        energyZone: null,
        countryCode: null,
        preferredCurrency: null
      };

      let geoData: any = { countryCode: "US", country: "United States" };
      let userDataRes: any = { companyIndustry: "technology", totalCredits: 0 };

      if (preferencesRes.ok) {
        preferences = await preferencesRes.json();
      }

      if (geoRes.ok) {
        geoData = await geoRes.json();
      }

      if (userRes.ok) {
        userDataRes = await userRes.json();
        setUserData(userDataRes);
      }

      const countryCode = preferences.countryCode || geoData.countryCode;
      const country = preferences.countryCode ? getCountryName(preferences.countryCode) : geoData.country;

      setUserLocation({ country, countryCode });

      let energyZone = preferences.energyZone || getDefaultEnergyZone(countryCode);
      const zoneCountry = energyZone.split("-")[0];
      if (zoneCountry !== countryCode && !energyZone.includes(countryCode)) {
        energyZone = getDefaultEnergyZone(countryCode);
      }

      const sector = userDataRes.companyIndustry || "technology";
      const token = localStorage.getItem("bearer_token");

      const [energyPricingRes, benchmarksRes, complianceRes] = await Promise.all([
        fetch(`/api/energy-pricing?zone=${energyZone}&energyUsageKwh=10000`),
        fetch(
          `/api/industry-benchmarks?sector=${sector}&country=${countryCode}&companyEmissions=${userDataRes.totalCredits || 500}`
        ),
        fetch(`/api/compliance/data`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      let energyDataRes = null;
      let benchmarkDataRes = null;
      let complianceDataRes = null;

      if (energyPricingRes.ok) {
        energyDataRes = await energyPricingRes.json();
        setEnergyData(energyDataRes);
      }

      if (benchmarksRes.ok) {
        benchmarkDataRes = await benchmarksRes.json();
        setBenchmarkData(benchmarkDataRes);
      }

      if (complianceRes.ok) {
        complianceDataRes = await complianceRes.json();

        const regulations = complianceDataRes.regulations || [];
        const documents = complianceDataRes.documents || [];
        const urgentCount = regulations.filter((r: any) => r.status === "action_required").length;
        const upcomingCount = regulations.filter((r: any) => {
          const daysUntil = Math.floor((new Date(r.nextDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return daysUntil <= 30 && daysUntil > 0;
        }).length;

        setComplianceData({
          score: complianceDataRes.score || 85,
          regulations,
          documents,
          urgentCount,
          upcomingCount
        });
      }

      await generateAIRecommendations({
        energyData: energyDataRes,
        benchmarkData: benchmarkDataRes,
        complianceData: complianceDataRes,
        userProfile: userDataRes,
        userLocation: { country, countryCode }
      });
    } catch (error: any) {
      console.error("Failed to fetch insights data:", error);
      setError(error.message || t("loadFailed"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateAIRecommendations = async (context: any) => {
    setAiLoading(true);
    setAiFailed(false);
    try {
      const userId = session?.user?.id;

      const response = await fetch("/api/insights/ai-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          energyData: context.energyData,
          benchmarkData: context.benchmarkData,
          complianceData: context.complianceData,
          userProfile: context.userProfile,
          userLocation: context.userLocation
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiRecommendations(data.recommendations);
        if (!data.recommendations) setAiFailed(true);
      } else {
        setAiFailed(true);
        console.error("Failed to generate AI recommendations");
      }
    } catch (error) {
      setAiFailed(true);
      console.error("AI recommendations error:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const getCountryName = (code: string): string => {
    const countryMap: Record<string, string> = {
      CY: "Cyprus", GR: "Greece", GB: "United Kingdom", DE: "Germany", FR: "France",
      ES: "Spain", IT: "Italy", NL: "Netherlands", BE: "Belgium", LU: "Luxembourg",
      IE: "Ireland", PT: "Portugal", AT: "Austria", PL: "Poland", SE: "Sweden",
      DK: "Denmark", FI: "Finland", NO: "Norway", IS: "Iceland", SA: "Saudi Arabia",
      SG: "Singapore", MY: "Malaysia", TH: "Thailand", ID: "Indonesia", PH: "Philippines",
      VN: "Vietnam", CZ: "Czech Republic", RO: "Romania", HU: "Hungary", SK: "Slovakia",
      SI: "Slovenia", HR: "Croatia", BG: "Bulgaria", MT: "Malta", EE: "Estonia",
      LV: "Latvia", LT: "Lithuania"
    };
    return countryMap[code] || code;
  };

  const getDefaultEnergyZone = (countryCode: string): string => {
    const zoneMap: Record<string, string> = {
      CY: "CY", GR: "GR", DE: "DE", FR: "FR", ES: "ES", IT: "IT", NL: "NL",
      GB: "GB", SE: "SE", NO: "NO", DK: "DK-DK1"
    };
    return zoneMap[countryCode] || countryCode;
  };

  const mapCountryToRegion = (countryCode: string): string => {
    const euCountries = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"];
    if (euCountries.includes(countryCode)) return "EU";
    if (countryCode === "US") return "US";
    if (countryCode === "GB") return "UK";
    return "Global";
  };

  const forecastChartData =
    energyData?.forecast?.slice(0, 12).map((f: any) => ({
      time: new Date(f.datetime).toLocaleDateString("en-GB", { month: "numeric", day: "numeric" }),
      carbon: f.carbonIntensity,
      target: energyData?.carbonIntensity?.current * 0.8 || 220
    })) || [];

  const performanceData = benchmarkData
    ? [
        {
          month: "Q1",
          you: benchmarkData.peerComparison?.companyEmissions * 0.7 || 35,
          industry: benchmarkData.sectorBenchmarks?.globalAverage * 0.7 || 42
        },
        {
          month: "Q2",
          you: benchmarkData.peerComparison?.companyEmissions * 0.76 || 38,
          industry: benchmarkData.sectorBenchmarks?.globalAverage * 0.8 || 55
        },
        {
          month: "Q3",
          you: benchmarkData.peerComparison?.companyEmissions * 0.84 || 42,
          industry: benchmarkData.sectorBenchmarks?.globalAverage * 0.9 || 65
        },
        {
          month: "Q4",
          you: benchmarkData.peerComparison?.companyEmissions || 52,
          industry: benchmarkData.sectorBenchmarks?.globalAverage || 68
        }
      ]
    : [];

  return (
    <PageShell
      signedOut={!isPending && !session?.user}
      loading={isPending || (!!session?.user && loading)}
      error={error}
      onRetry={handleRefresh}
      header={
        <PageHeader
          title={t("title")}
          purpose={`${t("subtitle")}${userLocation ? ` — ${userLocation.country}` : ""}`}
          actions={
            <button type="button" onClick={handleRefresh} disabled={refreshing} className="app-btn">
              {t("refresh")}
            </button>
          }
        />
      }
    >
      <Section title={t("title")}>
        <MetricRow columns={4}>
          <Metric
            label={t("metrics.carbonIntensity")}
            value={energyData?.carbonIntensity?.current?.toFixed(0) || "N/A"}
            unit="gCO2/kWh"
            note={t("metrics.fossilPercent", { pct: energyData?.carbonIntensity?.fossilFuelPercentage?.toFixed(0) || 0 })}
          />
          <Metric
            label={t("metrics.potentialSavings")}
            value={<CurrencyDisplay amount={energyData?.costSavings?.costSavingsUSD || 0} fromCurrency="USD" />}
            note={t("metrics.reduction", { pct: energyData?.costSavings?.percentageReduction?.toFixed(1) || 0 })}
          />
          <Metric
            label={t("metrics.industryRank")}
            value={benchmarkData?.peerComparison?.percentile ?? "N/A"}
            unit="%"
            note={benchmarkData?.peerComparison?.interpretation || t("metrics.calculating")}
          />
          <Metric
            label={t("metrics.complianceScore")}
            value={complianceData?.score?.toFixed(0) || "0"}
            unit="%"
            note={t("metrics.regsSummary", {
              urgent: complianceData?.urgentCount ?? 0,
              total: complianceData?.regulations?.length ?? 0
            })}
          />
        </MetricRow>
      </Section>

      <Section title={t("energySection.title")}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="app-card p-4">
            <h3 className="text-sm font-semibold mb-3">{t("energySection.forecastTitle")}</h3>

            {forecastChartData.length > 0 ? (
              <>
                <div className="h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastChartData}>
                      <defs>
                        <linearGradient id="carbonGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--app-rule)" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--app-surface-1)",
                          border: "1px solid var(--app-rule)",
                          borderRadius: "6px",
                          fontSize: "12px"
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="carbon"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        fill="url(#carbonGradient)"
                        name={t("energySection.carbonIntensityLegend")}
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="var(--muted-foreground)"
                        strokeWidth={1.5}
                        strokeDasharray="5 5"
                        dot={false}
                        name={t("energySection.targetLegend")}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <MetricRow columns={2}>
                  <Metric
                    label={t("energySection.renewableEnergy")}
                    value={`${(energyData?.carbonIntensity?.renewablePercentage || 0).toFixed(0)}%`}
                  />
                  <Metric
                    label={t("energySection.fossilFree")}
                    value={`${(100 - (energyData?.carbonIntensity?.fossilFuelPercentage || 100)).toFixed(0)}%`}
                  />
                </MetricRow>
              </>
            ) : (
              <EmptyState
                title="No forecast data yet"
                description="Carbon intensity forecasts will appear here once your energy zone data is available."
              />
            )}
          </div>

          <div className="app-card p-4">
            <h3 className="text-sm font-semibold mb-3">
              {t("energySection.performanceTitle")} <span className="text-muted-foreground">{t("energySection.vs")}</span> {t("energySection.industry")}
            </h3>

            {performanceData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--app-rule)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--app-surface-1)",
                        border: "1px solid var(--app-rule)",
                        borderRadius: "6px",
                        fontSize: "12px"
                      }}
                    />
                    <Bar dataKey="you" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={16} name={t("energySection.yourCompany")} />
                    <Bar dataKey="industry" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} barSize={16} name={t("energySection.industryAverage")} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                title="No benchmark data yet"
                description="Industry comparisons will appear once your sector benchmark data has been calculated."
              />
            )}
          </div>
        </div>

        {energyData?.costSavings && (
          <div className="mt-4">
            <MetricRow columns={3}>
              <Metric
                label={t("energySection.monthlySavings")}
                value={<CurrencyDisplay amount={energyData.costSavings.costSavingsUSD || 0} fromCurrency="USD" />}
                note={t("energySection.monthlySavingsSub")}
              />
              <Metric
                label={t("energySection.carbonReduction")}
                value={`${energyData.costSavings.carbonSavingsKg?.toFixed(1) || 0} kg`}
                note={t("energySection.carbonReductionSub")}
              />
              <Metric
                label={t("energySection.gridStatus")}
                value={`${energyData.carbonIntensity?.renewablePercentage?.toFixed(1) || 0}%`}
                note={t("energySection.gridStatusSub")}
              />
            </MetricRow>
          </div>
        )}
      </Section>

      <Section
        title={t("ai.title")}
        description={userLocation ? t("ai.personalizedFor", { country: userLocation.country }) : undefined}
      >
        {aiLoading ? (
          <div className="app-card p-6">
            <p className="app-meta">{t("ai.generating")}</p>
          </div>
        ) : aiRecommendations ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {aiRecommendations.energyOptimizationTips?.length > 0 && (
              <div className="app-card p-4">
                <h3 className="text-sm font-semibold mb-3">{t("ai.energyOptimization")}</h3>
                <ul className="space-y-2">
                  {aiRecommendations.energyOptimizationTips.map((tip, index) => (
                    <li key={index} className="app-card-inset px-3 py-2 text-sm">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiRecommendations.complianceRecommendations?.length > 0 && (
              <div className="app-card p-4">
                <h3 className="text-sm font-semibold mb-3">{t("ai.complianceGuidance")}</h3>
                <ul className="space-y-2">
                  {aiRecommendations.complianceRecommendations.map((rec, index) => (
                    <li key={index} className="app-card-inset px-3 py-2 text-sm">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiRecommendations.industryInsights?.length > 0 && (
              <div className="app-card p-4">
                <h3 className="text-sm font-semibold mb-3">{t("ai.industryInsights")}</h3>
                <ul className="space-y-2">
                  {aiRecommendations.industryInsights.map((insight, index) => (
                    <li key={index} className="app-card-inset px-3 py-2 text-sm">
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <AiUnavailable feature="write insights from your data" onRetry={handleRefresh} />
        )}
      </Section>

      <Section
        title={t("compliance.title")}
        description={userLocation ? t("compliance.regionSuffix", { region: mapCountryToRegion(userLocation.countryCode) }) : undefined}
        action={
          <Link href="/app/compliance" className="app-btn-ghost app-btn">
            {t("compliance.viewDashboard")}
          </Link>
        }
      >
        {complianceData ? (
          <div className="app-card p-4">
            <MetricRow columns={4}>
              <Metric label={t("compliance.health")} value={`${complianceData.score}%`} note={t("compliance.regsTracked", { count: complianceData.regulations.length })} />
              {complianceData.urgentCount > 0 && (
                <Metric label={t("compliance.urgent")} value={complianceData.urgentCount} />
              )}
              {complianceData.upcomingCount > 0 && (
                <Metric label={t("compliance.dueSoon")} value={complianceData.upcomingCount} />
              )}
              <Metric label={t("compliance.reports")} value={complianceData.documents.length} />
            </MetricRow>
          </div>
        ) : (
          <EmptyState
            title="Compliance data is not loaded yet"
            description="Once compliance regulations are initialised for your account, a summary will appear here."
            action={{ label: t("compliance.viewDashboard"), href: "/app/compliance" }}
          />
        )}
      </Section>
    </PageShell>
  );
}
