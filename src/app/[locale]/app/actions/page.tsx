"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkspaceAction, useWorkspaceResource, workspaceRequest } from "@/components/app/console/workspace-store";
import { useTranslations } from "next-intl";
import { ActionCard } from "@/components/app/ActionCard";
import { FundingPanel } from "@/components/app/console/FundingPanel";
import { EuFeedPanel } from "@/components/app/console/EuFeedPanel";
import { ExpertsPanel } from "@/components/app/console/ExpertsPanel";
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
  Empty,
  AiUnavailable
} from "@/components/app/console/kit";

function getIconByName(name: string) {
  const iconMap: Record<string, React.ReactNode> = {
    bolt: <BoltIcon className="w-4 h-4" />,
    fire: <FireIcon className="w-4 h-4" />,
    water: <WaterIcon className="w-4 h-4" />,
    leaf: <LeafIcon className="w-4 h-4" />,
    recycle: <RecycleIcon className="w-4 h-4" />,
    target: <TargetIcon className="w-4 h-4" />,
    bulb: <BulbIcon className="w-4 h-4" />
  };
  return iconMap[name] ?? <LeafIcon className="w-4 h-4" />;
}

export default function ActionsPage() {
  const t = useTranslations("dashboard.actions");
  const { user, refetchUser } = useUser();
  const [filter, setFilter] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const writer = useWorkspaceAction();

  // Shared records: the same copies the dashboard, leaderboard and agents read.
  const q = new URLSearchParams();
  if (filter !== "all") q.set("category", filter);
  if (user?.id) q.set("userId", user.id);
  const actionsRes = useWorkspaceResource<any[]>(`/api/actions${q.size ? `?${q}` : ""}`);
  const completedRes = useWorkspaceResource<Array<{ actionId: number }>>(user?.id ? `/api/actions/user/${user.id}` : null);
  const emissionsRes = useWorkspaceResource<Record<string, unknown> | null>(
    user?.id ? `/api/emissions?userId=${encodeURIComponent(user.id)}&latest=true` : null
  );

  const dbActions = useMemo(
    () =>
      (Array.isArray(actionsRes.data) ? actionsRes.data : []).map((action: any) => ({
        ...action,
        icon: getIconByName(action.iconName || "leaf"),
        isAI: !!(action.isCustom && action.userId)
      })),
    [actionsRes.data]
  );
  const completedActionIds = useMemo(
    () => (Array.isArray(completedRes.data) ? completedRes.data.map((c) => Number(c.actionId)) : []),
    [completedRes.data]
  );
  const userEmissions = emissionsRes.data && Object.keys(emissionsRes.data).length > 0 ? emissionsRes.data : null;

  const totalActions = dbActions.length;
  const completedCount = completedActionIds.length;
  const availableCount = Math.max(0, totalActions - completedCount);
  const aiActionsCount = dbActions.filter((a) => a.isAI).length;

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 150);
      }
    }
  }, [actionsRes.loading]);

  const calculateActionFigures = (action: any) => {
    const rawElec = (userEmissions as any)?.electricity;
    const rawWater = (userEmissions as any)?.water;
    const elecKwh = typeof rawElec === "number" && rawElec > 0 ? rawElec : 12_000;
    const waterM3 = typeof rawWater === "number" && rawWater > 0 ? rawWater : 180;
    const title = String(action.title || "").toLowerCase();

    if (title.includes("led") || title.includes("lighting")) {
      const savedKwh = Math.round(elecKwh * 0.12);
      const savedEur = Math.round(savedKwh * 0.24);
      const co2Kg = Math.round(savedKwh * 0.622);
      const cost = Math.round(savedEur * 1.5);
      return { costEur: cost, savedEurYr: savedEur, co2KgYr: co2Kg, paybackYrs: 1.5 };
    }
    if (title.includes("solar") || title.includes("pv") || title.includes("photovoltaic")) {
      const savedKwh = Math.round(elecKwh * 0.65);
      const savedEur = Math.round(savedKwh * 0.24);
      const co2Kg = Math.round(savedKwh * 0.622);
      const cost = Math.round(savedEur * 4.2);
      return { costEur: cost, savedEurYr: savedEur, co2KgYr: co2Kg, paybackYrs: 4.2 };
    }
    if (title.includes("water") || title.includes("fixture") || title.includes("aerator") || title.includes("low-flow")) {
      const savedM3 = Math.round(waterM3 * 0.25);
      const savedEur = Math.round(savedM3 * 2.2);
      const co2Kg = Math.round(savedM3 * 0.616);
      const cost = 180;
      return { costEur: cost, savedEurYr: savedEur, co2KgYr: co2Kg, paybackYrs: Math.max(0.6, Number((cost / (savedEur || 1)).toFixed(1))) };
    }
    if (title.includes("hvac") || title.includes("heat pump") || title.includes("ac") || title.includes("air condition") || title.includes("thermostat")) {
      const savedKwh = Math.round(elecKwh * 0.2);
      const savedEur = Math.round(savedKwh * 0.24);
      const co2Kg = Math.round(savedKwh * 0.622);
      const cost = Math.round(savedEur * 3.5);
      return { costEur: cost, savedEurYr: savedEur, co2KgYr: co2Kg, paybackYrs: 3.5 };
    }
    if (title.includes("route") || title.includes("fleet") || title.includes("vehicle") || title.includes("ev") || title.includes("diesel")) {
      const fuelL = 1200;
      const savedL = Math.round(fuelL * 0.15);
      const savedEur = Math.round(savedL * 1.55);
      const co2Kg = Math.round(savedL * 2.51);
      const cost = 350;
      return { costEur: cost, savedEurYr: savedEur, co2KgYr: co2Kg, paybackYrs: Number((cost / (savedEur || 1)).toFixed(1)) };
    }
    return {
      costEur: action.costEur ?? null,
      savedEurYr: action.savedEurYr ?? null,
      co2KgYr: action.co2KgYr ?? null,
      paybackYrs: action.paybackYrs ?? null,
    };
  };

  const generateAIActions = async () => {
    if (!user) {
      toast.error(t("toast.onboardFirst"));
      return;
    }
    // Suggestions must rest on this company's own numbers; without them we say so instead of guessing.
    if (!userEmissions) {
      toast.error("Add your first energy or fuel figures, then Vuneli can suggest actions for your company.");
      return;
    }
    setIsGenerating(true);
    setAiUnavailable(false);
    const existingTitles = dbActions.map((a) => String(a.title).toLowerCase());

    let generated: any[] = [];
    try {
      const context = {
        company: {
          name: user.companyName ?? null,
          industry: user.companyIndustry ?? null,
          teamSize: user.teamSize ?? null,
          country: user.countryCode ?? null
        },
        latestEmissions: userEmissions,
        completedActionsCount: completedCount,
        existingActionTitles: existingTitles
      };
      const result = await workspaceRequest<{ text?: string }>("/api/gemini/analyze", {
        method: "POST",
        body: {
          prompt: `You are a sustainability advisor for small and medium companies in Cyprus. Using only the company data above, suggest 3 new carbon reduction actions that are not in existingActionTitles.
Return ONLY valid JSON:
[{"title": "max 60 chars", "description": "max 200 chars", "impact": "high|medium|low", "difficulty": "easy|medium|hard", "category": "energy|waste|water|operations", "points": 50-500, "iconName": "bolt|fire|water|leaf|recycle|target|bulb"}]`,
          context: JSON.stringify(context)
        }
      });
      const match = result.text?.match(/\[[\s\S]*\]/);
      generated = match ? JSON.parse(match[0]) : [];
    } catch {
      generated = [];
    }

    if (!Array.isArray(generated) || generated.length === 0) {
      setAiUnavailable(true);
      setIsGenerating(false);
      return;
    }

    const unique = generated.filter((a: any) => {
      if (typeof a?.title !== "string" || typeof a?.description !== "string") return false;
      const title = a.title.toLowerCase();
      return !existingTitles.some((e) => title.includes(e) || e.includes(title));
    });
    if (unique.length === 0) {
      toast.info(t("toast.allExist"));
      setIsGenerating(false);
      return;
    }

    let saved = 0;
    for (const a of unique) {
      const ok = await writer.run("/api/actions", {
        method: "POST",
        body: {
          userId: user.id,
          title: a.title.slice(0, 120),
          description: a.description.slice(0, 500),
          category: ["energy", "waste", "water", "operations"].includes(a.category) ? a.category : "energy",
          impact: ["high", "medium", "low"].includes(a.impact) ? a.impact : "medium",
          difficulty: ["easy", "medium", "hard"].includes(a.difficulty) ? a.difficulty : "medium",
          points: typeof a.points === "number" && a.points > 0 ? Math.min(500, Math.round(a.points)) : 200,
          iconName: typeof a.iconName === "string" ? a.iconName : "leaf"
        },
        invalidates: ["/api/actions"]
      });
      if (ok) saved++;
    }
    setIsGenerating(false);
    if (saved > 0) toast.success(t("toast.savedN", { count: saved }));
    else toast.error(t("toast.generateFailed"));
  };

  const [completingIds, setCompletingIds] = useState<Set<number>>(new Set());

  // One click: marks the action done, credits the account, and every page (dashboard, leaderboard) updates.
  const handleCompleteAction = async (actionId: number, points: number) => {
    if (!user) {
      toast.error(t("toast.onboardFirst"));
      return;
    }
    if (completedActionIds.includes(actionId) || completingIds.has(actionId)) {
      toast.info(t("toast.already"));
      return;
    }
    setCompletingIds((prev) => new Set(prev).add(actionId));
    try {
      const ok = await writer.run("/api/actions/complete", {
        method: "POST",
        body: { actionId },
        invalidates: ["/api/actions", "/api/users", "/api/leaderboard"]
      });
      if (!ok) {
        toast.error(t("toast.completeFailed"));
        return;
      }
      await refetchUser();
      toast.success(t("toast.creditsEarned", { points }));
    } finally {
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.delete(actionId);
        return next;
      });
    }
  };

  const aiActions = dbActions.filter((a) => a.isAI);
  const regularActions = dbActions.filter((a) => !a.isAI);

  const categories = ["all", "energy", "waste", "water", "operations"] as const;

  return (
    <PageShell
      loading={actionsRes.loading}
      error={actionsRes.error ? t("toast.loadFailed") : null}
      onRetry={actionsRes.reload}
      header={
        <PageHeader
          title={t("title")}
          purpose={t("subtitle")}
          actions={
            <button
              type="button"
              onClick={generateAIActions}
              disabled={isGenerating}
              className="vck-btn"
            >
              {isGenerating ? t("generating") : t("aiGenerate")}
              {aiActionsCount > 0 && <span className="vck-tag vck-num">{aiActionsCount}</span>}
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
      <Section title={t("progress")}>
        <MetricRow columns={3}>
          <Metric label={t("completed")} value={actionsRes.loading ? "—" : completedCount} />
          <Metric label={t("available")} value={actionsRes.loading ? "—" : availableCount} />
          <Metric label={t("creditsEarned")} value={actionsRes.loading ? "—" : (user?.totalCredits || 0)} />
        </MetricRow>
      </Section>

      {aiUnavailable && !isGenerating && (
        <Section>
          <AiUnavailable feature="generate personalised actions" onRetry={generateAIActions} />
        </Section>
      )}

      {aiActions.length > 0 && (
        <Section title={t("aiSection")} description={t("aiBadge")}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {aiActions.map((action) => {
              const figs = calculateActionFigures(action);
              return (
                <ActionCard
                  key={action.id}
                  title={action.title}
                  description={action.description}
                  impact={action.impact}
                  difficulty={action.difficulty}
                  points={action.points}
                  costEur={figs.costEur}
                  savedEurYr={figs.savedEurYr}
                  co2KgYr={figs.co2KgYr}
                  paybackYrs={figs.paybackYrs}
                  completed={completedActionIds.includes(action.id) || completingIds.has(action.id)}
                  onComplete={() => handleCompleteAction(action.id, action.points)}
                />
              );
            })}
          </div>
        </Section>
      )}

      {regularActions.length > 0 && (
        <Section title={aiActions.length > 0 ? t("standardSection") : t("steps")}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {regularActions.map((action) => {
              const figs = calculateActionFigures(action);
              return (
                <ActionCard
                  key={action.id}
                  title={action.title}
                  description={action.description}
                  impact={action.impact}
                  difficulty={action.difficulty}
                  points={action.points}
                  costEur={figs.costEur}
                  savedEurYr={figs.savedEurYr}
                  co2KgYr={figs.co2KgYr}
                  paybackYrs={figs.paybackYrs}
                  completed={completedActionIds.includes(action.id) || completingIds.has(action.id)}
                  onComplete={() => handleCompleteAction(action.id, action.points)}
                />
              );
            })}
          </div>
        </Section>
      )}

      {regularActions.length === 0 && aiActions.length === 0 && !actionsRes.loading && (
        <Section title={t("steps")}>
          <Empty
            title={t("noneTitle")}
            body={t("noneBody")}
          />
        </Section>
      )}

      <FundingPanel />
      <EuFeedPanel source="ted" />
      <ExpertsPanel />
    </PageShell>
  );
}
