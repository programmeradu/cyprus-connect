"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Leaf,
  FileCheck,
  MapPin,
  RefreshCw,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  ResponsiveContainer,
} from "recharts";

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
  const [error, setError] = useState<string | null>(null);
  const { selectedCurrency } = useCurrency();
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [userLocation, setUserLocation] = useState<{
    country: string;
    countryCode: string;
  } | null>(null);

  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/auth?redirect=" + encodeURIComponent(window.location.pathname));
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

      // Fetch user preferences and geolocation in parallel
      const [preferencesRes, geoRes, userRes] = await Promise.all([
        fetch(`/api/users/${userId}/preferences`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
          },
        }),
        fetch("/api/geolocation"),
        fetch(`/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
          },
        }),
      ]);

      let preferences: UserPreferences = {
        energyZone: null,
        countryCode: null,
        preferredCurrency: null,
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

      // CRITICAL: Validate energy zone matches country
      // Ghana (GH) should NEVER use Nigeria (NG) zones
      let energyZone = preferences.energyZone || getDefaultEnergyZone(countryCode);
      
      // Force correct zone if mismatch detected
      if (countryCode === "GH" && energyZone && energyZone.startsWith("NG")) {
        console.warn("⚠️ Correcting energy zone mismatch: Ghana should not use Nigeria zones");
        energyZone = "GH";
      }
      
      // General validation: ensure zone matches country
      const zoneCountry = energyZone.split("-")[0];
      if (zoneCountry !== countryCode && !energyZone.includes(countryCode)) {
        console.warn(`⚠️ Energy zone mismatch detected. Country: ${countryCode}, Zone: ${energyZone}. Using country default.`);
        energyZone = getDefaultEnergyZone(countryCode);
      }
      
      const sector = userDataRes.companyIndustry || "technology";
      
      console.log("🌍 Location Data:", { country, countryCode, energyZone });

      const token = localStorage.getItem("bearer_token");

      // Fetch insights data in parallel - UPDATED COMPLIANCE ENDPOINT
      const [energyPricingRes, benchmarksRes, complianceRes] = await Promise.all([
        fetch(
          `/api/energy-pricing?zone=${energyZone}&energyUsageKwh=10000`
        ),
        fetch(
          `/api/industry-benchmarks?sector=${sector}&country=${countryCode}&companyEmissions=${userDataRes.totalCredits || 500}`
        ),
        fetch(
          `/api/compliance/data`,
          {
            headers: { "Authorization": `Bearer ${token}` }
          }
        ),
      ]);

      let energyDataRes = null;
      let benchmarkDataRes = null;
      let complianceDataRes = null;

      if (energyPricingRes.ok) {
        energyDataRes = await energyPricingRes.json();
        console.log("⚡ Energy Data:", energyDataRes);
        setEnergyData(energyDataRes);
      }

      if (benchmarksRes.ok) {
        benchmarkDataRes = await benchmarksRes.json();
        console.log("📊 Benchmark Data:", benchmarkDataRes);
        setBenchmarkData(benchmarkDataRes);
      }

      if (complianceRes.ok) {
        complianceDataRes = await complianceRes.json();
        console.log("✅ Compliance Data:", complianceDataRes);
        
        // Transform new compliance data format
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

      // Generate AI recommendations after data is loaded
      await generateAIRecommendations({
        energyData: energyDataRes,
        benchmarkData: benchmarkDataRes,
        complianceData: complianceDataRes,
        userProfile: userDataRes,
        userLocation: { country, countryCode },
      });

    } catch (error: any) {
      console.error("Failed to fetch insights data:", error);
      setError(error.message || "Failed to load insights data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateAIRecommendations = async (context: any) => {
    setAiLoading(true);
    try {
      const userId = session?.user?.id;
      
      const response = await fetch("/api/insights/ai-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          energyData: context.energyData,
          benchmarkData: context.benchmarkData,
          complianceData: context.complianceData,
          userProfile: context.userProfile,
          userLocation: context.userLocation,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("🤖 AI Recommendations:", data);
        setAiRecommendations(data.recommendations);
      } else {
        console.error("Failed to generate AI recommendations");
      }
    } catch (error) {
      console.error("AI recommendations error:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  // Map country code to country name
  const getCountryName = (code: string): string => {
    const countryMap: Record<string, string> = {
      US: "United States",
      CA: "Canada",
      GB: "United Kingdom",
      DE: "Germany",
      FR: "France",
      ES: "Spain",
      IT: "Italy",
      NL: "Netherlands",
      GH: "Ghana",
      NG: "Nigeria",
      ZA: "South Africa",
      KE: "Kenya",
      EG: "Egypt",
      AU: "Australia",
      NZ: "New Zealand",
      JP: "Japan",
      CN: "China",
      IN: "India",
      BR: "Brazil",
      MX: "Mexico",
      AR: "Argentina",
      AE: "United Arab Emirates",
      SA: "Saudi Arabia",
      SG: "Singapore",
      MY: "Malaysia",
      TH: "Thailand",
      ID: "Indonesia",
      PH: "Philippines",
      VN: "Vietnam",
      KR: "South Korea",
      TR: "Turkey",
      PL: "Poland",
      SE: "Sweden",
      NO: "Norway",
      DK: "Denmark",
      FI: "Finland",
      CH: "Switzerland",
      AT: "Austria",
      BE: "Belgium",
      PT: "Portugal",
      GR: "Greece",
      CZ: "Czech Republic",
      RO: "Romania",
      HU: "Hungary",
      IE: "Ireland",
      IL: "Israel",
    };
    return countryMap[code] || code;
  };

  // Map country code to default energy zone
  const getDefaultEnergyZone = (countryCode: string): string => {
    const zoneMap: Record<string, string> = {
      US: "US-CAL-CISO",
      CA: "CA-ON",
      GB: "GB",
      DE: "DE",
      FR: "FR",
      ES: "ES",
      IT: "IT",
      NL: "NL",
      GH: "GH",
      NG: "NG",
      ZA: "ZA",
      KE: "KE",
      EG: "EG",
      AU: "AU-NSW",
      JP: "JP",
      CN: "CN",
      IN: "IN",
      BR: "BR",
    };
    return zoneMap[countryCode] || countryCode;
  };

  // Map country code to regulatory region
  const mapCountryToRegion = (countryCode: string): string => {
    const euCountries = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"];
    
    if (euCountries.includes(countryCode)) return "EU";
    if (countryCode === "US") return "US";
    if (countryCode === "GB") return "UK";
    return "Global";
  };

  if (loading || isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("unableToLoad")}</h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            {t("tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  // Transform forecast data for charts
  const forecastChartData = energyData?.forecast?.slice(0, 12).map((f: any) => ({
    time: new Date(f.datetime).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
    carbon: f.carbonIntensity,
    target: energyData?.carbonIntensity?.current * 0.8 || 220,
  })) || [];

  // Generate performance comparison data from real benchmarks
  const performanceData = benchmarkData ? [
    { 
      month: 'Q1', 
      you: benchmarkData.peerComparison?.companyEmissions * 0.7 || 35, 
      industry: benchmarkData.sectorBenchmarks?.globalAverage * 0.7 || 42 
    },
    { 
      month: 'Q2', 
      you: benchmarkData.peerComparison?.companyEmissions * 0.76 || 38, 
      industry: benchmarkData.sectorBenchmarks?.globalAverage * 0.8 || 55 
    },
    { 
      month: 'Q3', 
      you: benchmarkData.peerComparison?.companyEmissions * 0.84 || 42, 
      industry: benchmarkData.sectorBenchmarks?.globalAverage * 0.9 || 65 
    },
    { 
      month: 'Q4', 
      you: benchmarkData.peerComparison?.companyEmissions || 52, 
      industry: benchmarkData.sectorBenchmarks?.globalAverage || 68 
    },
  ] : [];

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-1">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span>{t("subtitle")}</span>
            {userLocation && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <MapPin className="w-3 h-3" />
                <span>{userLocation.country}</span>
              </>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {t("refresh")}
        </button>
      </div>

      {/* Key Metrics - Real Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCardCompact
          icon={<Zap className="w-4 h-4" />}
          title={t("metrics.carbonIntensity")}
          value={energyData?.carbonIntensity?.current?.toFixed(0) || "N/A"}
          unit="gCO2/kWh"
          trendText={t("metrics.fossilPercent", { pct: energyData?.carbonIntensity?.fossilFuelPercentage?.toFixed(0) || 0 })}
          trendColor="#ef4444"
        />
        <MetricCardCompact
          icon={<DollarSign className="w-4 h-4" />}
          title={t("metrics.potentialSavings")}
          value={energyData?.costSavings?.costSavingsUSD || 0}
          unit=""
          trendText={t("metrics.reduction", { pct: energyData?.costSavings?.percentageReduction?.toFixed(1) || 0 })}
          trendColor="#10b981"
          isCurrency
        />
        <MetricCardCompact
          icon={<TrendingUp className="w-4 h-4" />}
          title={t("metrics.industryRank")}
          value={benchmarkData?.peerComparison?.percentile || "N/A"}
          unit="%"
          trendText={benchmarkData?.peerComparison?.interpretation || t("metrics.calculating")}
          trendColor={
            benchmarkData?.peerComparison?.percentile < 50 ? "#10b981" : "#ef4444"
          }
        />
        <MetricCardCompact
          icon={<FileCheck className="w-4 h-4" />}
          title={t("metrics.complianceScore")}
          value={complianceData?.score?.toFixed(0) || "0"}
          unit="%"
          trendText={t("metrics.regsSummary", { urgent: complianceData?.urgentCount ?? 0, total: complianceData?.regulations?.length ?? 0 })}
          trendColor="#10b981"
        />
      </div>

      {/* Energy Pricing & Cost Savings Section */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          {t("energySection.title")}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Carbon Intensity Forecast Chart */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">{t("energySection.forecastTitle")}</h3>
            </div>
            
            {forecastChartData.length > 0 ? (
              <>
                <div className="h-48 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastChartData}>
                      <defs>
                        <linearGradient id="carbonGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fill: 'currentColor', fontSize: 10 }}
                        className="text-muted-foreground"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fill: 'currentColor', fontSize: 10 }}
                        className="text-muted-foreground"
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="carbon" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fill="url(#carbonGradient)"
                        name={t("energySection.carbonIntensityLegend")}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke="#f59e0b" 
                        strokeWidth={1.5}
                        strokeDasharray="5 5"
                        dot={false}
                        name={t("energySection.targetLegend")}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <CircularProgress 
                    percentage={energyData?.carbonIntensity?.renewablePercentage || 0} 
                    label={t("energySection.renewableEnergy")}
                    size={80}
                  />
                  <CircularProgress 
                    percentage={100 - (energyData?.carbonIntensity?.fossilFuelPercentage || 100)} 
                    label={t("energySection.fossilFree")}
                    size={80}
                  />
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                {t("energySection.noForecast")}
              </div>
            )}
          </div>

          {/* Industry Comparison */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">{t("energySection.performanceTitle")} <span className="text-muted-foreground">{t("energySection.vs")}</span> {t("energySection.industry")}</h3>
              </div>
            </div>
            
            {performanceData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'currentColor', fontSize: 10 }}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: 'currentColor', fontSize: 10 }}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="you" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} name={t("energySection.yourCompany")} />
                    <Bar dataKey="industry" fill="#f97316" radius={[4, 4, 0, 0]} barSize={16} name={t("energySection.industryAverage")} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                {t("energySection.noPerformance")}
              </div>
            )}
          </div>
        </div>

        {/* Additional Insights Grid */}
        {energyData?.costSavings && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InsightCard
              label={t("energySection.monthlySavings")}
              value={<CurrencyDisplay amount={energyData.costSavings.costSavingsUSD || 0} fromCurrency="USD" />}
              subtext={t("energySection.monthlySavingsSub")}
            />
            <InsightCard
              label={t("energySection.carbonReduction")}
              value={`${energyData.costSavings.carbonSavingsKg?.toFixed(1) || 0} kg`}
              subtext={t("energySection.carbonReductionSub")}
            />
            <InsightCard
              label={t("energySection.gridStatus")}
              value={`${energyData.carbonIntensity?.renewablePercentage?.toFixed(1) || 0}%`}
              subtext={t("energySection.gridStatusSub")}
            />
          </div>
        )}
      </section>

      {/* AI-Powered Recommendations Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <svg 
              className="w-5 h-5" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="aiIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              {/* Neural network connections */}
              <circle cx="12" cy="4" r="1.5" fill="url(#aiIconGradient)" opacity="0.8" />
              <circle cx="6" cy="10" r="1.5" fill="url(#aiIconGradient)" opacity="0.8" />
              <circle cx="18" cy="10" r="1.5" fill="url(#aiIconGradient)" opacity="0.8" />
              <circle cx="9" cy="16" r="1.5" fill="url(#aiIconGradient)" opacity="0.8" />
              <circle cx="15" cy="16" r="1.5" fill="url(#aiIconGradient)" opacity="0.8" />
              <circle cx="12" cy="20" r="1.5" fill="url(#aiIconGradient)" opacity="0.8" />
              {/* Connection lines */}
              <path d="M12 5.5 L6 8.5" stroke="url(#aiIconGradient)" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
              <path d="M12 5.5 L18 8.5" stroke="url(#aiIconGradient)" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
              <path d="M6 11.5 L9 14.5" stroke="url(#aiIconGradient)" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
              <path d="M18 11.5 L15 14.5" stroke="url(#aiIconGradient)" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
              <path d="M9 17.5 L12 18.5" stroke="url(#aiIconGradient)" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
              <path d="M15 17.5 L12 18.5" stroke="url(#aiIconGradient)" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
              {/* CPU/Chip frame */}
              <rect x="8" y="9" width="8" height="8" rx="1.5" stroke="url(#aiIconGradient)" strokeWidth="1.5" fill="none" opacity="0.6" />
              {/* Central processor core */}
              <circle cx="12" cy="13" r="2" fill="url(#aiIconGradient)" opacity="0.9" />
            </svg>
            {t("ai.title")}
            {userLocation && (
              <span className="text-xs text-muted-foreground font-normal">
                {t("ai.personalizedFor", { country: userLocation.country })}
              </span>
            )}
          </h2>
          {aiLoading && (
            <motion.div
              className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          )}
        </div>

        {aiRecommendations ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Energy Optimization Tips */}
            {aiRecommendations.energyOptimizationTips && aiRecommendations.energyOptimizationTips.length > 0 && (
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  {t("ai.energyOptimization")}
                </h3>
                <div className="space-y-2">
                  {aiRecommendations.energyOptimizationTips.map((tip, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg"
                    >
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{index + 1}</span>
                      </div>
                      <p className="text-sm flex-1">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compliance Recommendations */}
            {aiRecommendations.complianceRecommendations && aiRecommendations.complianceRecommendations.length > 0 && (
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-primary" />
                  {t("ai.complianceGuidance")}
                </h3>
                <div className="space-y-2">
                  {aiRecommendations.complianceRecommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg"
                    >
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold">📋</span>
                      </div>
                      <p className="text-sm flex-1">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Industry Insights */}
            {aiRecommendations.industryInsights && aiRecommendations.industryInsights.length > 0 && (
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  {t("ai.industryInsights")}
                </h3>
                <div className="space-y-2">
                  {aiRecommendations.industryInsights.map((insight, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg"
                    >
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold">💡</span>
                      </div>
                      <p className="text-sm flex-1">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : aiLoading ? (
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-8">
            <div className="text-center">
              <motion.div
                className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-sm text-muted-foreground">{t("ai.generating")}</p>
            </div>
          </div>
        ) : (
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5">
            <p className="text-sm text-muted-foreground text-center">
              {t("ai.unable")}
            </p>
          </div>
        )}
      </section>

      {/* Regulatory Compliance Section - UPDATED WITH REAL DATA */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary" />
            {t("compliance.title")}
            {userLocation && (
              <span className="text-xs text-muted-foreground font-normal">
                {t("compliance.regionSuffix", { region: mapCountryToRegion(userLocation.countryCode) })}
              </span>
            )}
          </h2>
          <Link href="/app/compliance">
            <button className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all">
              {t("compliance.viewDashboard")}
            </button>
          </Link>
        </div>

        {/* Minimal Compliance Overview Card */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5">
          {complianceData ? (
            <div className="flex items-center justify-between gap-6">
              {/* Score */}
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="5"
                      fill="none"
                      className="text-muted/20"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="5"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - complianceData.score / 100)}`}
                      className="text-primary transition-all duration-1000"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">{complianceData.score}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold">{t("compliance.health")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("compliance.regsTracked", { count: complianceData.regulations.length })}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-3">
                {complianceData.urgentCount > 0 && (
                  <div className="text-center px-4 py-2 rounded-lg bg-destructive/10 text-destructive">
                    <p className="text-xl font-bold">{complianceData.urgentCount}</p>
                    <p className="text-xs">Urgent</p>
                  </div>
                )}
                {complianceData.upcomingCount > 0 && (
                  <div className="text-center px-4 py-2 rounded-lg bg-yellow-500/10 text-yellow-600">
                    <p className="text-xl font-bold">{complianceData.upcomingCount}</p>
                    <p className="text-xs">Due Soon</p>
                  </div>
                )}
                <div className="text-center px-4 py-2 rounded-lg bg-green-500/10 text-green-600">
                  <p className="text-xl font-bold">{complianceData.documents.length}</p>
                  <p className="text-xs">Reports</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Loading compliance data...</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Compact Metric Card
interface MetricCardCompactProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  unit: string;
  trendText: string;
  trendColor: string;
  isCurrency?: boolean;
}

function MetricCardCompact({
  icon,
  title,
  value,
  unit,
  trendText,
  trendColor,
  isCurrency = false
}: MetricCardCompactProps) {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div className="text-right">
          <span className="text-xs font-medium" style={{ color: trendColor }}>
            {trendText}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-1">{title}</p>
      <p className="text-xl font-bold">
        {isCurrency ? <CurrencyDisplay amount={Number(value)} fromCurrency="USD" /> : value}
        {!isCurrency && unit && <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>}
      </p>
    </div>
  );
}

// Circular Progress Component
function CircularProgress({ percentage, label, size = 80 }: { percentage: number; label: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  const color = percentage < 30 ? "#ef4444" : percentage < 60 ? "#f59e0b" : "#10b981";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-muted/20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{percentage.toFixed(0)}%</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">{label}</p>
    </div>
  );
}

// Insight Card Component
function InsightCard({ label, value, subtext }: { label: string; value: React.ReactNode; subtext: string }) {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <p className="text-xl font-bold mb-1">{value}</p>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </div>
  );
}

// Compliance Item Component
function ComplianceItem({ 
  icon, 
  title, 
  status, 
  statusColor 
}: { 
  icon: React.ReactNode; 
  title: string; 
  status: string; 
  statusColor: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <span className={`text-sm font-semibold ${statusColor}`}>{status}</span>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div className={`text-center p-3 rounded-lg ${color}`}>
      <p className="text-xl font-bold">{count}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}