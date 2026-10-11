/**
 * Lender pack.
 *
 * A plain ESG summary any bank can read when it asks a borrower about energy,
 * emissions and water. Every answer comes from records in the workspace.
 * When a record is missing the answer stays blank and is listed as a gap.
 *
 * We do not name a bank, quote a bank framework or promise a rate. No Cypriot
 * bank publishes a borrower ESG template or a green-margin schedule we can cite.
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workspaces, actionProjects, metricReadings } from "@/db/schema";
import { readCompanyProfile, withCompanyFacts } from "@/lib/company.server";
import { eacBills } from "@/lib/integrations/eac.server";
import { waterBills } from "@/lib/integrations/water.server";
import { OFFICIAL_CYPRUS_GRID_FACTOR } from "@/lib/factors/registry";
import { fingerprint } from "@/lib/pdf/kit/fingerprint";
import type { LenderAnswer, LenderPackData } from "./types";
export type { LenderAnswer, LenderPackData };

/** Distinct calendar months covered by a set of bills. */
export function monthsCovered(bills: { periodStart?: string | Date | null; periodEnd?: string | Date | null; date?: string | Date | null }[]): number {
  const months = new Set<string>();
  for (const b of bills) {
    const raw = b.periodEnd ?? b.date ?? b.periodStart;
    if (!raw) continue;
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) months.add(`${d.getUTCFullYear()}-${d.getUTCMonth()}`);
  }
  return months.size;
}

export async function loadLenderPack(workspaceId: string): Promise<LenderPackData | null> {
  const [rawWs] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  if (!rawWs) return null;

  const owner = rawWs.ownerUserId;
  const profile = owner ? await readCompanyProfile(owner) : null;
  const ws = withCompanyFacts(rawWs, profile);

  const [eacRows, waterRows, confirmed, readings] = await Promise.all([
    owner ? eacBills(owner).catch(() => []) : [],
    owner ? waterBills(owner).catch(() => []) : [],
    db
      .select({ type: actionProjects.type })
      .from(actionProjects)
      .where(and(eq(actionProjects.workspaceId, ws.id), eq(actionProjects.stage, "confirmed")))
      .catch(() => []),
    db
      .select({ metricKey: metricReadings.metricKey, value: metricReadings.value })
      .from(metricReadings)
      .where(eq(metricReadings.workspaceId, ws.id))
      .orderBy(desc(metricReadings.createdAt))
      .limit(50)
      .catch(() => []),
  ]);

  const kwh = eacRows.reduce((s, b) => s + (b.kwh || 0), 0);
  const waterM3 = waterRows.reduce((s, b) => s + (b.m3 || 0), 0);
  const fuel = readings.find((r) => r.metricKey === "scope1_fuel" || r.metricKey === "fuel_diesel");
  const electricityMonths = monthsCovered(eacRows as never);
  const waterMonths = monthsCovered(waterRows as never);
  const confirmedTypes = [...new Set(confirmed.map((c) => c.type))];

  const answers: LenderAnswer[] = [
    {
      id: "electricity",
      topic: "E",
      questionEn: "Grid electricity used",
      questionEl: "Ηλεκτρισμός από το δίκτυο",
      value: eacRows.length ? Math.round(kwh) : null,
      unit: "kWh",
      sourceEn: eacRows.length ? `${eacRows.length} EAC bills, ${electricityMonths} months covered` : "No EAC bills added yet",
      sourceEl: eacRows.length ? `${eacRows.length} λογαριασμοί ΑΗΚ, ${electricityMonths} μήνες` : "Δεν έχουν προστεθεί λογαριασμοί ΑΗΚ",
      fromRecords: eacRows.length > 0,
    },
    {
      id: "scope2",
      topic: "E",
      questionEn: "Scope 2 emissions (location-based)",
      questionEl: "Εκπομπές Scope 2 (βάσει τοποθεσίας)",
      value: eacRows.length ? Number(((kwh * OFFICIAL_CYPRUS_GRID_FACTOR) / 1000).toFixed(2)) : null,
      unit: "t CO₂e",
      sourceEn: `Electricity × Cyprus grid factor ${OFFICIAL_CYPRUS_GRID_FACTOR} kg CO₂e/kWh`,
      sourceEl: `Ηλεκτρισμός × συντελεστής δικτύου Κύπρου ${OFFICIAL_CYPRUS_GRID_FACTOR} kg CO₂e/kWh`,
      fromRecords: eacRows.length > 0,
    },
    {
      id: "scope1",
      topic: "E",
      questionEn: "Scope 1 emissions (fuel burned)",
      questionEl: "Εκπομπές Scope 1 (καύσιμα)",
      value: fuel ? Number(fuel.value.toFixed(2)) : null,
      unit: "t CO₂e",
      sourceEn: fuel ? "Fuel receipts added in Add data" : "No fuel records added yet",
      sourceEl: fuel ? "Αποδείξεις καυσίμων από την Προσθήκη δεδομένων" : "Δεν έχουν προστεθεί καύσιμα",
      fromRecords: !!fuel,
    },
    {
      id: "water",
      topic: "E",
      questionEn: "Mains water used",
      questionEl: "Νερό από το δίκτυο",
      value: waterRows.length ? Number(waterM3.toFixed(1)) : null,
      unit: "m³",
      sourceEn: waterRows.length ? `${waterRows.length} water board bills, ${waterMonths} months covered` : "No water bills added yet",
      sourceEl: waterRows.length ? `${waterRows.length} λογαριασμοί νερού, ${waterMonths} μήνες` : "Δεν έχουν προστεθεί λογαριασμοί νερού",
      fromRecords: waterRows.length > 0,
    },
    {
      id: "projects",
      topic: "E",
      questionEn: "Energy projects finished and checked",
      questionEl: "Ενεργειακά έργα που ολοκληρώθηκαν και ελέγχθηκαν",
      value: confirmed.length ? confirmed.length : null,
      unit: confirmed.length ? `(${confirmedTypes.join(", ")})` : undefined,
      sourceEn: confirmed.length ? "Confirmed in the Action plan with bills or invoices" : "None confirmed in the Action plan yet",
      sourceEl: confirmed.length ? "Επιβεβαιωμένα στο Σχέδιο δράσης με λογαριασμούς ή τιμολόγια" : "Κανένα επιβεβαιωμένο ακόμα",
      fromRecords: confirmed.length > 0,
    },
    {
      id: "employees",
      topic: "S",
      questionEn: "Number of employees",
      questionEl: "Αριθμός εργαζομένων",
      value: ws.employees > 0 ? ws.employees : null,
      sourceEn: "Company details (your statement)",
      sourceEl: "Στοιχεία εταιρείας (δική σας δήλωση)",
      fromRecords: false,
    },
  ];

  const hash = await fingerprint({
    company: ws.legalName || ws.name,
    answers: answers.map((a) => [a.id, a.value]),
  });

  return {
    company: {
      name: ws.name,
      legalName: ws.legalName,
      registrationNo: ws.registrationNo,
      sector: ws.sector,
      employees: ws.employees,
    },
    coverage: { electricityMonths, waterMonths },
    answers,
    hash,
    generatedAt: new Date().toISOString(),
  };
}
