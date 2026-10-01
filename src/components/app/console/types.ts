/**
 * Console data contract. The shapes below mirror /api/console/overview,
 * which mirrors the database. No component may invent a figure.
 */

export interface MetricPoint {
  label: string;
  periodStart: string;
  value: number;
  source: string;
  confidence: number;
  /** Site name; null when the reading covers the whole workspace. */
  site?: string | null;
}

export interface ConsoleMetric {
  key: string;
  label: string;
  shortLabel: string | null;
  unit: string;
  precision: number;
  category: string;
  goodDirection: "up" | "down";
  description: string | null;
  sortOrder: number;
  current: number;
  previous: number;
  delta: number;
  sinceStart: number;
  points: MetricPoint[];
}

export interface ConsoleWorkspace {
  id: string;
  name: string;
  legalName: string | null;
  sector: string;
  employees: number;
  sites: number;
  country: string;
  baselineYear: number;
  framework: string;
  ownerName: string | null;
  ownerRole: string | null;
  ownerAvatar: string | null;
  isDemo: boolean;
}

export interface ConsoleAgent {
  key: string;
  name: string;
  role: string;
  mission: string;
  cadence: string;
  autonomy: "suggest" | "draft" | "act_with_approval" | "auto";
  status: "active" | "paused" | "planned";
  healthScore: number;
  glyph: string;
  sortOrder: number;
}

export interface ConsoleRun {
  id: number;
  agentKey: string;
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "succeeded" | "needs_review" | "failed";
  summary: string;
  itemsProcessed: number;
  confidence: number;
  durationMs: number;
}

export interface ConsoleTask {
  id: number;
  agentKey: string;
  kind: "approval" | "evidence" | "exception" | "question";
  /** For questions: "answer_fact:<fact>". */
  pendingTool?: string | null;
  title: string;
  detail: string | null;
  severity: "high" | "normal" | "low";
  status: string;
  dueAt: string | null;
  createdAt: string;
  /** The document this task came with (for example a drafted VSME report). */
  deliverableHref?: string | null;
  deliverableTitle?: string | null;
}

export interface ConsoleConnection {
  id: string;
  provider: string;
  category: string;
  status: "live" | "syncing" | "error" | "available";
  /** Share of records covered, only when truly measured; null otherwise. */
  coveragePct: number | null;
  lastSyncAt: string | null;
  note: string | null;
}

export interface ConsoleObligation {
  id: string;
  framework: string;
  title: string;
  detail: string | null;
  dueDate: string;
  status: "on_track" | "at_risk" | "planned" | "done";
  progressPct: number;
  ownerName: string | null;
  agentKey: string | null;
}

export interface ConsoleEvent {
  id: number;
  actorType: "agent" | "human" | "system";
  actorName: string;
  verb: string;
  object: string;
  detail: string | null;
  createdAt: string;
}

export interface ConsoleOverviewData {
  workspace: ConsoleWorkspace;
  metrics: ConsoleMetric[];
  /** Distinct site names found on readings. Empty when none are split by site. */
  sites?: string[];
  agents: ConsoleAgent[];
  runs: ConsoleRun[];
  tasks: ConsoleTask[];
  connections: ConsoleConnection[];
  obligations: ConsoleObligation[];
  events: ConsoleEvent[];
  generatedAt: string;
}

/* ---- formatting helpers, shared so every widget reads alike ------- */

export const fmtNumber = (value: number, precision = 0) => {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `${(value / 1000).toFixed(1)}k`;
  return value.toLocaleString("en-GB", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
};

export const fmtSigned = (value: number, precision = 1) =>
  `${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value).toFixed(precision)}%`;

/** A fall in emissions is good; a fall in coverage is not. */
export const toneFor = (delta: number, goodDirection: "up" | "down") => {
  if (Math.abs(delta) < 0.05) return "flat" as const;
  const improving = goodDirection === "down" ? delta < 0 : delta > 0;
  return improving ? ("good" as const) : ("bad" as const);
};

export const relativeTime = (iso: string | null, locale: string = "en") => {
  const el = locale === "el";
  if (!iso) return el ? "ποτέ" : "never";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return el ? "μόλις τώρα" : "just now";
  const ago = (n: number, en: string, gr: string) => (el ? `πριν από ${n} ${gr}` : `${n}${en} ago`);
  if (min < 60) return ago(min, "m", "λεπ.");
  const hrs = Math.round(min / 60);
  if (hrs < 24) return ago(hrs, "h", hrs === 1 ? "ώρα" : "ώρες");
  const days = Math.round(hrs / 24);
  if (days < 30) return ago(days, "d", days === 1 ? "ημέρα" : "ημέρες");
  const months = Math.round(days / 30);
  return ago(months, "mo", months === 1 ? "μήνα" : "μήνες");
};

export const daysUntil = (iso: string) => {
  const target = new Date(`${iso}T00:00:00Z`).getTime();
  const today = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate(),
  );
  return Math.round((target - today) / 86_400_000);
};

export const AUTONOMY_LABEL: Record<ConsoleAgent["autonomy"], string> = {
  suggest: "Suggests",
  draft: "Drafts",
  act_with_approval: "Acts with approval",
  auto: "Autonomous",
};
