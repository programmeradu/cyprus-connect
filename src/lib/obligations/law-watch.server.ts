/**
 * Law watch: asks EUR-Lex (Cellar SPARQL) which acts amend the base laws the
 * rulebook relies on. A new amending act is stored unreviewed, which shows the
 * affected deadlines as "under review" until a person confirms the rule. No AI
 * reads or rewrites dates.
 */

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { lawWatch } from "@/db/schema";
import { logger } from "@/lib/log";
import { TRACKED_CELEX } from "./rulebook";

const SPARQL = "https://publications.europa.eu/webapi/rdf/sparql";

export function amendmentsQuery(celex: readonly string[], since: string): string {
  const list = celex.map((c) => `"${c.replace(/[^0-9A-Z]/g, "")}"`).join(",");
  return `PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT DISTINCT ?base ?celex ?date WHERE {
  ?act cdm:resource_legal_amends_resource_legal ?b .
  ?b cdm:resource_legal_id_celex ?base .
  ?act cdm:resource_legal_id_celex ?celex .
  ?act cdm:work_date_document ?date .
  FILTER(STR(?base) IN (${list}))
  FILTER(?date >= "${since}"^^<http://www.w3.org/2001/XMLSchema#date>)
} ORDER BY DESC(?date) LIMIT 200`;
}

interface Binding { base: { value: string }; celex: { value: string }; date: { value: string } }

export function parseAmendments(json: unknown): { base: string; celex: string; date: string }[] {
  const b = (json as { results?: { bindings?: Binding[] } })?.results?.bindings ?? [];
  return b
    .filter((x) => x?.base?.value && x?.celex?.value && /^\d{4}-\d{2}-\d{2}/.test(x?.date?.value ?? ""))
    .map((x) => ({ base: x.base.value, celex: x.celex.value, date: x.date.value.slice(0, 10) }))
    // Corrigenda (R(01) suffix) don't change rules.
    .filter((x) => !/R\(\d+\)$/.test(x.celex));
}

export async function checkLawChanges(): Promise<{ seen: number; added: number } | { error: string }> {
  try {
    const res = await fetch(SPARQL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/sparql-results+json" },
      body: new URLSearchParams({ query: amendmentsQuery(TRACKED_CELEX, "2025-01-01") }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return { error: `EUR-Lex answered ${res.status}` };
    const rows = parseAmendments(await res.json());
    let added = 0;
    for (const r of rows) {
      const out = await db
        .insert(lawWatch)
        .values({ baseCelex: r.base, amendingCelex: r.celex, actDate: r.date })
        .onConflictDoNothing()
        .returning({ c: sql`1` });
      added += out.length;
    }
    return { seen: rows.length, added };
  } catch (e) {
    const ref = logger("law-watch").error("EUR-Lex amendment check failed", e);
    return { error: `EUR-Lex unavailable (${ref})` };
  }
}
