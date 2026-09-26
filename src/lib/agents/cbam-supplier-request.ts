/**
 * The data request Border sends to a CBAM supplier. Pure and deterministic:
 * the same draft gives the same email, so a daily re-run does not create a new
 * approval unless the facts changed. No dates from the clock go into the text.
 */

import type { CbamDraft, CbamLineResult } from "./cbam-calc";

export const RESEND_AFTER_DAYS = 21;
const INDIRECT_SECTORS = new Set(["cement", "fertilisers"]);

export interface SupplierRequestInput {
  year: number;
  supplierName: string;
  contactName: string | null;
  importerName: string | null;
  lines: CbamLineResult[];
  dueDate: string;
}

export interface SupplierRequest {
  subject: string;
  body: string;
  replyBy: string;
  lineIds: number[];
}

/** Suppliers the draft still needs something from, in a stable order. */
export function suppliersNeedingData(draft: Pick<CbamDraft, "issues">): string[] {
  const names = new Set<string>();
  for (const i of draft.issues) {
    if ((i.kind === "default_values" || i.kind === "no_installation") && i.supplierName) names.add(i.supplierName);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

/** 90 days before the declaration is due, so there is time to check the data. */
export function replyByFor(dueDate: string): string {
  const d = new Date(`${dueDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 90);
  return d.toISOString().slice(0, 10);
}

const fmt = (v: number) => v.toLocaleString("en-GB", { maximumFractionDigits: 3 });
const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function buildSupplierRequest(p: SupplierRequestInput): SupplierRequest {
  const lines = p.lines
    .filter((l) => l.supplierName === p.supplierName && l.basis !== "unknown_cn")
    .sort((a, b) => a.id - b.id);
  const needsInstallation = lines.some((l) => !l.installationId);
  const needsDirect = lines.some((l) => l.basis !== "actual");
  const needsIndirect = lines.some((l) => l.basis !== "actual" && l.sector && INDIRECT_SECTORS.has(l.sector));
  const importer = p.importerName?.trim() || "our company";
  const replyBy = replyByFor(p.dueDate);

  // Group by CN code and installation so the supplier sees each product once.
  const groups = new Map<string, { cn: string; installation: string | null; origin: string; mass: number; unit: string }>();
  for (const l of lines) {
    const key = `${l.cnCode}|${l.installationId ?? ""}|${l.originCountry}`;
    const g = groups.get(key) ?? { cn: l.cnCode, installation: l.installationId, origin: l.originCountry, mass: 0, unit: l.unit };
    g.mass += l.netMass;
    groups.set(key, g);
  }
  const goods = [...groups.values()].map(
    (g) => `- CN ${g.cn}, from ${g.origin}, ${fmt(g.mass)} ${g.unit}, installation: ${g.installation ?? "not known to us"}`,
  );

  const asks: string[] = [];
  if (needsInstallation) asks.push("The name, address and unique identifier of each installation that produced these goods.");
  if (needsDirect) asks.push("The specific direct embedded emissions of each good, in tCO2e per tonne, with the reporting period they cover.");
  if (needsIndirect) asks.push("The specific indirect embedded emissions (cement and fertilisers), in tCO2e per tonne, and the electricity emission factor you used.");
  asks.push("The monitoring method you used, and whether a verifier checked the values.");
  asks.push("Any carbon price you paid in the country of origin for these goods, if applicable.");

  const body = [
    `Dear ${p.contactName?.trim() || "Sir or Madam"},`,
    "",
    `${importer} imports the goods below from ${p.supplierName} into the EU (Cyprus). Under the EU Carbon Border Adjustment Mechanism, Regulation (EU) 2023/956, we must declare the embedded emissions of these goods for ${p.year}.`,
    "",
    `Goods imported in ${p.year}:`,
    ...goods,
    "",
    "Please send us this data:",
    ...asks.map((a, i) => `${i + 1}. ${a}`),
    "",
    "You can reply to this email with the values, or attach the European Commission's communication template for installation operators.",
    `Please reply by ${longDate(replyBy)}. Without your actual values, we must use the default values, which are usually higher.`,
    "",
    "Thank you,",
    importer,
  ].join("\n");

  return {
    subject: `CBAM emissions data needed for ${p.year}: ${p.supplierName}`.slice(0, 200),
    body,
    replyBy,
    lineIds: lines.map((l) => l.id),
  };
}

/** True when an earlier send is recent enough that Border should wait. */
export function sentRecently(lastSentAt: string | Date | null | undefined, now: Date): boolean {
  if (!lastSentAt) return false;
  const t = new Date(lastSentAt).getTime();
  return Number.isFinite(t) && now.getTime() - t < RESEND_AFTER_DAYS * 86_400_000;
}
