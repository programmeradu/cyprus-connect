/**
 * Cyprus Registrar of Companies, read from the national open-data portal.
 *
 * The Registrar has no API of its own. It publishes the full register on
 * data.gov.cy (CC BY 4.0, refreshed about monthly), and the portal serves it
 * through a queryable datastore. Three tables:
 *   organisations      name, number, type, status, registration date
 *   registered office  address per address_seq_no
 *   officials          directors and secretaries per company
 *
 * Every answer says where it came from and when the register was read. When
 * the portal is silent we say so; nothing is filled in.
 */

import { logger } from "@/lib/log";

const log = logger("lib.integrations.registry");

const DATASTORE = "https://data.gov.cy/api/action/datastore/search.json";
const RES = {
  organisations: "b48bf3b6-51f2-4368-8eaa-63d61836aaa9",
  offices: "31d675a2-4335-40ba-b63c-d830d6b5c55d",
  officials: "a1deb65d-102b-4e8e-9b9c-5b357d719477",
} as const;
export const REGISTRY_SOURCE =
  "Department of Registrar of Companies and Intellectual Property, via data.gov.cy (CC BY 4.0)";
export const REGISTRY_DATASET_URL =
  "https://data.gov.cy/el/dataset/mitroo-eggegrammenon-etaireion-emporikon-eponymion-kai-synetairismon-stin-kypro";
const TIMEOUT_MS = 10_000;
const TTL_MS = 6 * 60 * 60 * 1000;

export type RegistryType = "C" | "P" | "B" | "O";
const TYPE_LABEL: Record<string, { en: string; prefix: string }> = {
  C: { en: "Company", prefix: "HE" },
  P: { en: "Partnership", prefix: "OE" },
  B: { en: "Business name", prefix: "BN" },
  O: { en: "Overseas company", prefix: "AE" },
};

/** Greek status words from the register, in plain English. Unknown ones pass through. */
const STATUS_EN: Array<[RegExp, string]> = [
  [/^Εγγεγραμμ/i, "Registered"],
  [/Διαγρ/i, "Struck off"],
  [/Εκκαθ/i, "In liquidation"],
  [/Διαλ/i, "Dissolved"],
  [/Συγχ|Συγχών/i, "Merged"],
  [/Μετοικ|Μεταφ/i, "Moved abroad"],
];
const POSITION_EN: Array<[RegExp, string]> = [
  [/Διευθυντ/i, "Director"],
  [/Γραμματ/i, "Secretary"],
  [/Συνέταιρ|Συνεταίρ/i, "Partner"],
];

function translate(table: Array<[RegExp, string]>, value: string): string {
  const v = value.trim();
  for (const [re, en] of table) if (re.test(v)) return en;
  return v;
}

export interface RegistryCompany {
  name: string;
  registrationNo: string;
  /** "HE 165" style, as Cypriot paperwork prints it. */
  displayNo: string;
  type: string;
  typeLabel: string;
  subType: string | null;
  status: string;
  /** True only when the register says Registered. */
  active: boolean;
  registeredOn: string | null;
  statusDate: string | null;
  addressSeqNo: string | null;
}

export interface RegistryDetail extends RegistryCompany {
  address: string | null;
  officials: { name: string; position: string }[];
  source: string;
  sourceUrl: string;
  readAt: string;
}

interface OrgRow {
  organisation_name?: string;
  registration_no?: string;
  organisation_type_code?: string;
  organisation_type?: string;
  organisation_sub_type?: string;
  name_status_code?: string;
  registration_date?: string;
  organisation_status?: string;
  organisation_status_date?: string;
  address_seq_no?: string;
}

const cache = new Map<string, { at: number; value: unknown }>();

async function query<T>(resource: string, params: Record<string, string>): Promise<T[]> {
  const url = new URL(DATASTORE);
  url.searchParams.set("resource_id", resource);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const key = url.toString();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T[];
  const res = await fetch(key, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`data.gov.cy ${res.status}`);
  const body = (await res.json()) as { success?: boolean; result?: { records?: T[] } };
  if (!body.success) throw new Error("data.gov.cy answered without success");
  const rows = body.result?.records ?? [];
  cache.set(key, { at: Date.now(), value: rows });
  return rows;
}

/** "HE 12345", "ΗΕ12345", "he-12345" or "12345" → { type, number }. Null when no number. */
export function parseRegistrationNo(input: string): { type: RegistryType; number: string } | null {
  const raw = input.normalize("NFKC").toUpperCase().replace(/[\s.\-/]/g, "");
  // Greek capitals that look like Latin ones.
  const latin = raw.replace(/Η/g, "H").replace(/Ε/g, "E").replace(/Ο/g, "O").replace(/Α/g, "A").replace(/Β/g, "B").replace(/Ν/g, "N");
  const m = latin.match(/^(HE|OE|AE|BN)?(\d{1,7})$/);
  if (!m) return null;
  const prefix = m[1] ?? "HE";
  const type: RegistryType = prefix === "OE" ? "P" : prefix === "AE" ? "O" : prefix === "BN" ? "B" : "C";
  return { type, number: String(Number(m[2])) };
}

function toCompany(r: OrgRow): RegistryCompany {
  const type = (r.organisation_type_code ?? "").trim() || "C";
  const label = TYPE_LABEL[type] ?? { en: (r.organisation_type ?? type).trim(), prefix: type };
  const status = translate(STATUS_EN, r.organisation_status ?? "");
  return {
    name: (r.organisation_name ?? "").trim(),
    registrationNo: (r.registration_no ?? "").trim(),
    displayNo: `${label.prefix} ${(r.registration_no ?? "").trim()}`,
    type,
    typeLabel: label.en,
    subType: r.organisation_sub_type?.trim() === "Δημόσια" ? "Public" : r.organisation_sub_type?.trim() === "Ιδιωτική" ? "Private" : r.organisation_sub_type?.trim() || null,
    status: status || "Unknown",
    active: status === "Registered",
    registeredOn: r.registration_date?.trim() || null,
    statusDate: r.organisation_status_date?.trim() || null,
    addressSeqNo: r.address_seq_no?.trim() || null,
  };
}

/** Current-name rows only: the register also keeps every former name. */
const isCurrentName = (r: OrgRow) => !r.name_status_code || r.name_status_code === "ACR";

/** Search by name. Active companies first, then other types and old entries. Max 10. */
export async function searchRegistry(
  text: string,
): Promise<{ ok: true; results: RegistryCompany[] } | { ok: false; reason: "too_short" | "unavailable" }> {
  const q = text.trim().replace(/\s+/g, " ").slice(0, 120);
  const asNo = parseRegistrationNo(q);
  if (asNo) {
    const one = await lookupRegistry(q);
    if (!one.ok) return one.reason === "not_found" ? { ok: true, results: [] } : { ok: false, reason: "unavailable" };
    return { ok: true, results: [one.company] };
  }
  if (q.length < 3) return { ok: false, reason: "too_short" };
  try {
    const rows = await query<OrgRow>(RES.organisations, { q, limit: "60" });
    const list = rows.filter(isCurrentName).map(toCompany);
    const rank = (c: RegistryCompany) => (c.active ? 0 : 2) + (c.type === "C" ? 0 : 1);
    list.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
    return { ok: true, results: list.slice(0, 10) };
  } catch (error) {
    log.warn("registry search failed", { errorMessage: error instanceof Error ? error.message : String(error) });
    return { ok: false, reason: "unavailable" };
  }
}

/** Full record for one registration number: entry, registered office and officials. */
export async function lookupRegistry(
  registrationNo: string,
): Promise<{ ok: true; company: RegistryDetail } | { ok: false; reason: "bad_number" | "not_found" | "unavailable" }> {
  const parsed = parseRegistrationNo(registrationNo);
  if (!parsed) return { ok: false, reason: "bad_number" };
  try {
    const rows = await query<OrgRow>(RES.organisations, {
      "filters[registration_no]": parsed.number,
      "filters[organisation_type_code]": parsed.type,
      limit: "10",
    });
    const row = rows.find(isCurrentName) ?? rows[0];
    if (!row) return { ok: false, reason: "not_found" };
    const company = toCompany(row);
    const [offices, officials] = await Promise.all([
      company.addressSeqNo
        ? query<{ street?: string; building?: string; territory?: string }>(RES.offices, {
            "filters[address_seq_no]": company.addressSeqNo,
            limit: "1",
          }).catch(() => [])
        : Promise.resolve([]),
      query<{ person_or_organisation_name?: string; official_position?: string }>(RES.officials, {
        "filters[registration_no]": parsed.number,
        "filters[organisation_type_code]": parsed.type,
        limit: "50",
      }).catch(() => []),
    ]);
    const o = offices[0];
    const address = o
      ? [o.street, o.building, o.territory]
          .map((p) => (p ?? "").replace(/,\s*$/, "").trim())
          .filter(Boolean)
          .join(", ") || null
      : null;
    return {
      ok: true,
      company: {
        ...company,
        address,
        officials: officials
          .map((p) => ({
            name: (p.person_or_organisation_name ?? "").replace(/\s+/g, " ").trim(),
            position: translate(POSITION_EN, p.official_position ?? ""),
          }))
          .filter((p) => p.name),
        source: REGISTRY_SOURCE,
        sourceUrl: REGISTRY_DATASET_URL,
        readAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    log.warn("registry lookup failed", { errorMessage: error instanceof Error ? error.message : String(error) });
    return { ok: false, reason: "unavailable" };
  }
}
