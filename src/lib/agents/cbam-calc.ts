/**
 * CBAM declaration maths. Pure functions, no I/O, fully tested.
 *
 * Rules applied (definitive period, from 1 January 2026):
 * - Annual declaration per calendar year. Under Regulation (EU) 2025/2083 the
 *   declaration for year N is due by 30 September of year N+1.
 * - De minimis: an importer below 50 tonnes of CBAM goods a year (electricity
 *   and hydrogen excluded from the mass count) has no CBAM obligation.
 * - Embedded emissions = mass x specific embedded emissions (SEE). Indirect
 *   emissions count only where the sector has them in scope (cement and
 *   fertilisers; hydrogen per our table).
 * - Supplier actual values are preferred. A line without them falls back to
 *   our indicative default table, which is NOT the Commission's definitive
 *   default table with mark-ups. Such lines are flagged, never hidden.
 *
 * The founder must confirm these rules against the primary texts before the
 * first real filing (see docs/FOUNDER_EXTERNAL_SETUP.md).
 */

import { CN_CODES, type CnCode } from "@/data/tools/cbam-cn-codes";

export const DE_MINIMIS_TONNES = 50;
export const DRAFT_VERSION = 1;

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
  sector: CnCode["sector"] | null;
  supplierName: string;
  originCountry: string;
  installationId: string | null;
  netMass: number;
  unit: "t" | "MWh";
  directSee: number | null;
  indirectSee: number | null;
  basis: "actual" | "default" | "mixed" | "unknown_cn";
  directT: number;
  indirectT: number;
  embeddedT: number;
}

export type IssueKind = "unknown_cn" | "default_values" | "no_installation" | "wrong_year";

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
  };
  bySector: Array<{ sector: string; massTonnes: number; embeddedT: number }>;
  bySupplier: Array<{ supplierName: string; lines: number; embeddedT: number; defaultLines: number }>;
  belowThreshold: boolean;
  issues: CbamIssue[];
  status: "needs_data" | "below_threshold" | "awaiting_signature";
}

const digits = (code: string) => code.replace(/\D/g, "");

/** Longest CN prefix in our table that the declared code starts with. */
export function lookupCn(code: string): CnCode | null {
  const d = digits(code);
  if (d.length < 4) return null;
  let best: CnCode | null = null;
  for (const entry of CN_CODES) {
    const e = digits(entry.code);
    if (d.startsWith(e) && (!best || e.length > digits(best.code).length)) best = entry;
  }
  return best;
}

const round = (n: number, dp = 4) => Math.round(n * 10 ** dp) / 10 ** dp;

export function computeLine(line: CbamLineInput): CbamLineResult {
  const cn = lookupCn(line.cnCode);
  const unit = cn?.sector === "electricity" ? "MWh" : "t";
  if (!cn) {
    return {
      id: line.id, cnCode: line.cnCode, cnMatch: null, sector: null,
      supplierName: line.supplierName, originCountry: line.originCountry,
      installationId: line.installationId, netMass: line.netMass, unit,
      directSee: null, indirectSee: null, basis: "unknown_cn",
      directT: 0, indirectT: 0, embeddedT: 0,
    };
  }
  const direct = line.directSee ?? cn.defaultDirect;
  const indirect = cn.indirectInScope ? (line.indirectSee ?? cn.defaultIndirect) : 0;
  const directActual = line.directSee !== null;
  const indirectActual = !cn.indirectInScope || line.indirectSee !== null;
  const basis = directActual && indirectActual ? "actual" : !directActual && !indirectActual ? "default" : "mixed";
  const directT = round(line.netMass * direct);
  const indirectT = round(line.netMass * indirect);
  return {
    id: line.id, cnCode: line.cnCode, cnMatch: cn.code, sector: cn.sector,
    supplierName: line.supplierName, originCountry: line.originCountry,
    installationId: line.installationId, netMass: line.netMass, unit,
    directSee: direct, indirectSee: cn.indirectInScope ? indirect : null, basis,
    directT, indirectT, embeddedT: round(directT + indirectT),
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
      message: `${unknown.length} line(s) have a CN code that is not a CBAM good in our table. Check the code or remove the line.`,
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
        message: `${supplierName}: ${s.defaultLines.length} line(s) use indicative default values. Ask the supplier for actual embedded emissions per installation.`,
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
  const blocking = issues.some((i) => i.kind === "unknown_cn" || i.kind === "wrong_year");

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
