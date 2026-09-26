/**
 * Plain-language labels for the step ledger. Pure functions, no database, so
 * the console and the tests describe agent steps the same way.
 */

export type StepDecision = "executed" | "queued_for_approval" | "blocked" | "failed";
export type Tone = "good" | "warn" | "bad" | "idle" | "live";

const TOOL_LABELS: Record<string, { verb: string; kind: "read" | "write" | "outward" | "legal" }> = {
  read_metrics: { verb: "Read the metric history", kind: "read" },
  read_obligations: { verb: "Read open obligations", kind: "read" },
  read_cbam_imports: { verb: "Read CBAM import lines", kind: "read" },
  create_task: { verb: "Added a task to your review queue", kind: "write" },
  record_fact: { verb: "Recorded a fact with its source", kind: "write" },
  save_cbam_draft: { verb: "Saved the CBAM declaration draft", kind: "write" },
  sign_cbam_declaration: { verb: "Signature of the CBAM declaration", kind: "legal" },
};

export const RISK_LABELS = ["Read only", "Internal write", "Outward action", "Legal or financial"] as const;

export function toolLabel(tool: string): { verb: string; kind: string } {
  return TOOL_LABELS[tool] ?? { verb: tool.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()), kind: "other" };
}

export function riskLabel(level: number): string {
  return RISK_LABELS[level] ?? `Risk level ${level}`;
}

export function decisionLabel(decision: string): { label: string; tone: Tone } {
  switch (decision) {
    case "executed":
      return { label: "Done", tone: "good" };
    case "queued_for_approval":
      return { label: "Waiting for you", tone: "live" };
    case "blocked":
      return { label: "Blocked by policy", tone: "warn" };
    case "failed":
      return { label: "Failed", tone: "bad" };
    default:
      return { label: decision, tone: "idle" };
  }
}

export function runStatusLabel(status: string): { label: string; tone: Tone } {
  switch (status) {
    case "succeeded":
      return { label: "Finished", tone: "good" };
    case "running":
      return { label: "Running", tone: "live" };
    case "failed":
      return { label: "Failed", tone: "bad" };
    default:
      return { label: status.replace(/_/g, " "), tone: "idle" };
  }
}

export function triggerLabel(trigger: string): string {
  if (trigger === "cron") return "Scheduled";
  if (trigger === "manual") return "Started by a person";
  if (trigger === "event") return "Triggered by an event";
  if (trigger === "approval") return "Run after approval";
  return trigger;
}

/**
 * One short sentence about what a step returned. Never throws on odd JSON;
 * the ledger stores text that may be truncated at 8000 characters.
 */
export function summarizeOutput(decision: string, output: string | null): string | null {
  if (!output) return null;
  let v: unknown;
  try {
    v = JSON.parse(output);
  } catch {
    return output.length > 140 ? `${output.slice(0, 137)}…` : output;
  }
  if (decision === "queued_for_approval" && v && typeof v === "object" && "taskId" in v) {
    const o = v as { taskId: unknown; reused?: unknown };
    return o.reused ? `Same request already waiting as task #${o.taskId}.` : `Opened approval task #${o.taskId}.`;
  }
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    if ("taskId" in o && "created" in o) {
      return o.created ? `Opened task #${o.taskId}.` : `Task #${o.taskId} was already open, so it was kept, not duplicated.`;
    }
    if (typeof o.error === "string") return o.error;
    if (typeof o.reason === "string") return o.reason;
  }
  if (Array.isArray(v)) return v.length === 1 ? "1 item returned." : `${v.length} items returned.`;
  if (v && typeof v === "object") {
    const keys = Object.keys(v as object);
    if (!keys.length) return "No result.";
    const parts = keys.slice(0, 3).map((k) => {
      const val = (v as Record<string, unknown>)[k];
      const shown = typeof val === "string" || typeof val === "number" || typeof val === "boolean" ? String(val) : Array.isArray(val) ? `${val.length} items` : "…";
      return `${k.replace(/_/g, " ")}: ${shown.length > 40 ? `${shown.slice(0, 37)}…` : shown}`;
    });
    return parts.join(" · ") + (keys.length > 3 ? " · …" : "");
  }
  return String(v);
}
