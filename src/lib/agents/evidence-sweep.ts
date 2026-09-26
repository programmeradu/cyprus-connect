/**
 * Evidence sweep (agent "ingest", Ledger). Deterministic, no AI cost.
 *
 * Finds metrics with no reading in the last 60 days and obligations that are
 * due within 30 days but under half done, then asks for the evidence through
 * the review queue. Records coverage as a fact other agents can read.
 */

import type { AgentRuntime } from "./runtime";
import { sha256Hex, stableStringify } from "./hash";

export const STALE_DAYS = 60;
export const DUE_SOON_DAYS = 30;

export interface MetricState {
  key: string;
  label: string;
  latestPeriod: string | null;
}
export interface ObligationState {
  id: string;
  title: string;
  framework: string;
  dueDate: string;
  status: string;
  progressPct: number;
}

const DAY = 86_400_000;

/** Pure: which metrics lack recent evidence. */
export function findStaleMetrics(metrics: MetricState[], now: Date): MetricState[] {
  return metrics.filter((m) => {
    if (!m.latestPeriod) return true;
    const t = Date.parse(m.latestPeriod);
    return !Number.isFinite(t) || now.getTime() - t > STALE_DAYS * DAY;
  });
}

/** Pure: obligations due soon and under half done. Overdue ones count too. */
export function findAtRiskObligations(items: ObligationState[], now: Date): ObligationState[] {
  return items.filter((o) => {
    const t = Date.parse(o.dueDate);
    if (!Number.isFinite(t)) return false;
    return t - now.getTime() <= DUE_SOON_DAYS * DAY && o.progressPct < 50;
  });
}

export async function runEvidenceSweep(rt: AgentRuntime, now = new Date()) {
  const metricsStep = await rt.call("read_metrics", {});
  const obligationsStep = await rt.call("read_obligations", {});
  if (metricsStep.decision !== "executed" || obligationsStep.decision !== "executed") {
    throw new Error("Could not read the workspace records.");
  }
  const metrics = metricsStep.output ?? [];
  const open = obligationsStep.output ?? [];

  const stale = findStaleMetrics(metrics, now);
  const atRisk = findAtRiskObligations(open, now);
  let created = 0;

  for (const m of stale) {
    const r = await rt.call("create_task", {
      title: `Upload evidence for ${m.label}`,
      detail: m.latestPeriod
        ? `Last reading is for ${m.latestPeriod}, more than ${STALE_DAYS} days ago. Upload the latest bill or record.`
        : "No reading exists yet. Upload a bill or record to start this series.",
      severity: "normal",
      kind: "evidence",
      dueAt: null,
    });
    if (r.decision === "executed" && r.output?.created) created += 1;
  }
  for (const o of atRisk) {
    const overdue = Date.parse(o.dueDate) < now.getTime();
    const r = await rt.call("create_task", {
      title: `${overdue ? "Overdue" : "Due soon"}: ${o.title}`.slice(0, 200),
      detail: `${o.framework} obligation due ${o.dueDate} is ${Math.round(o.progressPct)}% complete. Check the missing inputs or update its status.`,
      severity: overdue ? "high" : "normal",
      kind: "review",
      dueAt: o.dueDate,
    });
    if (r.decision === "executed" && r.output?.created) created += 1;
  }

  const covered = metrics.length - stale.length;
  const coverage = metrics.length === 0 ? 0 : covered / metrics.length;
  const basis = stableStringify({ metrics, open, at: now.toISOString().slice(0, 10) });
  await rt.call("record_fact", {
    key: "evidence_coverage",
    value: coverage.toFixed(3),
    unit: "share of metrics with a reading in the last 60 days",
    sourceKind: "derived",
    sourceHash: await sha256Hex(basis),
  });

  return {
    summary: `Checked ${metrics.length} metrics and ${open.length} obligations. ${stale.length} metrics need evidence, ${atRisk.length} obligations at risk. ${created} new tasks.`,
    itemsProcessed: metrics.length + open.length,
    confidence: 1,
  };
}
