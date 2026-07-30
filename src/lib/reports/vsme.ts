/**
 * The report drafting engine.
 *
 * An agent drafts a VSME report from the workspace records only. The section
 * skeleton is fixed by the EFRAG VSME Basic Module (B1 to B12), so the
 * document is complete even when a disclosure has no data yet. The model
 * writes the narrative for each disclosure and names the record it read. A
 * disclosure with no record is marked as a gap, never invented.
 *
 * Server only. It is called from the approval gate, never from the browser.
 */

import { db } from "@/db";
import {
  agents,
  metricDefinitions,
  metricReadings,
  obligations,
  reports,
  workspaces,
} from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { VSME_BASIC } from "@/data/tools/vsme-basic-module";
import { aiChat, hasLovableAi, parseJsonAnswer } from "@/lib/lovable-ai";

export interface ReportFigure {
  label: string;
  value: string;
  source: string;
}

export interface ReportSection {
  code: string;
  title: string;
  body: string;
  figures: ReportFigure[];
  gaps: string[];
}

export interface DraftedReport {
  id: string;
  title: string;
  periodLabel: string;
  summary: string;
  sections: ReportSection[];
}

/** A short, sortable, readable id. Reports are quoted in emails and audits. */
function reportId(): string {
  const stamp = Date.now().toString(36);
  const salt = Math.random().toString(36).slice(2, 7);
  return `rep_${stamp}${salt}`;
}

function round(value: number, precision: number): string {
  return Number.isFinite(value) ? value.toFixed(precision) : "0";
}

/**
 * The section skeleton. Written before the model runs, so a failed or slow
 * model still leaves a usable, correctly structured draft behind.
 */
function skeleton(): ReportSection[] {
  return VSME_BASIC.map((disclosure) => ({
    code: disclosure.code,
    // House style keeps technical English free of em dashes.
    title: disclosure.title.en.replace(/\s*[\u2014\u2013]\s*/g, ": "),
    body: "",
    figures: [],
    gaps: [],
  }));
}

interface ModelSection {
  code?: unknown;
  body?: unknown;
  figures?: unknown;
  gaps?: unknown;
}

function asText(value: unknown, limit: number): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function asFigures(value: unknown): ReportFigure[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 6)
    .map((entry) => {
      const row = entry as Record<string, unknown>;
      return {
        label: asText(row.label, 80),
        value: asText(row.value, 60),
        source: asText(row.source, 80),
      };
    })
    .filter((figure) => figure.label.length > 0 && figure.value.length > 0);
}

function asGaps(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 5)
    .map((entry) => asText(entry, 160))
    .filter((entry) => entry.length > 0);
}

/**
 * Drafts the report and stores it. Never throws for a model failure: the
 * skeleton is saved instead, with the gaps named, so the person always has a
 * document to open and correct.
 */
export async function draftVsmeReport(input: {
  workspace: typeof workspaces.$inferSelect;
  periodLabel?: string | null;
  agentKey?: string | null;
  taskId?: number | null;
  proposalId?: number | null;
  createdBy?: string | null;
}): Promise<DraftedReport> {
  const { workspace } = input;

  const [defs, readings, obs, roster] = await Promise.all([
    db.select().from(metricDefinitions).orderBy(asc(metricDefinitions.sortOrder)),
    db
      .select()
      .from(metricReadings)
      .where(eq(metricReadings.workspaceId, workspace.id))
      .orderBy(asc(metricReadings.periodStart)),
    db
      .select()
      .from(obligations)
      .where(eq(obligations.workspaceId, workspace.id))
      .orderBy(asc(obligations.dueDate)),
    db.select().from(agents).orderBy(asc(agents.sortOrder)),
  ]);

  const agentKey = input.agentKey ?? "vsme";
  const author =
    roster.find((row) => row.key === agentKey) ??
    roster.find((row) => row.key.includes("report") || row.key.includes("vsme")) ??
    null;

  const periodLabel =
    input.periodLabel?.trim() ||
    readings.at(-1)?.periodLabel ||
    String(workspace.baselineYear ?? new Date().getFullYear());

  const byMetric = new Map<string, typeof readings>();
  for (const reading of readings) {
    const list = byMetric.get(reading.metricKey) ?? [];
    list.push(reading);
    byMetric.set(reading.metricKey, list);
  }

  const metricLines = defs.map((def) => {
    const points = byMetric.get(def.key) ?? [];
    const current = points.at(-1);
    const window = points
      .slice(-8)
      .map((point) => `${point.periodLabel}=${round(point.value, def.precision)}`)
      .join(", ");
    return `- ${def.key} "${def.label}": latest ${
      current ? `${round(current.value, def.precision)} ${def.unit} (${current.periodLabel})` : "no reading"
    }. Series: ${window || "none"}`;
  });

  const records = [
    `ENTITY: ${workspace.legalName || workspace.name}, sector ${workspace.sector}, country ${workspace.country}, ${workspace.employees} employees, ${workspace.sites} site(s), baseline year ${workspace.baselineYear}.`,
    `REPORTING PERIOD: ${periodLabel}`,
    "",
    "METRIC RECORDS (metric_definitions + metric_readings)",
    metricLines.join("\n") || "- none recorded",
    "",
    "OBLIGATION RECORDS (obligations)",
    obs
      .map(
        (row) =>
          `- ${row.framework}: ${row.title}, due ${row.dueDate}, status ${row.status}, ${Math.round(row.progressPct)}% complete`,
      )
      .join("\n") || "- none",
  ].join("\n");

  const outline = VSME_BASIC.map(
    (disclosure) =>
      `${disclosure.code} | ${disclosure.title.en.replace(/\s*[\u2014\u2013]\s*/g, ": ")} | ${disclosure.purpose.en}`,
  ).join("\n");

  const sections = skeleton();
  let summary = `Draft VSME Basic Module report for ${workspace.name}, reporting period ${periodLabel}. Written from the workspace records held in the console. Every disclosure with no record is marked as a data gap for a person to complete.`;
  let ok = false;

  if (hasLovableAi()) {
    const prompt = `You draft a VSME Basic Module report for a Cyprus SME.

RULES
1. Use only the records below. Never invent a figure, a policy or a date.
2. For a disclosure with no record, write one short paragraph that states what the disclosure needs, then list the missing item in "gaps". Do not write a placeholder figure.
3. Write plain technical English. Short sentences. Active voice. No em dashes. No emoji. No marketing words.
4. Each "body" is 40 to 110 words.
5. In "figures", quote only values that appear in the records. "source" names the record, for example "metric_readings: scope2_intensity, June 2026".

DISCLOSURES (code | title | purpose)
${outline}

RECORDS
${records}

Return JSON only, in this shape:
{"summary":"2 to 3 sentence executive summary","sections":[{"code":"B1","body":"...","figures":[{"label":"...","value":"...","source":"..."}],"gaps":["..."]}]}
Return one entry for every disclosure code, in order.`;

    try {
      const raw = await aiChat({
        messages: [{ role: "user", content: prompt }],
        json: true,
        temperature: 0.2,
      });
      const parsed = parseJsonAnswer<{ summary?: unknown; sections?: unknown }>(raw);
      const modelSections = Array.isArray(parsed?.sections)
        ? (parsed?.sections as ModelSection[])
        : [];
      if (modelSections.length > 0) {
        for (const section of sections) {
          const match = modelSections.find(
            (entry) => asText(entry.code, 8).toUpperCase() === section.code,
          );
          if (!match) continue;
          section.body = asText(match.body, 2400);
          section.figures = asFigures(match.figures);
          section.gaps = asGaps(match.gaps);
        }
        const drafted = asText(parsed?.summary, 900);
        if (drafted) summary = drafted;
        ok = sections.some((section) => section.body.length > 0);
      }
    } catch (error) {
      console.error("vsme draft failed", error);
    }
  }

  // Anything the model skipped or could not write is still an honest section.
  for (const section of sections) {
    if (section.body) continue;
    section.body = ok
      ? `This disclosure was not drafted from the current records. Add the source data for ${section.title.toLowerCase()}, then ask the agent to redraft this section.`
      : `No draft narrative was produced for this disclosure. The console holds no confirmed record for ${section.title.toLowerCase()} in ${periodLabel}. Add the source data, then redraft.`;
    if (section.gaps.length === 0) {
      section.gaps = [`No confirmed record for ${section.title.toLowerCase()} in ${periodLabel}.`];
    }
  }

  const id = reportId();
  const title = `VSME Basic Module report ${periodLabel}`;

  await db.insert(reports).values({
    id,
    workspaceId: workspace.id,
    framework: "VSME",
    title,
    periodLabel,
    status: "draft",
    agentKey: author?.key ?? agentKey,
    agentName: author?.name ?? "Reporting agent",
    taskId: input.taskId ?? null,
    proposalId: input.proposalId ?? null,
    summary,
    sections: JSON.stringify(sections),
    sources: JSON.stringify({
      metrics: defs.map((def) => def.key),
      obligations: obs.map((row) => row.id),
      readingCount: readings.length,
    }),
    createdBy: input.createdBy ?? null,
  });

  return { id, title, periodLabel, summary, sections };
}
