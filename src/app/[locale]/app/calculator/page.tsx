"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEmissionCalculator } from "@/hooks/useEmissionCalculator";
import { DocumentUploader } from "@/components/DocumentUploader";
import { useSession } from "@/lib/auth-client";
import {
  calculateFromReferenceFactors,
  usedSources,
} from "@/lib/emissions/reference-factors";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
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

export default function CalculatorPage() {
  const router = useRouter();
  const t = useTranslations("dashboard.calculator");
  const { data: session, isPending: isSessionLoading } = useSession();
  const { calculateBatch } = useEmissionCalculator();
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [useRealAPI, setUseRealAPI] = useState(true);
  const [showDocumentUploader, setShowDocumentUploader] = useState(false);
  const [userRegion, setUserRegion] = useState<string>("");
  const [aiRecsFailed, setAiRecsFailed] = useState(false);

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
    method: "climatiq" | "reference-factors";
    sources: string[];
  } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isSessionLoading && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth");
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
        setAiRecsFailed(true);
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

      setAiRecsFailed(false);
      return savedRecommendations;
    } catch (error) {
      console.error('AI recommendation generation failed:', error);
      setAiRecsFailed(true);
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
      if (!APP_OPEN_ACCESS) router.push("/auth");
      return;
    }

    if (!isFormValid()) {
      toast.error(t("toasts.enterValue"));
      return;
    }

    setIsCalculating(true);
    setAiRecsFailed(false);

    try {
      let totalEmissions = 0;
      let emissionsBreakdown: any[] = [];
      let method: "climatiq" | "reference-factors" = "climatiq";
      let sources: string[] = [];

      const inputs = {
        electricity: parseFloat(formData.electricity) || 0,
        gas: parseFloat(formData.gas) || 0,
        water: parseFloat(formData.water) || 0,
        waste: parseFloat(formData.waste) || 0,
        transport: parseFloat(formData.transport) || 0,
      };

      const useReferenceFactors = () => {
        const reference = calculateFromReferenceFactors(inputs, categoryLabels());
        totalEmissions = reference.totalTonnes;
        emissionsBreakdown = reference.breakdown;
        method = "reference-factors";
        sources = usedSources(reference.breakdown);
      };

      if (useRealAPI) {
        try {
          const result = await calculateBatch({
            electricity_kwh: inputs.electricity,
            gas_m3: inputs.gas,
            water_liters: inputs.water,
            waste_kg: inputs.waste,
            transport_km: inputs.transport,
            region: userRegion || "CY",
          });

          totalEmissions = result.total_co2e_tonnes;
          emissionsBreakdown = result.breakdown.map((item) => ({
            category: item.category,
            value: item.input_value,
            unit: item.input_unit,
            emissions: item.co2e_tonnes,
          }));
          sources = ["Climatiq emission factor database"];

          toast.success(t("toasts.calcOk"));
        } catch (error) {
          console.error("Climatiq API error, using published reference factors:", error);
          toast.warning(t("toasts.calcFallback"));
          useReferenceFactors();
        }
      } else {
        useReferenceFactors();
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
        method,
        sources,
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

      const periodStart = new Date(year, month - 1, 1).toISOString();
      const periodEnd = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;

      // Trend needs a real earlier reading. Without one the trend is zero.
      let prevTotalCo2e = totalCo2e;
      try {
        const prevEmissionsResponse = await fetch(
          `/api/emissions?userId=${userId}&year=${prevYear}&month=${prevMonth}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (prevEmissionsResponse.ok) {
          const prevData = await prevEmissionsResponse.json();
          if (Array.isArray(prevData) && prevData.length > 0 && typeof prevData[0].totalCo2e === "number") {
            prevTotalCo2e = prevData[0].totalCo2e;
          }
        }
      } catch (error) {
        console.error("Failed to read the previous period:", error);
      }

      // Only the carbon footprint is measured here. Renewable share, resource
      // efficiency and waste diversion need data this form does not collect,
      // so they are not written.
      await fetch("/api/dashboard/metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          metricType: "carbon_footprint",
          currentValue: totalCo2e,
          previousValue: prevTotalCo2e,
          periodStart,
          periodEnd,
        }),
      });

      await fetch("/api/dashboard/historical", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
        }),
      });
    } catch (error) {
      console.error("Failed to update dashboard metrics:", error);
    }
  };


  const categoryLabels = () => ({
    electricity: t("categories.electricity"),
    gas: t("categories.gas"),
    water: t("categories.water"),
    waste: t("categories.waste"),
    transport: t("categories.transport"),
  });


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
    setAiRecsFailed(false);
    setFormData({
      electricity: "",
      gas: "",
      water: "",
      waste: "",
      transport: ""
    });
    localStorage.removeItem("calculator_draft");
  };

  // Don't render if no session
  if (!isSessionLoading && !session?.user) {
    return null;
  }

  return (
    <PageShell
      loading={isSessionLoading}
      header={<PageHeader title={t("title")} purpose={t("subtitle")} />}
    >
      {!results ? (
        <>
          <Section title={t("ai.heading")} description={t("ai.description")}>
            <div className="app-card p-6">
              <button
                type="button"
                onClick={() => setShowDocumentUploader(true)}
                className="w-full border border-[var(--app-rule-strong)] rounded-md p-8 text-center hover:bg-[var(--app-surface-2)] transition-colors"
              >
                <h3 className="text-[1.0625rem] font-semibold mb-2">{t("ai.uploadTitle")}</h3>
                <p className="app-meta max-w-lg mx-auto mb-4 break-words">{t("ai.uploadDescription")}</p>
                <span className="app-btn inline-flex">{t("ai.uploadCta")}</span>
              </button>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  t("ai.types.pdf"),
                  t("ai.types.excel"),
                  t("ai.types.images"),
                  t("ai.types.gas"),
                  t("ai.types.water"),
                  t("ai.types.transport")
                ].map((label) => (
                  <div key={label} className="app-card-inset px-3 py-3 text-center">
                    <p className="text-sm font-medium break-words">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid sm:grid-cols-3 gap-3">
                <div className="app-card-inset p-4">
                  <h4 className="text-sm font-semibold mb-1">{t("ai.features.smartTitle")}</h4>
                  <p className="app-meta break-words">{t("ai.features.smartDesc")}</p>
                </div>
                <div className="app-card-inset p-4">
                  <h4 className="text-sm font-semibold mb-1">{t("ai.features.multiTitle")}</h4>
                  <p className="app-meta break-words">{t("ai.features.multiDesc")}</p>
                </div>
                <div className="app-card-inset p-4">
                  <h4 className="text-sm font-semibold mb-1">{t("ai.features.autoTitle")}</h4>
                  <p className="app-meta break-words">{t("ai.features.autoDesc")}</p>
                </div>
              </div>
            </div>
          </Section>

          <Section title={t("manual.title")} description={t("manual.hint")}>
            <div className="app-card p-6 max-w-xl">
              <div className="flex items-center justify-between mb-5">
                <span className="app-tag">{t("manual.monthly")}</span>
              </div>

              <div className="space-y-4 mb-6">
                <label className="block">
                  <span className="app-label block mb-1.5">{t("manual.electricity")}</span>
                  <input
                    type="number"
                    value={formData.electricity}
                    onChange={(e) => setFormData({ ...formData, electricity: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-md text-sm"
                    placeholder="500"
                  />
                </label>

                <label className="block">
                  <span className="app-label block mb-1.5">{t("manual.gas")}</span>
                  <input
                    type="number"
                    value={formData.gas}
                    onChange={(e) => setFormData({ ...formData, gas: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-md text-sm"
                    placeholder="100"
                  />
                </label>

                <label className="block">
                  <span className="app-label block mb-1.5">{t("manual.water")}</span>
                  <input
                    type="number"
                    value={formData.water}
                    onChange={(e) => setFormData({ ...formData, water: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-md text-sm"
                    placeholder="10000"
                  />
                </label>

                <label className="block">
                  <span className="app-label block mb-1.5">{t("manual.waste")}</span>
                  <input
                    type="number"
                    value={formData.waste}
                    onChange={(e) => setFormData({ ...formData, waste: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-md text-sm"
                    placeholder="200"
                  />
                </label>

                <label className="block">
                  <span className="app-label block mb-1.5">{t("manual.transport")}</span>
                  <input
                    type="number"
                    value={formData.transport}
                    onChange={(e) => setFormData({ ...formData, transport: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-md text-sm"
                    placeholder="1000"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between app-card-inset px-3 py-3 mb-6">
                <span className="text-sm font-medium">{t("manual.climatiq")}</span>
                <button
                  type="button"
                  onClick={() => setUseRealAPI(!useRealAPI)}
                  aria-pressed={useRealAPI}
                  className={`relative inline-flex h-6 w-11 items-center rounded-md transition-colors border border-[var(--app-rule-strong)] ${
                    useRealAPI ? "bg-primary" : "bg-transparent"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-sm bg-[var(--primary-foreground)] transition-transform ${
                      useRealAPI ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={calculateEmissions}
                disabled={isCalculating || !isFormValid()}
                className="app-btn w-full"
              >
                {isCalculating ? t("manual.calculating") : t("manual.calculate")}
              </button>

              <p className="app-meta text-center mt-4">{t("manual.hint")}</p>
            </div>
          </Section>
        </>
      ) : (
        <>
          <Section title={t("results.title")} description={t("results.subtitle")} action={<span className="app-tag">{t("results.completed")}</span>}>
            <MetricRow columns={2}>
              <Metric label={t("results.totalTitle")} value={results.totalEmissions.toFixed(2)} unit={t("results.totalUnit")} />
              <Metric
                label={t("results.breakdownTitle")}
                value={results.breakdown.filter((item) => item.emissions > 0).length}
                unit="categories"
                note={results.breakdown
                  .filter((item) => item.emissions > 0)
                  .slice(0, 3)
                  .map((item) => `${item.category}: ${item.emissions.toFixed(3)} t`)
                  .join(" · ")}
              />
            </MetricRow>
          </Section>

          <Section title={t("results.detailTitle")}>
            <DataTable
              columns={[
                { key: "category", header: "Category", render: (r) => r.category },
                { key: "input", header: "Input", render: (r) => `${r.value} ${r.unit}` },
                { key: "emissions", header: "Emissions", numeric: true, render: (r) => `${r.emissions.toFixed(3)} t CO2e` }
              ]}
              rows={results.breakdown}
              rowKey={(r) => r.category}
            />
          </Section>

          <Section title={t("results.aiRecs")} action={results.recommendations.length > 0 ? <span className="app-tag" data-tone="positive">{t("results.addedToActions")}</span> : undefined}>
            {aiRecsFailed ? (
              <AiUnavailable feature="generate personalized recommendations" />
            ) : results.recommendations.length > 0 ? (
              <>
                <DataTable
                  columns={[
                    {
                      key: "title",
                      header: "Recommendation",
                      render: (r) => (
                        <div>
                          <p className="text-sm font-medium break-words">
                            {r.title} {r.isNew && <span className="app-tag ml-1.5">{t("results.new")}</span>}
                          </p>
                          <p className="app-meta mt-1 break-words">{r.description}</p>
                        </div>
                      )
                    },
                    { key: "category", header: "Category", hideOnMobile: true, render: (r) => r.category },
                    { key: "impact", header: "Impact", hideOnMobile: true, render: (r) => `${r.impact} ${t("results.impactSuffix")}` },
                    { key: "points", header: "Credits", numeric: true, render: (r) => `+${r.points}` }
                  ]}
                  rows={results.recommendations}
                  rowKey={(r, i) => `${r.title}-${i}`}
                />
                <div className="mt-3">
                  <button type="button" onClick={() => router.push("/app/actions")} className="app-btn-ghost app-btn w-full">
                    {t("results.viewAllActions")}
                  </button>
                </div>
              </>
            ) : (
              <EmptyState title={t("results.noRecs")} description={t("results.noRecsSub")} />
            )}
          </Section>

          <div className="flex gap-3">
            <button type="button" onClick={handleReset} className="app-btn-ghost app-btn flex-1">
              {t("results.calcAgain")}
            </button>
            <button type="button" onClick={() => router.push("/app")} className="app-btn flex-1">
              {t("results.goDashboard")}
            </button>
          </div>
        </>
      )}

      {showDocumentUploader && (
        <DocumentUploader
          onDataExtracted={handleDocumentDataExtracted}
          onClose={() => setShowDocumentUploader(false)}
        />
      )}
    </PageShell>
  );
}
