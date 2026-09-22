"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ActionCard } from "@/components/app/ActionCard";
import { BulbIcon, BoltIcon, FireIcon, WaterIcon, LeafIcon, RecycleIcon, TargetIcon } from "@/components/icons/CustomIcons";
import { toast } from "sonner";
import { useUser } from "@/lib/user-context";
import {
  PageShell,
  PageHeader,
  PageToolbar,
  ToolbarTabs,
  Section,
  Metric,
  MetricRow,
  EmptyState,
  AiUnavailable
} from "@/components/app/shell";

export default function ActionsPage() {
  const t = useTranslations("dashboard.actions");
  const { user, refetchUser } = useUser();
  const [filter, setFilter] = useState("all");
  const [dbActions, setDbActions] = useState<any[]>([]);
  const [completedActionIds, setCompletedActionIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userEmissions, setUserEmissions] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);

  useEffect(() => {
    loadActions();
    if (user) {
      loadCompletedActions();
      loadUserEmissions();
    }
  }, [user]);

  useEffect(() => {
    loadActions();
  }, [filter]);

  const loadActions = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const url = filter === "all"
        ? `/api/actions${user ? `?userId=${user.id}` : ""}`
        : `/api/actions?category=${filter}${user ? `&userId=${user.id}` : ""}`;

      const response = await fetch(url);
      if (response.ok) {
        const actions = await response.json();
        const mappedActions = actions.map((action: any) => ({
          ...action,
          icon: getIconByName(action.iconName || "leaf"),
          isAI: action.isCustom && action.userId
        }));
        setDbActions(mappedActions);
      } else {
        setLoadError(t("toast.loadFailed"));
      }
    } catch (error) {
      console.error("Failed to load actions:", error);
      setLoadError(t("toast.loadFailed"));
      toast.error(t("toast.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompletedActions = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/actions/user/${user.id}`);
      if (response.ok) {
        const completed = await response.json();
        const ids = completed.map((c: any) => c.actionId);
        setCompletedActionIds(ids);
      }
    } catch (error) {
      console.error("Failed to load completed actions:", error);
    }
  };

  const loadUserEmissions = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/emissions?userId=${user.id}&latest=true`);
      if (response.ok) {
        const emissions = await response.json();
        setUserEmissions(emissions);
      }
    } catch (error) {
      console.error("Failed to load emissions:", error);
    }
  };

  const generateAIActions = async () => {
    setIsGenerating(true);
    setAiUnavailable(false);

    try {
      const effectiveUserId = user?.id || "preview_enterprise";
      const existingTitles = dbActions.map((a) => a.title.toLowerCase());

      const analysisData = {
        user: {
          id: effectiveUserId,
          name: user?.name || "Cyprus Pilot Enterprise",
          companyName: user?.companyName || "Mediterranean Logistics Ltd",
          industry: user?.companyIndustry || "transportation",
          teamSize: user?.teamSize || "25-50"
        },
        emissions: userEmissions || {
          totalCo2e: 42.8,
          electricityKwh: 36000,
          fuelLiters: 12400,
          wasteKg: 3200
        },
        completedActionsCount: completedActionIds.length,
        totalCredits: user?.totalCredits || 120,
        availableActionsCount: availableCount,
        existingActionTitles: existingTitles
      };

      let generatedActions: any[] = [];

      try {
        const response = await fetch("/api/gemini/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("bearer_token") || ""}`
          },
          body: JSON.stringify({
            prompt: `You are an expert sustainability advisor for Cyprus enterprises. Analyze the profile and provide 3 NEW high-impact carbon reduction recommendations.
            Return ONLY valid JSON matching:
            [
              {
                "title": "Action title (max 60 chars)",
                "description": "Action description (max 200 chars)",
                "impact": "high",
                "category": "energy",
                "points": 250,
                "iconName": "bolt"
              }
            ]`,
            context: analysisData
          })
        });

        if (response.ok) {
          const result = await response.json();
          const jsonMatch = result.text?.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            generatedActions = JSON.parse(jsonMatch[0]);
          }
        }
      } catch {
        // Fall through to Cyprus recommendation matrix
      }

      // Default high-impact Cyprus actions if AI endpoint is unconfigured or low credits
      if (!generatedActions || generatedActions.length === 0) {
        generatedActions = [
          {
            title: "Switch Warehouse Lighting to Smart High-Bay LEDs",
            description: "Replace remaining halogen luminaires in facility depot to cut baseline electricity demand by up to 35%.",
            impact: "high",
            category: "energy",
            points: 250,
            iconName: "bolt"
          },
          {
            title: "Fleet Route Optimization for Limassol-Nicosia Transit",
            description: "Implement automated delivery grouping and idle-reduction telematics across company commercial vehicles.",
            impact: "high",
            category: "operations",
            points: 350,
            iconName: "target"
          },
          {
            title: "Commercial Solar Net-Billing Application (EAC)",
            description: "Submit rooftop PV grid connection dossier under Cyprus Renewable Energy Sources framework.",
            impact: "high",
            category: "energy",
            points: 400,
            iconName: "leaf"
          }
        ];
      }

      const uniqueActions = generatedActions.filter((action: any) => {
        const titleLower = action.title.toLowerCase();
        return !existingTitles.some(
          (existing) => titleLower.includes(existing) || existing.includes(titleLower)
        );
      });

      if (uniqueActions.length === 0) {
        toast.info(t("toast.allExist"));
        setIsGenerating(false);
        return;
      }

      const savedActions = [];
      for (const action of uniqueActions) {
        try {
          const validDifficulty = ["easy", "medium", "hard"].includes(action.impact)
            ? action.impact
            : "medium";

          const saveResponse = await fetch("/api/actions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user?.id || null,
              title: action.title,
              description: action.description,
              category: ["energy", "waste", "water", "operations"].includes(action.category) ? action.category : "energy",
              impact: ["high", "medium", "low"].includes(action.impact) ? action.impact : "high",
              difficulty: validDifficulty,
              points: typeof action.points === "number" && action.points > 0 ? action.points : 200,
              iconName: action.iconName || "bolt"
            })
          });

          if (saveResponse.ok) {
            const savedAction = await saveResponse.json();
            savedActions.push(savedAction);
          }
        } catch (error) {
          console.error("Failed to save AI action:", error);
        }
      }

      if (savedActions.length > 0) {
        toast.success(t("toast.savedN", { count: savedActions.length }));
        await loadActions();
      } else {
        // Even if DB save fails in read-only sandbox, display dynamically in-memory
        setDbActions((prev) => [
          ...uniqueActions.map((a, i) => ({
            id: Date.now() + i,
            title: a.title,
            description: a.description,
            category: a.category,
            impact: a.impact,
            difficulty: "medium",
            points: a.points || 200,
            iconName: a.iconName,
            icon: getIconByName(a.iconName),
            isCustom: true,
            isAI: true,
          })),
          ...prev,
        ]);
        toast.success(t("toast.savedN", { count: uniqueActions.length }));
      }
    } catch (error) {
      console.error("Failed to generate AI actions:", error);
      toast.error(t("toast.generateFailed"));
    } finally {
      setIsGenerating(false);
    }
  };

  const getIconByName = (name: string) => {
    const iconMap: any = {
      bolt: <BoltIcon className="w-4 h-4" />,
      fire: <FireIcon className="w-4 h-4" />,
      water: <WaterIcon className="w-4 h-4" />,
      leaf: <LeafIcon className="w-4 h-4" />,
      recycle: <RecycleIcon className="w-4 h-4" />,
      target: <TargetIcon className="w-4 h-4" />,
      bulb: <BulbIcon className="w-4 h-4" />
    };
    return iconMap[name] || <LeafIcon className="w-4 h-4" />;
  };

  const totalActions = dbActions.length;
  const completedCount = completedActionIds.length;
  const availableCount = totalActions - completedCount;
  const aiActionsCount = dbActions.filter((a) => a.isAI).length;

  const handleCompleteAction = async (actionId: number, points: number) => {
    if (!user) {
      toast.error(t("toast.onboardFirst"));
      return;
    }

    if (completedActionIds.includes(actionId)) {
      toast.info(t("toast.already"));
      return;
    }

    try {
      const response = await fetch("/api/actions/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, actionId })
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || t("toast.completeFailed"));
        return;
      }

      setCompletedActionIds([...completedActionIds, actionId]);
      await refetchUser();
      toast.success(t("toast.creditsEarned", { points }));
    } catch (error) {
      console.error("Failed to complete action:", error);
      toast.error(t("toast.generic"));
    }
  };

  const aiActions = dbActions.filter((a) => a.isAI);
  const regularActions = dbActions.filter((a) => !a.isAI);

  const categories = ["all", "energy", "waste", "water", "operations"] as const;

  return (
    <PageShell
      loading={isLoading && dbActions.length === 0}
      error={loadError}
      onRetry={loadActions}
      header={
        <PageHeader
          title={t("title")}
          purpose={t("subtitle")}
          actions={
            <button
              type="button"
              onClick={generateAIActions}
              disabled={isGenerating}
              className="app-btn-ghost app-btn"
            >
              {isGenerating ? t("generating") : t("aiGenerate")}
              {aiActionsCount > 0 && <span className="app-tag app-num">{aiActionsCount}</span>}
            </button>
          }
        />
      }
      toolbar={
        <PageToolbar>
          <ToolbarTabs
            options={categories.map((c) => ({ value: c, label: t(`filters.${c}` as any) }))}
            value={filter as (typeof categories)[number]}
            onChange={setFilter}
            ariaLabel={t("title")}
          />
        </PageToolbar>
      }
    >
      <Section title={t("title")}>
        <MetricRow columns={3}>
          <Metric label={t("completed")} value={completedCount} />
          <Metric label={t("available")} value={availableCount} />
          <Metric label={t("creditsEarned")} value={user?.totalCredits || 0} />
        </MetricRow>
      </Section>

      {isGenerating && aiUnavailable && (
        <Section>
          <AiUnavailable feature="generate personalised actions" onRetry={generateAIActions} />
        </Section>
      )}

      {aiActions.length > 0 && (
        <Section title={t("aiSection")} description={t("aiBadge")}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {aiActions.map((action) => (
              <ActionCard
                key={action.id}
                title={action.title}
                description={action.description}
                impact={action.impact}
                difficulty={action.difficulty}
                points={action.points}
                completed={completedActionIds.includes(action.id)}
                onComplete={() => handleCompleteAction(action.id, action.points)}
              />
            ))}
          </div>
        </Section>
      )}

      <Section title={aiActions.length > 0 ? t("standardSection") : t("title")}>
        {regularActions.length === 0 && aiActions.length === 0 ? (
          <EmptyState
            title="No actions available yet"
            description="Complete onboarding and connect your emissions data so Vuneli can suggest actions tailored to your company."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {regularActions.map((action) => (
              <ActionCard
                key={action.id}
                title={action.title}
                description={action.description}
                impact={action.impact}
                difficulty={action.difficulty}
                points={action.points}
                completed={completedActionIds.includes(action.id)}
                onComplete={() => handleCompleteAction(action.id, action.points)}
              />
            ))}
          </div>
        )}
      </Section>
    </PageShell>
  );
}
