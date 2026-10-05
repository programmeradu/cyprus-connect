/**
 * The general document drafter.
 *
 * Writes any sustainability document a person asks Verde for (a policy, a
 * supplier letter, buyer questionnaire answers, a loan memo) from the shared
 * company record and workspace data, guided by the built-in library of
 * official sources. Company figures come only from the records; a missing
 * fact becomes a named gap, never a guess. The draft lands in Deliverables.
 *
 * Server only. Called from the approval gate, never from the browser.
 */

import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cbamSuppliers, metricDefinitions, metricReadings, reports, workspaces } from "@/db/schema";
import { aiChat, hasTextAi, parseJsonAnswer } from "@/lib/vuneli-ai";
import { readCompany } from "@/lib/company-update.server";
import { listObligations } from "@/lib/obligations/obligations.server";
import { shownCalls } from "@/lib/funding/funding.server";
import { eacSummary } from "@/lib/integrations/eac.server";
import { waterSummary } from "@/lib/integrations/water.server";
import { logger } from "@/lib/log";
import { resolveDocument } from "./document-library";
import type { DraftedReport, ReportFigure, ReportSection } from "./vsme";

const log = logger("document-draft");

/** Marks a general document in `reports.framework`. */
export const DOCUMENT_FRAMEWORK = "DOC";

function reportId(): string {
  return `rep_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

const text = (v: unknown, n: number) => (typeof v === "string" ? v.trim().replace(/\s*[\u2014\u2013]\s*/g, ", ").slice(0, n) : "");

function figures(v: unknown): ReportFigure[] {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, 6)
    .map((e) => {
      const r = e as Record<string, unknown>;
      return { label: text(r.label, 80), value: text(r.value, 60), source: text(r.source, 120) };
    })
    .filter((f) => f.label && f.value && f.source);
}

/** Readers never see internal codes: "scope2_intensity" -> "scope2 intensity". */
function plain(v: string | null | undefined): string {
  if (!v) return "";
  return v.replace(/\b([A-Za-z0-9]+(?:_[A-Za-z0-9]+)+)\b/g, (m) => m.replace(/_/g, " "));
}

const SOURCE_NAMES: Record<string, string> = {
  metric_readings: "Carbon footprint records",
  utility_bills: "Uploaded utility bills",
  obligations: "Deadline records",
  suppliers: "Supplier list",
  cbam_suppliers: "Supplier list",
  grant_scout: "Funding matches",
  company: "Company record",
};

function plainSource(v: string | undefined | null): string {
  if (!v) return "";
  let out = String(v);
  for (const [k, n] of Object.entries(SOURCE_NAMES)) out = out.replace(new RegExp(`\\b${k}\\b`, "g"), n);
  return plain(out).replace(/\bco2e total\b/gi, "total emissions").replace(/\bscope([123])\b/gi, "Scope $1");
}

function gaps(v: unknown): string[] {
  return Array.isArray(v) ? v.slice(0, 5).map((e) => text(e, 160)).filter(Boolean) : [];
}

/** Every record the drafter may quote, as labelled lines. Failures read as "not available". */
async function gatherRecords(workspace: typeof workspaces.$inferSelect, accountId: string): Promise<{ lines: string; sources: Record<string, unknown>; company: Awaited<ReturnType<typeof readCompany>> | null }> {
  const safe = <T,>(p: Promise<T>) => p.catch((error) => (log.error("record read failed", { error }), null));
  const [company, defs, readings, obligations, suppliers, funding, eac, water] = await Promise.all([
    safe(readCompany(accountId, workspace.id)),
    safe(db.select().from(metricDefinitions).orderBy(asc(metricDefinitions.sortOrder))),
    safe(db.select().from(metricReadings).where(eq(metricReadings.workspaceId, workspace.id)).orderBy(asc(metricReadings.periodStart))),
    safe(listObligations(workspace.id)),
    safe(db.select().from(cbamSuppliers).where(eq(cbamSuppliers.workspaceId, workspace.id)).orderBy(asc(cbamSuppliers.supplierName)).limit(30)),
    safe(shownCalls(workspace.id)),
    safe(eacSummary(accountId)),
    safe(waterSummary(accountId)),
  ]);

  const c = company;
  const companyLines = c
    ? [
        `name: ${c.registry?.legalName || c.companyName || workspace.name}`,
        `industry: ${c.industry ?? "not given"}`,
        `staff: ${c.employees ?? c.teamSize ?? "not given"}`,
        `country: ${c.country}`,
        `sites: ${c.sites}`,
        `yearly revenue EUR: ${c.revenueEur ?? "not given"}`,
        `website: ${c.website ?? "not given"}`,
        `imports CBAM goods: ${c.importsCbamGoods ?? "not answered"}`,
        `handles EUDR commodities: ${c.eudrCommodities ?? "not answered"}`,
        `makes consumer green claims: ${c.consumerClaims ?? "not answered"}`,
        c.registry ? `registry: ${c.registry.registrationNo}, ${c.registry.type ?? ""}, status ${c.registry.status ?? "unknown"}` : "registry: not linked",
      ]
    : [`name: ${workspace.name}`, "other company facts: not available"];

  const metricLines = (defs ?? [])
    .map((d) => {
      const pts = (readings ?? []).filter((r) => r.metricKey === d.key && r.site === null);
      const cur = pts.at(-1);
      return cur ? `${d.label}: ${cur.value.toFixed(d.precision)} ${d.unit} (${cur.periodLabel}, source ${plainSource(cur.source)})` : null;
    })
    .filter(Boolean);

  const ob = (obligations ?? []).filter((o) => o.match !== "not").slice(0, 10);
  const lines = [
    "COMPANY (company record)",
    ...companyLines.map((l) => `- ${l}`),
    "",
    "FOOTPRINT (carbon footprint records)",
    ...(metricLines.length ? metricLines.map((l) => `- ${l}`) : ["- none recorded"]),
    "",
    "UTILITY BILLS (uploaded utility bills)",
    eac ? `- electricity: ${eac.bills.length} bills, ${Math.round(eac.totalKwh)} kWh, ${Math.round(eac.totalKgCo2e)} kg CO2e, factor ${eac.factor}` : "- electricity: not available",
    water ? `- water: ${water.bills.length} bills, ${Math.round(water.totalM3)} m3` : "- water: not available",
    "",
    "LEGAL DEADLINES (deadline records)",
    ...(ob.length ? ob.map((o) => `- ${o.framework}: ${o.title}, due ${o.dueDate}, ${plain(o.match)}, status ${plain(o.status)}`) : ["- none matched"]),
    "",
    "SUPPLIERS (supplier list)",
    ...((suppliers ?? []).length
      ? (suppliers ?? []).map((s) => `- ${s.supplierName}, sanctions check ${plain(s.sanctionsStatus ?? "not run")}`)
      : ["- none recorded"]),
    "",
    "FUNDING FITS (funding matches)",
    ...((funding?.calls ?? []).length ? funding!.calls.slice(0, 5).map((f) => `- ${f.title}, ${plain(f.verdict)}, deadline ${f.deadline ?? "open"}`) : ["- none"]),
  ].join("\n");

  return {
    lines,
    company: c,
    sources: {
      company: Boolean(c),
      metrics: metricLines.length,
      obligations: ob.map((o) => o.id),
      suppliers: (suppliers ?? []).length,
      funding: (funding?.calls ?? []).length,
      bills: { electricity: eac?.bills.length ?? 0, water: water?.bills.length ?? 0 },
    },
  };
}

export async function draftDocument(input: {
  workspace: typeof workspaces.$inferSelect;
  accountId: string;
  documentType: string | null;
  title: string;
  purpose: string;
  audience?: string | null;
  agentKey?: string | null;
  taskId?: number | null;
  proposalId?: number | null;
  createdBy?: string | null;
}): Promise<DraftedReport> {
  const { workspace } = input;
  const { type, sources: librarySources } = resolveDocument(input.documentType, `${input.title} ${input.purpose}`);
  const title = text(input.title, 160) || type.label;
  const audience = text(input.audience, 120) || type.audience;
  const periodLabel = String(new Date().getFullYear());
  const { lines, sources, company } = await gatherRecords(workspace, input.accountId);

  // A duty the company has not confirmed is stated up front, never assumed.
  const APPLIES: Record<string, { fact: boolean | null | undefined; ask: string }> = {
    eudr_due_diligence: { fact: company?.eudrCommodities, ask: "whether the company places cattle, cocoa, coffee, oil palm, rubber, soya or wood products (or goods made from them) on the EU market or exports them" },
    environmental_claims_review: { fact: company?.consumerClaims, ask: "whether the company makes environmental claims to consumers" },
  };
  const gate = APPLIES[type.key];
  const applicability = gate && gate.fact !== true
    ? gate.fact === false
      ? `The company record says the company does not do this, so this duty probably does not apply. Draft only a short statement explaining that, plus what would change it.`
      : `The company record does not yet say ${gate.ask}. Start the first section by stating that the duty applies only if so, and add this question to its gaps. Do not write as if the duty applies.`
    : "";

  const library = librarySources.map((s, i) => `[S${i + 1}] ${s.label} (${s.url}): ${s.use}`).join("\n");
  const outline = type.outline.length
    ? type.outline.map((h, i) => `${i + 1}. ${h}`).join("\n")
    : "Choose 4 to 8 headings that fit the request.";

  let sections: ReportSection[] = type.outline.map((h, i) => ({ code: String(i + 1), title: h, body: "", figures: [], gaps: [] }));
  let summary = `Draft ${type.label.toLowerCase()} for ${workspace.name}, written from the workspace records. Missing facts are listed as gaps for a person to complete.`;
  let ok = false;

  if (hasTextAi()) {
    const prompt = `You are a sustainability consultant drafting a "${title}" (${type.label}) for a Cyprus business. Audience: ${audience}.
Request: ${text(input.purpose, 800) || "as titled"}

RULES
1. Company facts and figures come only from RECORDS. Never invent a figure, a policy, a certification, a date or a name.
2. Rules, definitions and duties come only from LIBRARY. Cite them inline as [S1], [S2]. Never cite anything else.
3. If a section needs a fact the records lack, write what is needed in plain words and add it to "gaps". No placeholders like [X].
4. Write as the company ("we"), plain English, short sentences, active voice. No em dashes, no emoji, no marketing words.
5. Never commit the company to a process, schedule, audit, certification, project, supplier step or deadline that the records do not show. Where a section needs a decision, describe briefly what the LIBRARY requires and add "Decide: ..." to "gaps".
6. Cite a source only for what its LIBRARY line says it covers. Use only figures that matter for this document; do not pad with unrelated figures (a carbon footprint does not belong in a deforestation statement).
7. Dates and deadlines come only from LIBRARY or RECORDS. If unsure of a current date, say "check the current date at [Sn]".
${applicability ? `8. APPLICABILITY: ${applicability}\n` : ""}9. Each "body" is 60 to 180 words. "figures" quote only record values; "source" names the record in plain words, for example "Carbon footprint records, Scope 2, Sep 2026". Never write internal codes, field names or words joined with underscores anywhere.

OUTLINE
${outline}

LIBRARY
${library}

RECORDS
${lines}

Return JSON only:
{"summary":"2 to 3 sentences","sections":[{"title":"...","body":"...","figures":[{"label":"...","value":"...","source":"..."}],"gaps":["..."]}]}
One entry per outline heading, in order.`;

    try {
      const raw = await aiChat({ messages: [{ role: "user", content: prompt }], json: true, temperature: 0.2 });
      const parsed = parseJsonAnswer<{ summary?: unknown; sections?: unknown }>(raw);
      const model = Array.isArray(parsed?.sections) ? (parsed!.sections as Record<string, unknown>[]) : [];
      if (type.outline.length === 0) {
        sections = model.slice(0, 8).map((m, i) => ({ code: String(i + 1), title: text(m.title, 120) || `Section ${i + 1}`, body: "", figures: [], gaps: [] }));
      }
      sections.forEach((s, i) => {
        const m = model[i];
        if (!m) return;
        s.body = plain(text(m.body, 2600));
        s.figures = figures(m.figures).map((f) => ({ ...f, label: plain(f.label), value: plain(f.value), source: plainSource(f.source) }));
        s.gaps = gaps(m.gaps).map(plain);
      });
      const drafted = text(parsed?.summary, 900);
      if (drafted) summary = plain(drafted);
      ok = sections.some((s) => s.body);
    } catch (error) {
      log.error("model draft failed", { error });
    }
  }

  if (sections.length === 0) sections = [{ code: "1", title, body: "", figures: [], gaps: [] }];
  for (const s of sections) {
    if (s.body) continue;
    s.body = ok
      ? `This section was not drafted from the current records. Add the missing facts, then ask Verde to redraft it.`
      : `No draft text was produced for this section. Ask Verde to redraft once the writing service is available.`;
    if (!s.gaps.length) s.gaps = [`${s.title}: not drafted yet.`];
  }

  // The library sources the draft relied on, so a reader can check every rule.
  sections.push({
    code: "S",
    title: "Sources",
    body: librarySources.map((s, i) => `[S${i + 1}] ${s.label}. ${s.url}`).join("\n"),
    figures: [],
    gaps: [],
  });

  const id = reportId();
  await db.insert(reports).values({
    id,
    workspaceId: workspace.id,
    framework: DOCUMENT_FRAMEWORK,
    title,
    periodLabel,
    status: "draft",
    agentKey: input.agentKey ?? "copilot",
    agentName: "Verde",
    taskId: input.taskId ?? null,
    proposalId: input.proposalId ?? null,
    summary,
    sections: JSON.stringify(sections),
    sources: JSON.stringify({ documentType: type.key, library: librarySources.map((s) => s.url), ...sources }),
    createdBy: input.createdBy ?? null,
  });

  return { id, title, periodLabel, summary, sections };
}
