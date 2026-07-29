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
    if (!user) {
      toast.error(t("toast.onboardFirst"));
      return;
    }

    setIsGenerating(true);
    setAiUnavailable(false);

    try {
      if (!userEmissions) {
        toast.info(t("toast.needProfile"));
        setIsGenerating(false);
        return;
      }

      const completionRate = totalActions > 0 ? (completedActionIds.length / totalActions) * 100 : 0;

      if (completionRate > 80) {
        toast.success(t("toast.excellent"));
        setIsGenerating(false);
        return;
      }

      const existingTitles = dbActions.map((a) => a.title.toLowerCase());

      const analysisData = {
        user: {
          id: user.id,
          name: user.name,
          companyName: user.companyName,
          industry: user.companyIndustry,
          teamSize: user.teamSize
        },
        emissions: userEmissions,
        completedActionsCount: completedActionIds.length,
        totalCredits: user.totalCredits,
        availableActionsCount: availableCount,
        existingActionTitles: existingTitles
      };

      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `You are an expert sustainability advisor. Analyze the following company data and determine if personalized recommendations are needed.

Company Profile:
- Name: ${analysisData.user.companyName || "Not specified"}
- Industry: ${analysisData.user.industry || "Not specified"}
- Team Size: ${analysisData.user.teamSize || "Not specified"}

Current Progress:
- Actions Completed: ${analysisData.completedActionsCount}
- Available Actions Remaining: ${analysisData.availableActionsCount}
- Total Credits Earned: ${analysisData.totalCredits}

Emissions Data:
${JSON.stringify(userEmissions, null, 2)}

Existing Actions (DO NOT DUPLICATE):
${existingTitles.join(", ")}

IMPORTANT RULES:
1. If emissions are already low/excellent and user has completed many actions, return an empty array []
2. Only recommend actions that DON'T already exist in the existing actions list
3. Focus on HIGH-IMPACT opportunities based on their emissions data
4. If no meaningful recommendations are possible, return []

Analyze the data and either:
- Return [] if everything is good or no new recommendations are needed
- Return 3-5 NEW, high-impact recommendations (not duplicates) if there are real opportunities

Return ONLY valid JSON (no markdown, no explanations):
[]
OR
[
  {
 "title": "Unique action title (max 60 chars, DIFFERENT from existing)",
 "description": "Detailed description (max 200 chars)",
 "impact": "medium|high",
 "category": "energy|waste|water|operations",
 "points": 100-500,
 "iconName": "bolt|fire|water|leaf|recycle|target|bulb",
 "estimatedSavings": "e.g., 500 kg CO2/year"
  }
]`,
          context: analysisData
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate recommendations");
      }

      const result = await response.json();

      let generatedActions = [];
      try {
        const jsonMatch = result.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          generatedActions = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No valid JSON found in response");
        }
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        toast.error(t("toast.parseFailed"));
        return;
      }

      if (generatedActions.length === 0) {
        toast.success(t("toast.topShape"));
        setIsGenerating(false);
        return;
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
          const saveResponse = await fetch("/api/actions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              title: action.title,
              description: action.description,
              category: action.category,
              impact: action.impact,
              difficulty: action.impact,
              points: action.points,
              iconName: action.iconName
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
        toast.error(t("toast.saveFailed"));
      }
    } catch (error) {
      console.error("Failed to generate AI actions:", error);
      setAiUnavailable(true);
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
              disabled={isGenerating || !user}
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
