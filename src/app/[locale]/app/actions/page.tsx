"use client";

import { useMemo, useState } from "react";
import { useWorkspaceAction, useWorkspaceResource, workspaceRequest } from "@/components/app/console/workspace-store";
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

  // One click: marks the action done, credits the account, and every page (dashboard, leaderboard) updates.
  const handleCompleteAction = async (actionId: number, points: number) => {
    if (!user) {
      toast.error(t("toast.onboardFirst"));
      return;
    }
    if (completedActionIds.includes(actionId)) {
      toast.info(t("toast.already"));
      return;
    }
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
      <Section title={t("title")}>
        <MetricRow columns={3}>
          <Metric label={t("completed")} value={completedCount} />
          <Metric label={t("available")} value={availableCount} />
          <Metric label={t("creditsEarned")} value={user?.totalCredits || 0} />
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
          <Empty
            title="No actions available yet"
            body="Complete onboarding and connect your emissions data so Vuneli can suggest actions tailored to your company."
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
