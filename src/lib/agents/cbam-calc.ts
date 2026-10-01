/**
 * CBAM declaration maths. Pure functions, no I/O, fully tested.
 *
 * Rules applied (definitive period, from 1 January 2026):
 * - Annual declaration per calendar year. Under Regulation (EU) 2025/2083 the
 *   declaration for year N is due by 30 September of year N+1.
 * - De minimis: an importer below 50 tonnes of CBAM goods a year (electricity
 *   and hydrogen excluded from the mass count) has no CBAM obligation.
 * - Embedded emissions = mass x specific embedded emissions (SEE). Indirect
 *   emissions count only for cement and fertilisers.
 * - Supplier actual values are preferred. A line without them uses the EU's
 *   official default value for its country of origin (src/lib/cbam/official.ts),
 *   falling back as the regulation says. Such lines are flagged, never hidden.
 * - Certificates = mass x (SEE, with the default-value mark-up where defaults
 *   are used) - free allocation adjustment (CBAM factor x CSCF x CBAM benchmark).
 *   Carbon prices paid abroad are not deducted. Cost = certificates x the
 *   official quarterly price; quarters with no published price are provisional.
 */

import {
  certificatePrice,
  cbamFactor,
  cscf,
  lookupBenchmark,
  lookupDefault,
  lookupGood,
  markupFor,
  type CbamSector,
  type GoodInfo,
} from "@/lib/cbam/official";

export const DE_MINIMIS_TONNES = 50;
export const DRAFT_VERSION = 2;
const INDIRECT_SECTORS = new Set<CbamSector>(["cement", "fertilisers"]);

export interface CbamLineInput {
  id: number;
  importDate: string;
  cnCode: string;
  description: string | null;
  originCountry: string;
  supplierName: string;
  installationId: string | null;
  netMass: number;
  directSee: number | null;
  indirectSee: number | null;
  customsRef: string | null;
}

export interface CbamLineResult {
  id: number;
  cnCode: string;
  cnMatch: string | null;
  sector: CbamSector | null;
  supplierName: string;
  originCountry: string;
  installationId: string | null;
  netMass: number;
  unit: "t" | "MWh";
  directSee: number | null;
  indirectSee: number | null;
  basis: "actual" | "default" | "mixed" | "unknown_cn" | "no_default";
  directT: number;
  indirectT: number;
  embeddedT: number;
  /** Where the default value came from, when one is used. */
  defaultSource: null | { table: "country" | "other" | "unknown_origin"; tableName: string; total: number; exact: boolean };
  markup: number;
  route: string | null;
  /** Free allocation per tonne (tCO2e/t), null when it cannot be worked out. */
  sefa: number | null;
  certificates: number | null;
  priceEur: number | null;
  priceQuarter: string | null;
  priceProvisional: boolean;
  costEur: number | null;
  costExact: boolean;
}

export type IssueKind = "unknown_cn" | "default_values" | "no_installation" | "wrong_year" | "no_default" | "short_cn";

export interface CbamIssue {
  kind: IssueKind;
  lineIds: number[];
  supplierName?: string;
  message: string;
}

export interface CbamDraft {
  version: number;
  year: number;
  dueDate: string;
  lines: CbamLineResult[];
  totals: {
    lines: number;
    massTonnesCounted: number;
    electricityMWh: number;
    directT: number;
    indirectT: number;
    embeddedT: number;
    defaultShare: number;
    /** Sum of line certificates; lines without a figure are listed in costMissingLines. */
    certificates: number;
    costEur: number;
    costMissingLines: number;
    costProvisional: boolean;
    costExact: boolean;
  };
  bySector: Array<{ sector: string; massTonnes: number; embeddedT: number }>;
  bySupplier: Array<{ supplierName: string; lines: number; embeddedT: number; defaultLines: number }>;
  belowThreshold: boolean;
  issues: CbamIssue[];
  status: "needs_data" | "below_threshold" | "awaiting_signature";
}

const digits = (code: string) => code.replace(/\D/g, "");

/** The official CBAM good for a declared CN code, or null when it is not a CBAM good. */
export function lookupCn(code: string): GoodInfo | null {
  return lookupGood(code);
}

const round = (n: number, dp = 4) => Math.round(n * 10 ** dp) / 10 ** dp;

export function computeLine(line: CbamLineInput): CbamLineResult {
  const cn = lookupCn(line.cnCode);
  const unit = cn?.sector === "electricity" ? "MWh" : "t";
  const year = Number(line.importDate.slice(0, 4));
  const base = {
    id: line.id, cnCode: line.cnCode, supplierName: line.supplierName, originCountry: line.originCountry,
    installationId: line.installationId, netMass: line.netMass, unit,
  } as const;
  const none = { defaultSource: null, markup: 0, route: null, sefa: null, certificates: null, priceEur: null, priceQuarter: null, priceProvisional: false, costEur: null, costExact: false };
  if (!cn) {
    return { ...base, cnMatch: null, sector: null, directSee: null, indirectSee: null, basis: "unknown_cn", directT: 0, indirectT: 0, embeddedT: 0, ...none };
  }
  const indirectInScope = INDIRECT_SECTORS.has(cn.sector);
  const needsDefault = line.directSee === null || (indirectInScope && line.indirectSee === null);
  const dv = needsDefault ? lookupDefault(line.cnCode, line.originCountry) : null;

  if (needsDefault && !dv && line.directSee === null) {
    // Electricity (IEA-licensed factors not shipped) or a good with no published default.
    return { ...base, cnMatch: cn.code, sector: cn.sector, directSee: null, indirectSee: null, basis: "no_default", directT: 0, indirectT: 0, embeddedT: 0, ...none };
  }

  // Default split: Annex I gives direct/indirect for information; the total is what counts.
  const dvIndirect = dv && indirectInScope ? dv.indirect ?? 0 : 0;
  const dvDirect = dv ? dv.total - dvIndirect : 0;
  const direct = line.directSee ?? dvDirect;
  const indirect = indirectInScope ? (line.indirectSee ?? dvIndirect) : 0;
  const directActual = line.directSee !== null;
  const indirectActual = !indirectInScope || line.indirectSee !== null;
  const basis = directActual && indirectActual ? "actual" : !directActual && !indirectActual ? "default" : "mixed";
  const directT = round(line.netMass * direct);
  const indirectT = round(line.netMass * indirect);
  const embeddedT = round(directT + indirectT);

  // Certificates and cost.
  const markup = basis === "actual" ? 0 : markupFor(year, cn.sector);
  const defaultPartPerT = (directActual ? 0 : direct) + (indirectActual ? 0 : indirect);
  const seeForCertificates = direct + indirect + defaultPartPerT * markup;
  const route = dv?.route ?? null;
  const factor = cscf(year);
  const bm = cn.sector === "electricity" ? null : lookupBenchmark(line.cnCode, year, route, basis === "actual" ? "a" : "b");
  const sefa = factor !== null && bm ? round(cbamFactor(year) * factor * bm.value, 6) : cn.sector === "electricity" ? 0 : null;
  const certificates = sefa === null ? null : round(Math.max(0, line.netMass * (seeForCertificates - sefa)), 4);
  const price = certificatePrice(line.importDate);
  const costEur = certificates !== null && price ? Math.round(certificates * price.eur * 100) / 100 : null;
  return {
    ...base, cnMatch: cn.code, sector: cn.sector,
    directSee: direct, indirectSee: indirectInScope ? indirect : null, basis, directT, indirectT, embeddedT,
    defaultSource: dv ? { table: dv.table, tableName: dv.tableName, total: dv.total, exact: dv.exact } : null,
    markup, route, sefa, certificates,
    priceEur: price?.eur ?? null, priceQuarter: price?.quarter ?? null, priceProvisional: price?.provisional ?? false,
    costEur,
    costExact: Boolean(cn.exact && (bm?.exact ?? cn.sector === "electricity") && (!dv || dv.exact) && basis !== "actual"),
  };
}

export function dueDateFor(year: number): string {
  return `${year + 1}-09-30`;
}

export function buildDraft(year: number, input: CbamLineInput[]): CbamDraft {
  const lines = [...input].sort((a, b) => a.id - b.id).map(computeLine);
  const issues: CbamIssue[] = [];

  const unknown = lines.filter((l) => l.basis === "unknown_cn");
  if (unknown.length) {
    issues.push({
      kind: "unknown_cn",
      lineIds: unknown.map((l) => l.id),
      message: `${unknown.length} line(s) have a CN code that is not a CBAM good. Check the code or remove the line.`,
    });
  }
  const noDefault = lines.filter((l) => l.basis === "no_default");
  if (noDefault.length) {
    issues.push({
      kind: "no_default",
      lineIds: noDefault.map((l) => l.id),
      message: `${noDefault.length} line(s) have no EU default value we can use (for electricity, the official factors are licensed separately). Enter the supplier's actual value.`,
    });
  }
  const short = lines.filter((l) => l.basis !== "unknown_cn" && l.basis !== "no_default" && !lookupCn(l.cnCode)?.exact);
  if (short.length) {
    issues.push({
      kind: "short_cn",
      lineIds: short.map((l) => l.id),
      message: `${short.length} line(s) have a short CN code that covers several goods. We used the highest default value and the lowest benchmark, so the cost is on the high side. Add the full 8-digit code.`,
    });
  }
  const wrongYear = input.filter((l) => !l.importDate.startsWith(String(year)));
  if (wrongYear.length) {
    issues.push({
      kind: "wrong_year",
      lineIds: wrongYear.map((l) => l.id),
      message: `${wrongYear.length} line(s) have an import date outside ${year}.`,
    });
  }

  const supplierMap = new Map<string, { lines: number; embeddedT: number; defaultLines: number[]; noInst: number[] }>();
  for (const l of lines) {
    const s = supplierMap.get(l.supplierName) ?? { lines: 0, embeddedT: 0, defaultLines: [], noInst: [] };
    s.lines += 1;
    s.embeddedT += l.embeddedT;
    if (l.basis === "default" || l.basis === "mixed") s.defaultLines.push(l.id);
    if (!l.installationId && l.basis !== "unknown_cn") s.noInst.push(l.id);
    supplierMap.set(l.supplierName, s);
  }
  for (const [supplierName, s] of [...supplierMap.entries()].sort()) {
    if (s.defaultLines.length) {
      issues.push({
        kind: "default_values",
        lineIds: s.defaultLines,
        supplierName,
        message: `${supplierName}: ${s.defaultLines.length} line(s) use EU default values (with a mark-up when buying certificates). Ask the supplier for actual embedded emissions per installation.`,
      });
    }
    if (s.noInst.length) {
      issues.push({
        kind: "no_installation",
        lineIds: s.noInst,
        supplierName,
        message: `${supplierName}: ${s.noInst.length} line(s) have no production installation ID.`,
      });
    }
  }

  const counted = lines.filter((l) => l.sector && l.sector !== "electricity" && l.sector !== "hydrogen");
  const massTonnesCounted = round(counted.reduce((a, l) => a + l.netMass, 0), 3);
  const electricityMWh = round(lines.filter((l) => l.sector === "electricity").reduce((a, l) => a + l.netMass, 0), 3);
  const directT = round(lines.reduce((a, l) => a + l.directT, 0), 3);
  const indirectT = round(lines.reduce((a, l) => a + l.indirectT, 0), 3);
  const embeddedT = round(directT + indirectT, 3);
  const defaultT = lines.filter((l) => l.basis === "default" || l.basis === "mixed").reduce((a, l) => a + l.embeddedT, 0);

  const sectorMap = new Map<string, { massTonnes: number; embeddedT: number }>();
  for (const l of lines) {
    if (!l.sector) continue;
    const s = sectorMap.get(l.sector) ?? { massTonnes: 0, embeddedT: 0 };
    s.massTonnes += l.netMass;
    s.embeddedT += l.embeddedT;
    sectorMap.set(l.sector, s);
  }

  // Only electricity/hydrogen importers are not covered by the mass threshold.
  const hasUncountedGoods = lines.some((l) => l.sector === "electricity" || l.sector === "hydrogen");
  const belowThreshold = massTonnesCounted < DE_MINIMIS_TONNES && !hasUncountedGoods;
  const blocking = issues.some((i) => i.kind === "unknown_cn" || i.kind === "wrong_year" || i.kind === "no_default");
  const priced = lines.filter((l) => l.costEur !== null);
  const scoped = lines.filter((l) => l.basis !== "unknown_cn");

  return {
    version: DRAFT_VERSION,
    year,
    dueDate: dueDateFor(year),
    lines,
    totals: {
      lines: lines.length,
      massTonnesCounted,
      electricityMWh,
      directT,
      indirectT,
      embeddedT,
      defaultShare: embeddedT > 0 ? round(defaultT / embeddedT, 4) : 0,
      certificates: round(priced.reduce((a, l) => a + (l.certificates ?? 0), 0), 3),
      costEur: Math.round(priced.reduce((a, l) => a + (l.costEur ?? 0), 0) * 100) / 100,
      costMissingLines: scoped.length - priced.length,
      costProvisional: priced.some((l) => l.priceProvisional),
      costExact: priced.length > 0 && priced.every((l) => l.costExact),
    },
    bySector: [...sectorMap.entries()]
      .map(([sector, v]) => ({ sector, massTonnes: round(v.massTonnes, 3), embeddedT: round(v.embeddedT, 3) }))
      .sort((a, b) => b.embeddedT - a.embeddedT),
    bySupplier: [...supplierMap.entries()]
      .map(([supplierName, v]) => ({ supplierName, lines: v.lines, embeddedT: round(v.embeddedT, 3), defaultLines: v.defaultLines.length }))
      .sort((a, b) => b.embeddedT - a.embeddedT),
    belowThreshold,
    issues,
    status: blocking ? "needs_data" : belowThreshold ? "below_threshold" : "awaiting_signature",
  };
}

/* ------------------------------------------------------------------ */
/* CSV import                                                           */
/* ------------------------------------------------------------------ */

export const CSV_COLUMNS = [
  "import_date", "cn_code", "description", "origin_country", "supplier",
  "installation_id", "net_mass", "direct_see", "indirect_see", "customs_ref",
] as const;

/** RFC 4180 parser: quoted fields, escaped quotes, CRLF, a UTF-8 BOM. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === "," || c === ";") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

/** "1.234,5" and "1,234.5" and "1234.5" all read as 1234.5. */
export function parseNumber(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, "");
  if (!s) return null;
  let n = s;
  const lastComma = n.lastIndexOf(",");
  const lastDot = n.lastIndexOf(".");
  if (lastComma > lastDot) n = n.replace(/\./g, "").replace(",", ".");
  else n = n.replace(/,/g, "");
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}

export interface ParsedImportRow {
  row: number;
  importDate: string;
  cnCode: string;
  description: string | null;
  originCountry: string;
  supplierName: string;
  installationId: string | null;
  netMass: number;
  directSee: number | null;
  indirectSee: number | null;
  customsRef: string | null;
}

export function parseImportCsv(text: string): { rows: ParsedImportRow[]; errors: string[] } {
  const table = parseCsv(text);
  const errors: string[] = [];
  if (table.length < 2) return { rows: [], errors: ["The file has no data rows."] };
  const head = table[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const idx = (name: string) => head.indexOf(name);
  for (const need of ["import_date", "cn_code", "origin_country", "supplier", "net_mass"]) {
    if (idx(need) < 0) errors.push(`Missing column "${need}".`);
  }
  if (errors.length) return { rows: [], errors };
  const get = (r: string[], name: string) => (idx(name) >= 0 ? (r[idx(name)] ?? "").trim() : "");

  const rows: ParsedImportRow[] = [];
  table.slice(1).forEach((r, i) => {
    const n = i + 2;
    const date = get(r, "import_date");
    const cn = get(r, "cn_code");
    const mass = parseNumber(get(r, "net_mass"));
    const dRaw = get(r, "direct_see");
    const iRaw = get(r, "indirect_see");
    const d = dRaw ? parseNumber(dRaw) : null;
    const ind = iRaw ? parseNumber(iRaw) : null;
    const origin = get(r, "origin_country").toUpperCase();
    const supplier = get(r, "supplier");
    const problems: string[] = [];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) problems.push("import_date must be YYYY-MM-DD");
    else if (!isRealDate(date)) problems.push("import_date is not a real calendar date");
    if (digits(cn).length < 4) problems.push("cn_code needs at least 4 digits");
    if (mass === null || mass <= 0) problems.push("net_mass must be a positive number");
    if (dRaw && (d === null || d < 0)) problems.push("direct_see must be a number ≥ 0");
    if (iRaw && (ind === null || ind < 0)) problems.push("indirect_see must be a number ≥ 0");
    if (!/^[A-Z]{2}$/.test(origin)) problems.push("origin_country must be a 2-letter ISO code");
    if (!supplier) problems.push("supplier is required");
    if (problems.length) {
      errors.push(`Row ${n}: ${problems.join("; ")}.`);
      return;
    }
    rows.push({
      row: n,
      importDate: date,
      cnCode: cn,
      description: get(r, "description") || null,
      originCountry: origin,
      supplierName: supplier.slice(0, 200),
      installationId: get(r, "installation_id") || null,
      netMass: mass!,
      directSee: d,
      indirectSee: ind,
      customsRef: get(r, "customs_ref") || null,
    });
  });
  return { rows, errors };
}

/** True when a YYYY-MM-DD string names a day that exists (no 2026-02-30). */
export function isRealDate(iso: string): boolean {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}
