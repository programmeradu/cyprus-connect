/**
 * Reads each public funding call's eligibility rules once, with AI, and stores
 * them on the call. Re-reads only when the call text changes. Every rule must
 * carry a quote from the call; anything the text does not say stays null.
 */

import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { grantOpportunities } from "@/db/schema";
import { aiResponsesJson, AiGatewayError, hasLovableAi } from "@/lib/lovable-ai";
import { sha256Hex, stableStringify } from "@/lib/agents/hash";
import { logger } from "@/lib/log";
import { pdfLinksIn, pdfLinksOnPage, readCallDocuments, type CallDocument } from "./call-documents.server";
import { APPLICANT_TYPES, SECTORS, type CallRules } from "./rules";

const log = logger("funding.extract");
/** Bounds AI spend per daily run. Unread calls wait for the next run. */
export const MAX_PER_RUN = 40;

const nullable = (type: string) => ({ type: [type, "null"] });
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "countries", "applicantTypes", "smeOnly", "minEmployees", "maxEmployees", "maxRevenueEur",
    "minCompanyAgeYears", "maxCompanyAgeYears", "sectors", "consortiumRequired", "requiredDocuments", "evidence",
  ],
  properties: {
    countries: { type: ["array", "null"], items: { type: "string" } },
    applicantTypes: { type: ["array", "null"], items: { type: "string", enum: [...APPLICANT_TYPES] } },
    smeOnly: nullable("boolean"),
    minEmployees: nullable("number"),
    maxEmployees: nullable("number"),
    maxRevenueEur: nullable("number"),
    minCompanyAgeYears: nullable("number"),
    maxCompanyAgeYears: nullable("number"),
    sectors: { type: ["array", "null"], items: { type: "string" } },
    consortiumRequired: nullable("boolean"),
    requiredDocuments: { type: "array", items: { type: "string" } },
    evidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["rule", "quote"],
        properties: { rule: { type: "string" }, quote: { type: "string" } },
      },
    },
  },
};

const SYSTEM = `You read the eligibility rules of one public funding call. Use only the call text given.
Rules:
- The text may include excerpts of official call documents (PDFs). A work programme can cover many topics: use only the parts about this call's title or identifier.
- Quotes must be copied exactly from the text, including from the documents.
- If the text does not clearly state a rule, return null for it. Never guess or use general knowledge about the programme.
- countries: ISO-2 codes; "EU" when all EU member states are eligible; "ANY" when worldwide.
- applicantTypes from: ${APPLICANT_TYPES.join(", ")}. "company" covers SMEs and enterprises. "consortium" only when applicants must be a group.
- sectors from: ${SECTORS.join(", ")}, or ["any"] when the call is open to all sectors.
- consortiumRequired true only when the text requires several partner organisations.
- requiredDocuments: documents the applicant must provide, short names, only if stated.
- evidence: for every non-null rule, one short exact quote from the call text, with "rule" set to the field name.`;

const squash = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** sourceText given: a quote must really appear in the call text, or its rule is dropped. */
function sanitize(raw: CallRules | null, sourceText?: string): CallRules | null {
  if (!raw || typeof raw !== "object") return null;
  const haystack = sourceText === undefined ? null : squash(sourceText);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null);
  const bool = (v: unknown) => (typeof v === "boolean" ? v : null);
  const strs = (v: unknown, max = 40) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim().slice(0, 120)).slice(0, max) : null;
  const evidence = (Array.isArray(raw.evidence) ? raw.evidence : [])
    .filter((e) => e && typeof e.rule === "string" && typeof e.quote === "string" && e.quote.trim())
    .filter((e) => haystack === null || (squash(e.quote).length > 0 && haystack.includes(squash(e.quote))))
    .map((e) => ({ rule: e.rule.slice(0, 40), quote: e.quote.trim().slice(0, 300) }))
    .slice(0, 20);
  const quoted = new Set(evidence.map((e) => e.rule));
  // A rule without a quote from the call is treated as not stated.
  const keep = <T,>(rule: string, v: T | null): T | null => (v !== null && quoted.has(rule) ? v : null);
  const applicant = strs(raw.applicantTypes)?.filter((t): t is CallRules["applicantTypes"] extends (infer U)[] | null ? U : never =>
    (APPLICANT_TYPES as readonly string[]).includes(t)) ?? null;
  return {
    countries: keep("countries", strs(raw.countries)?.map((c) => c.toUpperCase()) ?? null),
    applicantTypes: keep("applicantTypes", applicant && applicant.length ? applicant : null),
    smeOnly: keep("smeOnly", bool(raw.smeOnly)),
    minEmployees: keep("minEmployees", num(raw.minEmployees)),
    maxEmployees: keep("maxEmployees", num(raw.maxEmployees)),
    maxRevenueEur: keep("maxRevenueEur", num(raw.maxRevenueEur)),
    minCompanyAgeYears: keep("minCompanyAgeYears", num(raw.minCompanyAgeYears)),
    maxCompanyAgeYears: keep("maxCompanyAgeYears", num(raw.maxCompanyAgeYears)),
    sectors: keep("sectors", strs(raw.sectors)?.map((s) => s.toLowerCase()) ?? null),
    consortiumRequired: keep("consortiumRequired", bool(raw.consortiumRequired)),
    requiredDocuments: strs(raw.requiredDocuments, 12) ?? [],
    evidence,
  };
}

export async function contentHashOf(c: { title: string; summary: string; program: string | null; deadline: string | null }) {
  return sha256Hex(stableStringify({ t: c.title, s: c.summary, p: c.program, d: c.deadline }));
}

/**
 * Official English conditions and description for an EU Funding & Tenders
 * topic (the public SEDIA search API). Null when unavailable; the call is then
 * read from its stored summary only, which usually leaves it hidden.
 */
async function euTopic(url: string): Promise<{ id: string; text: string | null; pdfs: string[] } | null> {
  const id = url.match(/topic-details\/([A-Za-z0-9._-]+)/)?.[1];
  if (!id) return null;
  try {
    const form = new FormData();
    form.append("query", new Blob([JSON.stringify({ bool: { must: [{ terms: { language: ["en"] } }, { terms: { identifier: [id] } }] } })], { type: "application/json" }));
    form.append("languages", new Blob([JSON.stringify(["en"])], { type: "application/json" }));
    const res = await fetch(`https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA&text=${encodeURIComponent(`"${id}"`)}&pageSize=5`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return { id, text: null, pdfs: [] };
    const json = (await res.json()) as { results?: { metadata?: Record<string, string[] | undefined> }[] };
    const m = json.results?.find((r) => r.metadata?.topicConditions?.[0] || r.metadata?.descriptionByte?.[0])?.metadata;
    if (!m) return { id, text: null, pdfs: [] };
    const clean = (h?: string) => (h ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    const text = [`Conditions: ${clean(m.topicConditions?.[0])}`, `Description: ${clean(m.descriptionByte?.[0])}`].join("\n\n");
    return { id, text: text.slice(0, 9000), pdfs: pdfLinksIn(JSON.stringify(m), url) };
  } catch {
    return { id, text: null, pdfs: [] };
  }
}

/** Call page text plus excerpts of its official PDFs, each labelled with its source. */
function buildCallText(
  r: { title: string; program: string | null; deadline: string | null; summary: string | null },
  official: string | null,
  docs: CallDocument[],
): string {
  const head = `Title: ${r.title}\nProgramme: ${r.program ?? "not stated"}\nDeadline: ${r.deadline ?? "not stated"}\n\nCall text:\n${official ?? r.summary ?? "(no text)"}`;
  return [head, ...docs.map((d, i) => `\n\n=== Official call document ${i + 1} (${d.url}) ===\n${d.text}`)].join("");
}

/** Tags each verified quote with the document it came from, so people can check it. */
function withSources(rules: CallRules | null, pageUrl: string, docs: CallDocument[]): CallRules | null {
  if (!rules) return null;
  const squashed = docs.map((d) => ({ url: d.url, t: squash(d.text) }));
  return {
    ...rules,
    evidence: rules.evidence.map((e) => ({ ...e, source: squashed.find((d) => d.t.includes(squash(e.quote)))?.url ?? pageUrl })),
  };
}

export interface ExtractSummary { read: number; failed: number; stoppedBy: string | null }

/** Reads rules for calls never read or whose text changed. Stops on credit or access errors. */
export async function extractPendingRules(limit = MAX_PER_RUN): Promise<ExtractSummary> {
  if (!hasLovableAi()) return { read: 0, failed: 0, stoppedBy: "ai_not_configured" };
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select()
    .from(grantOpportunities)
    .where(
      and(
        or(isNull(grantOpportunities.deadline), sql`left(${grantOpportunities.deadline}, 10) >= ${today}`),
        or(isNull(grantOpportunities.rulesExtractedAt), sql`${grantOpportunities.contentHash} is distinct from ${grantOpportunities.rulesHash}`),
      ),
    )
    .limit(limit * 3);
  let read = 0;
  let failed = 0;
  for (const r of rows) {
    if (read >= limit) break;
    try {
      const topic = r.source === "eu-funding-tenders" ? await euTopic(r.url) : null;
      const official = topic?.text ?? null;
      const pdfUrls = topic ? topic.pdfs : await pdfLinksOnPage(r.url);
      const docs = await readCallDocuments(pdfUrls, topic?.id ?? r.externalId);
      const callText = buildCallText(r, official, docs);
      const hash = await sha256Hex(callText);
      if (r.rulesExtractedAt && r.rulesHash === hash) {
        await db.update(grantOpportunities).set({ contentHash: hash }).where(eq(grantOpportunities.id, r.id));
        continue;
      }
      const raw = await aiResponsesJson<CallRules>({
        system: SYSTEM,
        user: callText,
        schemaName: "call_rules",
        schema: SCHEMA,
      });
      const rules = withSources(sanitize(raw, callText), r.url, docs);
      await db
        .update(grantOpportunities)
        .set({ rules, rulesHash: hash, contentHash: hash, rulesExtractedAt: new Date() })
        .where(eq(grantOpportunities.id, r.id));
      read += 1;
    } catch (e) {
      if (e instanceof AiGatewayError && [401, 402, 403].includes(e.status)) {
        log.error("rule reading paused", e);
        return { read, failed, stoppedBy: `gateway_${e.status}` };
      }
      if (e instanceof AiGatewayError && (e.status === 429 || e.status >= 500)) {
        log.error("rule reading deferred to next run", e);
        return { read, failed: failed + 1, stoppedBy: `gateway_${e.status}` };
      }
      failed += 1;
      log.error("rule reading failed for one call", e);
    }
  }
  return { read, failed, stoppedBy: null };
}

export { sanitize as sanitizeRules, SYSTEM as RULES_SYSTEM, SCHEMA as RULES_SCHEMA, buildCallText, euTopic };
