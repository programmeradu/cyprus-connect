/**
 * "What changed" on the overview. Pure: reads the workspace records and states
 * what moved, what is short and what needs a decision. Nothing is hand-written.
 */

import type { ConsoleOverviewData } from "@/components/app/console/types";
import { daysUntil, fmtNumber, fmtSigned, relativeTime, toneFor } from "@/components/app/console/types";
import { titleCase } from "./text";

export type Insight = {
  id: string;
  tone: "bad" | "warn" | "good" | "info";
  label: string;
  headline: string;
  detail: string;
  href: string;
  linkLabel: string;
};

const TONE_RANK: Record<Insight["tone"], number> = { bad: 0, warn: 1, info: 2, good: 3 };

/** Open obligations, soonest first. */
export function dueObligationsOf(data: Pick<ConsoleOverviewData, "obligations">) {
  return [...data.obligations]
    .filter((o) => daysUntil(o.dueDate) >= 0)
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate));
}

export function buildInsights(data: ConsoleOverviewData, limit = 4): Insight[] {
  const { metrics, runs, tasks, connections } = data;
  const insights: Insight[] = [];
  const byKey = (key: string) => metrics.find((m) => m.key === key);

  const mover = [...metrics]
    .filter((m) => Number.isFinite(m.delta) && Math.abs(m.delta) >= 1)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  if (mover) {
    const tone = toneFor(mover.delta, mover.goodDirection);
    insights.push({
      id: "mover",
      tone: tone === "good" ? "good" : tone === "bad" ? "warn" : "info",
      label: "Largest move",
      headline: `${mover.shortLabel ?? mover.label} ${fmtSigned(mover.delta)}`,
      detail: `Now ${fmtNumber(mover.current, mover.precision)} ${mover.unit} against the last period.`,
      href: "/app/analytics",
      linkLabel: `Open ${mover.label}`,
    });
  }

  const failedRuns = runs.filter((r) => r.status === "needs_review");
  if (failedRuns.length) {
    insights.push({
      id: "runs",
      tone: "bad",
      label: "Agent run",
      headline: `${failedRuns.length} run${failedRuns.length === 1 ? "" : "s"} need a review`,
      detail: failedRuns[0].summary ?? "Open the workforce to read the run log.",
      href: "/app/insights",
      linkLabel: "Open the agent workforce",
    });
  }

  const highTasks = tasks.filter((t) => t.severity === "high");
  if (tasks.length) {
    insights.push({
      id: "tasks",
      tone: highTasks.length ? "warn" : "info",
      label: "Decision",
      headline: `${tasks.length} ${tasks.length === 1 ? "item waits" : "items wait"} for a person`,
      detail: highTasks.length ? `${highTasks.length} of them are marked high. ${highTasks[0].title}.` : tasks[0].title,
      href: "/app/actions",
      linkLabel: "Open the approval queue",
    });
  }

  const weak = [...connections]
    .filter((c) => c.status !== "available" && c.coveragePct !== null)
    .sort((a, b) => (a.coveragePct ?? 0) - (b.coveragePct ?? 0))[0];
  if (weak && weak.coveragePct !== null && weak.coveragePct < 85) {
    insights.push({
      id: "coverage",
      tone: weak.coveragePct < 60 ? "warn" : "info",
      label: "Evidence gap",
      headline: `${weak.provider} covers ${Math.round(weak.coveragePct)}%`,
      detail: `${titleCase(weak.category)} records, synced ${relativeTime(weak.lastSyncAt)}.`,
      href: "/app/integrations",
      linkLabel: "Open connections",
    });
  }

  const pressing = dueObligationsOf(data).find((o) => o.status === "at_risk" || daysUntil(o.dueDate) <= 45);
  if (pressing) {
    insights.push({
      id: "obligation",
      tone: pressing.status === "at_risk" ? "bad" : "warn",
      label: "Deadline",
      headline: `${pressing.title} in ${daysUntil(pressing.dueDate)} days`,
      detail: `${pressing.framework} · ${Math.round(pressing.progressPct)}% prepared by ${pressing.ownerName}.`,
      href: "/app/compliance",
      linkLabel: "Open obligations",
    });
  }

  if (!insights.length) {
    insights.push({
      id: "steady",
      tone: "good",
      label: "Steady",
      headline: "Nothing needs a decision today",
      detail: `Evidence coverage sits at ${Math.round(byKey("data_coverage")?.current ?? 0)}% and ${Math.round(
        byKey("automation_rate")?.current ?? 0,
      )}% of the work is automated.`,
      href: "/app/analytics",
      linkLabel: "Open the record",
    });
  }

  return insights.sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone]).slice(0, limit);
}
