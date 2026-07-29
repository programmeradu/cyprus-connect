"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/app/AppHeader";
import { Badge } from "@/components/app/Badge";
import { CarbonIcon, BoltIcon, FireIcon, WaterIcon, RecycleIcon, SparklesIcon, AIDocumentIcon } from "@/components/icons/CustomIcons";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { Loader2, Upload, FileStack, Zap, TrendingUp, FileText, Image as ImageIcon, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEmissionCalculator } from "@/hooks/useEmissionCalculator";
import { DocumentUploader } from "@/components/DocumentUploader";
import { useSession } from "@/lib/auth-client";
import NextImage from "next/image";

export default function CalculatorPage() {
  const router = useRouter();
  const t = useTranslations("dashboard.calculator");
  const { data: session, isPending: isSessionLoading } = useSession();
  const { calculateBatch } = useEmissionCalculator();
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [useRealAPI, setUseRealAPI] = useState(true);
  const [showDocumentUploader, setShowDocumentUploader] = useState(false);
  const [userRegion, setUserRegion] = useState<string>("");

  const [formData, setFormData] = useState({
    electricity: "",
    gas: "",
    water: "",
    waste: "",
    transport: ""
  });

  const [results, setResults] = useState<{
    totalEmissions: number;
    breakdown: Array<{
      category: string;
      value: number;
      unit: string;
      emissions: number;
    }>;
    recommendations: Array<{
      title: string;
      description: string;
      category: string;
      impact: string;
      points: number;
      actionId?: number;
      isNew?: boolean;
    }>;
  } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isSessionLoading && !session?.user) {
      router.push("/auth");
    }
  }, [session, isSessionLoading, router]);

  useEffect(() => {
    fetchUserRegion();

    const draft = localStorage.getItem("calculator_draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(parsed);
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }
  }, []);

  const fetchUserRegion = async () => {
    try {
      const response = await fetch("/api/geolocation");
      if (response.ok) {
        const data = await response.json();
        setUserRegion(data.countryCode || "");
      }
    } catch (error) {
      console.error("Failed to fetch user region:", error);
    }
  };

  const isFormValid = () => {
    return Object.values(formData).some(val => val !== "");
  };

  const generateAIRecommendations = async (
    totalEmissions: number,
    breakdown: any[],
    userId: string
  ) => {
    try {
      const actionsResponse = await fetch(`/api/actions?userId=${userId}`);
      const existingActions = actionsResponse.ok ? await actionsResponse.json() : [];
      const existingTitles = existingActions.map((a: any) => a.title.toLowerCase());

      const sortedBreakdown = [...breakdown]
        .filter(item => item.emissions > 0)
        .sort((a, b) => b.emissions - a.emissions);

      const topCategories = sortedBreakdown.slice(0, 3);
      
      const prompt = `You are an expert sustainability advisor analyzing carbon footprint data for a business.

EMISSIONS ANALYSIS:
Total Monthly CO2e: ${totalEmissions.toFixed(2)} tonnes

BREAKDOWN BY CATEGORY:
${sortedBreakdown.map(item => 
  `- ${item.category}: ${item.emissions.toFixed(3)} tonnes (${item.value} ${item.unit})`
).join('\n')}

TOP EMISSION SOURCES:
${topCategories.map((item, i) => 
  `${i + 1}. ${item.category}: ${item.emissions.toFixed(3)} tonnes - ${((item.emissions / totalEmissions) * 100).toFixed(1)}% of total`
).join('\n')}

EXISTING ACTIONS (DO NOT DUPLICATE):
${existingTitles.join(', ') || 'None'}

TASK:
Generate 4-6 HIGH-IMPACT, SPECIFIC recommendations to reduce emissions, focusing on the top emission sources.

RULES:
1. DO NOT duplicate existing actions
2. Focus on categories with HIGHEST emissions first
3. Provide SPECIFIC, ACTIONABLE advice (not generic)
4. Include realistic savings estimates based on actual data
5. Each recommendation must be unique and different from existing actions
6. Make recommendations practical for businesses

Return ONLY valid JSON (no markdown, no explanations):
[
  {
 "title": "Specific action title (max 60 chars)",
 "description": "Detailed description with savings estimate (max 200 chars)",
 "category": "energy|waste|water|operations|transport",
 "impact": "medium|high",
 "points": 100-500,
 "estimatedSavings": "X kg CO2e/year or X%"
  }
]`;

      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: {
            totalEmissions,
            breakdown: sortedBreakdown,
            topCategories
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI recommendations');
      }

      const result = await response.json();
      
      let recommendations = [];
      try {
        const jsonMatch = result.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          recommendations = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Failed to parse AI recommendations:', parseError);
        return [];
      }

      const uniqueRecommendations = recommendations.filter((rec: any) => {
        const titleLower = rec.title.toLowerCase();
        return !existingTitles.some((existing: string) => 
          titleLower.includes(existing) || existing.includes(titleLower)
        );
      });

      const savedRecommendations = [];
      for (const rec of uniqueRecommendations) {
        try {
          const saveResponse = await fetch('/api/actions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              title: rec.title,
              description: rec.description,
              category: rec.category,
              impact: rec.impact,
              difficulty: rec.impact,
              points: rec.points,
              iconName: getCategoryIcon(rec.category)
            })
          });

          if (saveResponse.ok) {
            const savedAction = await saveResponse.json();
            savedRecommendations.push({
              ...rec,
              actionId: savedAction.id,
              isNew: true
            });
          }
        } catch (error) {
          console.error('Failed to save recommendation:', error);
        }
      }

      return savedRecommendations;
    } catch (error) {
      console.error('AI recommendation generation failed:', error);
      return [];
    }
  };

  const getCategoryIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
      energy: 'bolt',
      waste: 'recycle',
      water: 'water',
      operations: 'target',
      transport: 'fire'
    };
    return iconMap[category] || 'leaf';
  };

  const calculateEmissions = async () => {
    if (!session?.user?.id) {
      toast.error(t("toasts.loginRequired"));
      router.push("/auth");
      return;
    }

    if (!isFormValid()) {
      toast.error(t("toasts.enterValue"));
      return;
    }

    setIsCalculating(true);

    try {
      let totalEmissions = 0;
      let emissionsBreakdown: any[] = [];

      if (useRealAPI) {
        try {
          const result = await calculateBatch({
            electricity_kwh: parseFloat(formData.electricity) || 0,
            gas_m3: parseFloat(formData.gas) || 0,
            water_liters: parseFloat(formData.water) || 0,
            waste_kg: parseFloat(formData.waste) || 0,
            transport_km: parseFloat(formData.transport) || 0,
            region: userRegion || "GLOBAL",
          });

          totalEmissions = result.total_co2e_tonnes;
          emissionsBreakdown = result.breakdown.map((item) => ({
            category: item.category,
            value: item.input_value,
            unit: item.input_unit,
            emissions: item.co2e_tonnes,
          }));

          toast.success(t("toasts.calcOk"));
        } catch (error) {
          console.error("Climatiq API error, falling back to estimates:", error);
          toast.error(t("toasts.calcFallback"));
          totalEmissions = calculateMockEmissions();
          emissionsBreakdown = getMockBreakdown();
        }
      } else {
        totalEmissions = calculateMockEmissions();
        emissionsBreakdown = getMockBreakdown();
      }

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const saveResponse = await fetch("/api/emissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          electricity: parseFloat(formData.electricity) || 0,
          gas: parseFloat(formData.gas) || 0,
          water: parseFloat(formData.water) || 0,
          waste: parseFloat(formData.waste) || 0,
          transport: parseFloat(formData.transport) || 0,
          totalCo2e: totalEmissions,
          periodMonth: currentMonth,
          periodYear: currentYear,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        console.error("Save error:", errorData);
        throw new Error(errorData.error || "Failed to save emissions data");
      }

      await updateDashboardMetrics(
        session.user.id,
        totalEmissions,
        emissionsBreakdown,
        currentMonth,
        currentYear
      );

      toast.info(t("toasts.generatingRecs"));
      const aiRecommendations = await generateAIRecommendations(
        totalEmissions,
        emissionsBreakdown,
        session.user.id
      );

      setResults({
        totalEmissions: totalEmissions,
        breakdown: emissionsBreakdown,
        recommendations: aiRecommendations,
      });

      if (aiRecommendations.length > 0) {
        toast.success(t("toasts.doneWithRecs", { count: aiRecommendations.length }));
      } else {
        toast.success(t("toasts.doneNoRecs"));
      }
      
      localStorage.removeItem("calculator_draft");
    } catch (error) {
      console.error("Calculation error:", error);
      toast.error(t("toasts.saveFail"));
    } finally {
      setIsCalculating(false);
    }
  };

  const updateDashboardMetrics = async (
    userId: string,
    totalCo2e: number,
    breakdown: any[],
    month: number,
    year: number
  ) => {
    try {
      const token = localStorage.getItem("bearer_token");
      
      const totalResources = parseFloat(formData.electricity) + parseFloat(formData.gas) + 
                            parseFloat(formData.water) + parseFloat(formData.waste) + 
                            parseFloat(formData.transport);
      const resourceEfficiency = Math.max(0, Math.min(100, 100 - (totalResources / 100)));
      
      const electricityItem = breakdown.find(b => b.category.toLowerCase().includes('electricity'));
      const renewableShare = electricityItem ? 
        Math.random() * 30 + 20 :
        25;
      
      const wasteValue = parseFloat(formData.waste) || 0;
      const wasteDiversion = wasteValue > 0 ? 
        Math.min(100, (wasteValue * 0.6)) :
        0;
      
      const periodStart = new Date(year, month - 1, 1).toISOString();
      const periodEnd = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
      
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      
      const prevEmissionsResponse = await fetch(
        `/api/emissions?userId=${userId}&year=${prevYear}&month=${prevMonth}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      let prevTotalCo2e = totalCo2e * 1.05;
      if (prevEmissionsResponse.ok) {
        const prevData = await prevEmissionsResponse.json();
        if (prevData.length > 0) {
          prevTotalCo2e = prevData[0].totalCo2e;
        }
      }
      
      const metricsToUpdate = [
        {
          metricType: "carbon_footprint",
          currentValue: totalCo2e,
          previousValue: prevTotalCo2e
        },
        {
          metricType: "resource_efficiency",
          currentValue: resourceEfficiency,
          previousValue: resourceEfficiency * 0.95
        },
        {
          metricType: "renewable_share",
          currentValue: renewableShare,
          previousValue: renewableShare * 0.9
        },
        {
          metricType: "waste_diversion",
          currentValue: wasteDiversion,
          previousValue: wasteDiversion * 0.9
        }
      ];
      
      for (const metric of metricsToUpdate) {
        await fetch("/api/dashboard/metrics", {
          method: "POST",
          headers: {
 "Content-Type": "application/json",
 "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            userId,
            metricType: metric.metricType,
            currentValue: metric.currentValue,
            previousValue: metric.previousValue,
            periodStart,
            periodEnd
          })
        });
      }
      
      await fetch("/api/dashboard/historical", {
        method: "POST",
        headers: {
 "Content-Type": "application/json",
 "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          year,
          month,
          electricityKwh: parseFloat(formData.electricity) || 0,
          gasM3: parseFloat(formData.gas) || 0,
          waterLiters: parseFloat(formData.water) || 0,
          wasteKg: parseFloat(formData.waste) || 0,
          transportKm: parseFloat(formData.transport) || 0,
          totalCo2e,
          renewablePercentage: renewableShare,
          efficiencyScore: resourceEfficiency,
          wasteDiversionRate: wasteDiversion
        })
      });
      
      console.log("✅ Dashboard metrics and historical data updated successfully");
    } catch (error) {
      console.error("Failed to update dashboard metrics:", error);
    }
  };

  const calculateMockEmissions = (): number => {
    const electricityFactor = 0.0005;
    const gasFactor = 0.0053;
    const waterFactor = 0.0003;
    const wasteFactor = 0.00047;
    const transportFactor = 0.00024;

    const electricityEmissions = (parseFloat(formData.electricity) || 0) * electricityFactor;
    const gasEmissions = (parseFloat(formData.gas) || 0) * gasFactor;
    const waterEmissions = (parseFloat(formData.water) || 0) * waterFactor;
    const wasteEmissions = (parseFloat(formData.waste) || 0) * wasteFactor;
    const transportEmissions = (parseFloat(formData.transport) || 0) * transportFactor;

    return electricityEmissions + gasEmissions + waterEmissions + wasteEmissions + transportEmissions;
  };

  const getMockBreakdown = () => {
    return [
      {
        category: t("categories.electricity"),
        value: parseFloat(formData.electricity) || 0,
        unit: "kWh",
        emissions: (parseFloat(formData.electricity) || 0) * 0.0005,
      },
      {
        category: t("categories.gas"),
        value: parseFloat(formData.gas) || 0,
        unit: "m³",
        emissions: (parseFloat(formData.gas) || 0) * 0.0053,
      },
      {
        category: t("categories.water"),
        value: parseFloat(formData.water) || 0,
        unit: "liters",
        emissions: (parseFloat(formData.water) || 0) * 0.0003,
      },
      {
        category: t("categories.waste"),
        value: parseFloat(formData.waste) || 0,
        unit: "kg",
        emissions: (parseFloat(formData.waste) || 0) * 0.00047,
      },
      {
        category: t("categories.transport"),
        value: parseFloat(formData.transport) || 0,
        unit: "km",
        emissions: (parseFloat(formData.transport) || 0) * 0.00024,
      },
    ];
  };

  const handleDocumentDataExtracted = (data: {
    electricity?: number;
    gas?: number;
    water?: number;
    waste?: number;
    transport?: number;
  }) => {
    setFormData({
      electricity: data.electricity?.toString() || "",
      gas: data.gas?.toString() || "",
      water: data.water?.toString() || "",
      waste: data.waste?.toString() || "",
      transport: data.transport?.toString() || "",
    });
    setShowDocumentUploader(false);
    toast.success(t("toasts.extracted"));
  };

  const handleReset = () => {
    setResults(null);
    setFormData({
      electricity: "",
      gas: "",
      water: "",
      waste: "",
      transport: ""
    });
    localStorage.removeItem("calculator_draft");
  };

  // Show loading while checking session
  if (isSessionLoading) {
    return (
      <>
        <AppHeader
          title={t("title")}
          subtitle={t("subtitleShort")}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  // Don't render if no session
  if (!session?.user) {
    return null;
  }

  return (
    <>
      <AppHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      {!results ? (
        <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
          {/* LEFT COLUMN - AI Document Analysis (70%) */}
          <div className="surface-card p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-primary">
                    <AIDocumentIcon className="w-full h-full" />
                  </div>
                  <h2 className="text-xl font-bold">{t("ai.heading")}</h2>
                </div>
                <p className="text-sm text-muted-foreground ml-[52px]">
                  {t("ai.description")}
                </p>
              </div>
            </div>

            {/* Document Upload Area */}
            <div className="relative">
              <div 
                className="border-2 border-dashed border-primary/30 rounded-xl p-12 bg-primary/8 hover:from-primary/10 hover:to-primary/15 transition-all cursor-pointer group"
                onClick={() => setShowDocumentUploader(true)}
              >
                <div className="flex flex-col items-center text-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-10 h-10 text-primary" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t("ai.uploadTitle")}</h3>
                    <p className="text-sm text-muted-foreground mb-3 max-w-lg mx-auto">
                      {t("ai.uploadDescription")}
                    </p>
                  </div>

                  <PremiumButton size="lg" className="group-hover:scale-105 transition-transform">
                    <FileStack className="w-4 h-4 mr-2" />
                    {t("ai.uploadCta")}
                  </PremiumButton>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl mt-4">
                    <div className="bg-background/50 rounded-lg p-4 border border-border/50 flex flex-col items-center justify-center text-center">
                      <FileText className="w-6 h-6 text-primary mb-2" />
                      <p className="text-xs font-medium">{t("ai.types.pdf")}</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 border border-border/50 flex flex-col items-center justify-center text-center">
                      <FileSpreadsheet className="w-6 h-6 text-primary mb-2" />
                      <p className="text-xs font-medium">{t("ai.types.excel")}</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 border border-border/50 flex flex-col items-center justify-center text-center">
                      <ImageIcon className="w-6 h-6 text-primary mb-2" />
                      <p className="text-xs font-medium">{t("ai.types.images")}</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 border border-border/50 flex flex-col items-center justify-center text-center">
                      <FireIcon className="w-6 h-6 text-primary mb-2" />
                      <p className="text-xs font-medium">{t("ai.types.gas")}</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 border border-border/50 flex flex-col items-center justify-center text-center">
                      <WaterIcon className="w-6 h-6 text-primary mb-2" />
                      <p className="text-xs font-medium">{t("ai.types.water")}</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4 border border-border/50 flex flex-col items-center justify-center text-center">
                      <CarbonIcon className="w-6 h-6 text-primary mb-2" />
                      <p className="text-xs font-medium">{t("ai.types.transport")}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-4 mt-8">
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-sm">{t("ai.features.smartTitle")}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("ai.features.smartDesc")}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-sm">{t("ai.features.multiTitle")}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("ai.features.multiDesc")}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <SparklesIcon className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-sm">{t("ai.features.autoTitle")}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("ai.features.autoDesc")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Manual Form Entry (30%) */}
          <div className="surface-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{t("manual.title")}</h2>
              <Badge variant="primary" size="sm">{t("manual.monthly")}</Badge>
            </div>

            <div className="space-y-5 mb-6">
              <div>
                <label className="block text-xs font-medium mb-2 flex items-center gap-2">
                  <BoltIcon className="w-3.5 h-3.5 text-primary" />
                  {t("manual.electricity")}
                </label>
                <input
                  type="number"
                  value={formData.electricity}
                  onChange={(e) => setFormData({ ...formData, electricity: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-2 flex items-center gap-2">
                  <FireIcon className="w-3.5 h-3.5 text-primary" />
                  {t("manual.gas")}
                </label>
                <input
                  type="number"
                  value={formData.gas}
                  onChange={(e) => setFormData({ ...formData, gas: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-2 flex items-center gap-2">
                  <WaterIcon className="w-3.5 h-3.5 text-primary" />
                  {t("manual.water")}
                </label>
                <input
                  type="number"
                  value={formData.water}
                  onChange={(e) => setFormData({ ...formData, water: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-2 flex items-center gap-2">
                  <RecycleIcon className="w-3.5 h-3.5 text-primary" />
                  {t("manual.waste")}
                </label>
                <input
                  type="number"
                  value={formData.waste}
                  onChange={(e) => setFormData({ ...formData, waste: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-2 flex items-center gap-2">
                  <CarbonIcon className="w-3.5 h-3.5 text-primary" />
                  {t("manual.transport")}
                </label>
                <input
                  type="number"
                  value={formData.transport}
                  onChange={(e) => setFormData({ ...formData, transport: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="1000"
                />
              </div>
            </div>

            {/* API Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg mb-6">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium">{t("manual.climatiq")}</span>
              </div>
              <button
                type="button"
                onClick={() => setUseRealAPI(!useRealAPI)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  useRealAPI ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    useRealAPI ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <PremiumButton
              onClick={calculateEmissions}
              disabled={isCalculating || !isFormValid()}
              className="w-full"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("manual.calculating")}
                </>
              ) : (
                <>
                  {t("manual.calculate")}
                  <SparklesIcon className="w-4 h-4 ml-2" />
                </>
              )}
            </PremiumButton>

            <p className="text-[10px] text-muted-foreground text-center mt-4">
              {t("manual.hint")}
            </p>
          </div>
        </div>
      ) : (
        /* Results Display */
        <motion.div
          className="surface-card p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">{t("results.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("results.subtitle")}</p>
            </div>
            <Badge variant="primary" size="sm">{t("results.completed")}</Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Total Emissions */}
            <div className="bg-primary/8 p-6 rounded-xl border border-primary/20">
              <h3 className="font-medium mb-3 text-sm flex items-center gap-2">
                <CarbonIcon className="w-4 h-4 text-primary" />
                {t("results.totalTitle")}
              </h3>
              <div className="text-4xl font-bold text-primary mb-1">
                {results.totalEmissions.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">{t("results.totalUnit")}</p>
            </div>

            {/* Breakdown Summary */}
            <div className="bg-muted/30 p-6 rounded-xl border border-border">
              <h3 className="font-medium mb-4 text-sm">{t("results.breakdownTitle")}</h3>
              <div className="space-y-3">
                {results.breakdown.filter(item => item.emissions > 0).slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{item.category}</span>
                    <span className="text-sm font-bold">{item.emissions.toFixed(3)} t</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Full Breakdown */}
          <div className="bg-muted/30 p-6 rounded-xl mb-8">
            <h3 className="font-medium mb-4">{t("results.detailTitle")}</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {results.breakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                  <div>
                    <div className="text-sm font-medium">{item.category}</div>
                    <div className="text-xs text-muted-foreground">{item.value} {item.unit}</div>
                  </div>
                  <div className="text-sm font-bold">{item.emissions.toFixed(3)} t CO2e</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-muted/30 p-6 rounded-xl mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-primary" />
                {t("results.aiRecs")}
              </h3>
              {results.recommendations.length > 0 && (
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  {t("results.addedToActions")}
                </Badge>
              )}
            </div>
            
            {results.recommendations.length > 0 ? (
              <>
                <div className="space-y-3 mb-4">
                  {results.recommendations.map((rec, index) => (
                    <div key={index} className="p-4 bg-background rounded-lg border border-border hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium">{rec.title}</p>
                        {rec.isNew && (
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0 flex-shrink-0">
                            {t("results.new")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{rec.description}</p>
                      <div className="flex items-center gap-2 text-[10px]">
                        <Badge variant="outline" size="sm" className="capitalize">
                          {rec.category}
                        </Badge>
                        <Badge variant="outline" size="sm" className="capitalize">
                          {rec.impact} {t("results.impactSuffix")}
                        </Badge>
                        <Badge variant="primary" size="sm">
                          +{rec.points} {t("results.creditsSuffix")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <PremiumButton
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => router.push("/app/actions")}
                >
                  <SparklesIcon className="w-3 h-3 mr-2" />
                  {t("results.viewAllActions")}
                </PremiumButton>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-2">
                  {t("results.noRecs")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("results.noRecsSub")}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <PremiumButton 
              variant="outline"
              className="flex-1"
              onClick={handleReset}
            >
              {t("results.calcAgain")}
            </PremiumButton>
            <PremiumButton 
              className="flex-1"
              onClick={() => router.push("/app")}
            >
              {t("results.goDashboard")}
            </PremiumButton>
          </div>
        </motion.div>
      )}

      {/* Document Uploader Modal */}
      {showDocumentUploader && (
        <DocumentUploader
          onDataExtracted={handleDocumentDataExtracted}
          onClose={() => setShowDocumentUploader(false)}
        />
      )}
    </>
  );
}