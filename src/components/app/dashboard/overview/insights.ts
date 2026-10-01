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

export function buildInsights(data: ConsoleOverviewData, limit = 4, locale: string = "en"): Insight[] {
  const el = locale === "el";
  const L = (en: string, gr: string) => (el ? gr : en);
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
      label: L("Largest move", "Μεγαλύτερη μεταβολή"),
      headline: `${mover.shortLabel ?? mover.label} ${fmtSigned(mover.delta)}`,
      detail: L(
        `Now ${fmtNumber(mover.current, mover.precision)} ${mover.unit} against the last period.`,
        `Τώρα ${fmtNumber(mover.current, mover.precision)} ${mover.unit} σε σχέση με την προηγούμενη περίοδο.`,
      ),
      href: "/app/analytics",
      linkLabel: L(`Open ${mover.label}`, `Άνοιγμα: ${mover.label}`),
    });
  }

  const failedRuns = runs.filter((r) => r.status === "needs_review");
  if (failedRuns.length) {
    insights.push({
      id: "runs",
      tone: "bad",
      label: L("Agent run", "Εκτέλεση πράκτορα"),
      headline: L(
        `${failedRuns.length} run${failedRuns.length === 1 ? "" : "s"} need a review`,
        `${failedRuns.length} ${failedRuns.length === 1 ? "εκτέλεση χρειάζεται" : "εκτελέσεις χρειάζονται"} έλεγχο`,
      ),
      detail: failedRuns[0].summary ?? L("Open the workforce to read the run log.", "Ανοίξτε τους πράκτορες για το ιστορικό εκτέλεσης."),
      href: "/app/agents",
      linkLabel: L("Open the agent workforce", "Άνοιγμα πρακτόρων"),
    });
  }

  const highTasks = tasks.filter((t) => t.severity === "high");
  if (tasks.length) {
    insights.push({
      id: "tasks",
      tone: highTasks.length ? "warn" : "info",
      label: L("Decision", "Απόφαση"),
      headline: L(
        `${tasks.length} ${tasks.length === 1 ? "item waits" : "items wait"} for a person`,
        `${tasks.length} ${tasks.length === 1 ? "θέμα περιμένει" : "θέματα περιμένουν"} απόφαση`,
      ),
      detail: highTasks.length
        ? L(
            `${highTasks.length} of them are marked high. ${highTasks[0].title}.`,
            `${highTasks.length} με υψηλή προτεραιότητα. ${highTasks[0].title}.`,
          )
        : tasks[0].title,
      href: "/app/actions",
      linkLabel: L("Open the approval queue", "Άνοιγμα εκκρεμοτήτων"),
    });
  }

  const weak = [...connections]
    .filter((c) => c.status !== "available" && c.coveragePct !== null)
    .sort((a, b) => (a.coveragePct ?? 0) - (b.coveragePct ?? 0))[0];
  if (weak && weak.coveragePct !== null && weak.coveragePct < 85) {
    insights.push({
      id: "coverage",
      tone: weak.coveragePct < 60 ? "warn" : "info",
      label: L("Evidence gap", "Κενό τεκμηρίωσης"),
      headline: L(`${weak.provider} covers ${Math.round(weak.coveragePct)}%`, `${weak.provider}: κάλυψη ${Math.round(weak.coveragePct)}%`),
      detail: L(
        `${titleCase(weak.category)} records, synced ${relativeTime(weak.lastSyncAt)}.`,
        `Εγγραφές ${titleCase(weak.category)}, συγχρονισμός ${relativeTime(weak.lastSyncAt, locale)}.`,
      ),
      href: "/app/integrations",
      linkLabel: L("Open connections", "Άνοιγμα συνδέσεων"),
    });
  }

  const pressing = dueObligationsOf(data).find((o) => o.status === "at_risk" || daysUntil(o.dueDate) <= 45);
  if (pressing) {
    insights.push({
      id: "obligation",
      tone: pressing.status === "at_risk" ? "bad" : "warn",
      label: L("Deadline", "Προθεσμία"),
      headline: L(`${pressing.title} in ${daysUntil(pressing.dueDate)} days`, `${pressing.title} σε ${daysUntil(pressing.dueDate)} ημέρες`),
      detail: L(
        `${pressing.framework} · ${Math.round(pressing.progressPct)}% prepared by ${pressing.ownerName}.`,
        `${pressing.framework} · ${Math.round(pressing.progressPct)}% έτοιμο από ${pressing.ownerName}.`,
      ),
      href: "/app/compliance",
      linkLabel: L("Open obligations", "Άνοιγμα προθεσμιών"),
    });
  }

  if (!insights.length) {
    insights.push({
      id: "steady",
      tone: "good",
      label: L("Steady", "Σταθερά"),
      headline: L("Nothing needs a decision today", "Τίποτα δεν χρειάζεται απόφαση σήμερα"),
      detail: L(
        `Evidence coverage sits at ${Math.round(byKey("data_coverage")?.current ?? 0)}% and ${Math.round(byKey("automation_rate")?.current ?? 0)}% of the work is automated.`,
        `Η τεκμηρίωση καλύπτει ${Math.round(byKey("data_coverage")?.current ?? 0)}% και το ${Math.round(byKey("automation_rate")?.current ?? 0)}% της εργασίας είναι αυτοματοποιημένο.`,
      ),
      href: "/app/analytics",
      linkLabel: L("Open the record", "Άνοιγμα αρχείου"),
    });
  }

  return insights.sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone]).slice(0, limit);
}
