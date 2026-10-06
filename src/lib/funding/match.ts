/**
 * The funding fit check. Pure and deterministic: the same rules and the same
 * company facts always give the same verdict.
 *
 * - A rule the call does not state is skipped. It never counts as met.
 * - A rule the company cannot be checked against yet is "missing" and names
 *   the fact that would settle it.
 * - Shown only when nothing fails, the sector fits, at least MIN_MET rules are
 *   positively met and no more than MAX_MISSING facts are missing.
 */

import type { BusinessPicture, CallRules, FactKey, RuleCheck, Verdict } from "./rules";

export const EU27 = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT",
  "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
];
export const MIN_MET = 2;
export const MAX_MISSING = 2;

const COMPANY_TYPES = new Set(["company", "startup"]);

export interface FitResult {
  verdict: Verdict;
  met: RuleCheck[];
  missing: RuleCheck[];
  failed: RuleCheck[];
}

function quoteFor(rules: CallRules, rule: string): string | null {
  return rules.evidence.find((e) => e.rule === rule)?.quote?.slice(0, 300) ?? null;
}

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-GB")}`;

export function checkFit(rules: CallRules, biz: BusinessPicture): FitResult {
  const met: RuleCheck[] = [];
  const missing: RuleCheck[] = [];
  const failed: RuleCheck[] = [];
  const add = (list: RuleCheck[], rule: string, text: string, textEl: string, fact?: FactKey) =>
    list.push({ rule, text, textEl, quote: quoteFor(rules, rule), ...(fact ? { fact } : {}) });

  // Who may apply
  if (rules.applicantTypes && rules.applicantTypes.length) {
    if (rules.applicantTypes.some((t) => COMPANY_TYPES.has(t))) {
      add(met, "applicantTypes", "Companies can apply.", "Μπορούν να υποβάλουν αίτηση εταιρείες.");
    } else {
      add(failed, "applicantTypes", `Only for: ${rules.applicantTypes.join(", ")}.`, `Μόνο για: ${rules.applicantTypes.join(", ")}.`);
    }
  }

  // Consortium: a business cannot apply on its own
  if (rules.consortiumRequired === true) {
    add(failed, "consortiumRequired", "Needs a consortium of partners.", "Απαιτεί κοινοπραξία εταίρων.");
  }

  // Country
  if (rules.countries && rules.countries.length) {
    const list = rules.countries.map((c) => c.toUpperCase());
    if (!biz.country) {
      add(missing, "countries", "Country must be checked.", "Πρέπει να ελεγχθεί η χώρα.", "country");
    } else {
      const c = biz.country.toUpperCase();
      const ok = list.includes("ANY") || list.includes(c) || (list.includes("EU") && EU27.includes(c));
      if (ok) add(met, "countries", `Open to companies in ${c}.`, `Ανοιχτό σε εταιρείες στη χώρα ${c}.`);
      else add(failed, "countries", `Not open to ${c}.`, `Δεν είναι ανοιχτό για ${c}.`);
    }
  }

  // Size
  const sizeRule = rules.smeOnly === true || rules.minEmployees !== null || rules.maxEmployees !== null;
  if (sizeRule) {
    if (biz.employees === null) {
      add(missing, "employees", "Staff numbers must be checked.", "Πρέπει να ελεγχθεί ο αριθμός εργαζομένων.", "employees");
    } else {
      // A size band (e.g. 11-50) only settles a limit when the whole band is on one side of it.
      const lo = biz.employees;
      const hi = biz.employeesMax;
      const maxE = rules.smeOnly ? Math.min(rules.maxEmployees ?? 249, 249) : rules.maxEmployees;
      const minE = rules.minEmployees;
      const ask = () => add(missing, "employees", "Exact staff number needed: your size band spans the limit.", "Χρειάζεται ο ακριβής αριθμός εργαζομένων: το εύρος σας περιλαμβάνει το όριο.", "employees");
      if (maxE !== null && lo > maxE) add(failed, "employees", `For up to ${maxE} staff.`, `Για έως ${maxE} εργαζόμενους.`);
      else if (minE !== null && hi !== null && hi < minE) add(failed, "employees", `Needs at least ${minE} staff.`, `Απαιτεί τουλάχιστον ${minE} εργαζόμενους.`);
      else if ((maxE !== null && (hi === null || hi > maxE)) || (minE !== null && lo < minE)) ask();
      else add(met, "employees", rules.smeOnly ? "Staff numbers fit an SME." : "Staff numbers fit.", rules.smeOnly ? "Ο αριθμός εργαζομένων ταιριάζει σε ΜμΕ." : "Ο αριθμός εργαζομένων ταιριάζει.");
    }
  }

  // Revenue (SME ceiling is €50m turnover)
  const maxRev = rules.smeOnly ? Math.min(rules.maxRevenueEur ?? 50_000_000, 50_000_000) : rules.maxRevenueEur;
  if (maxRev !== null) {
    if (biz.revenueEur === null) {
      add(missing, "revenue", "Yearly revenue must be checked.", "Πρέπει να ελεγχθεί ο ετήσιος κύκλος εργασιών.", "revenue");
    } else if (biz.revenueEur > maxRev) {
      add(failed, "revenue", `For revenue up to ${eur(maxRev)}.`, `Για κύκλο εργασιών έως ${eur(maxRev)}.`);
    } else {
      add(met, "revenue", `Revenue is under ${eur(maxRev)}.`, `Ο κύκλος εργασιών είναι κάτω από ${eur(maxRev)}.`);
    }
  }

  // Company age
  if (rules.minCompanyAgeYears !== null || rules.maxCompanyAgeYears !== null) {
    if (biz.companyAgeYears === null) {
      add(missing, "companyAge", "Company age must be checked.", "Πρέπει να ελεγχθεί η ηλικία της εταιρείας.", "company_age");
    } else {
      const a = biz.companyAgeYears;
      if (rules.maxCompanyAgeYears !== null && a > rules.maxCompanyAgeYears) add(failed, "companyAge", `For companies up to ${rules.maxCompanyAgeYears} years old.`, `Για εταιρείες έως ${rules.maxCompanyAgeYears} ετών.`);
      else if (rules.minCompanyAgeYears !== null && a < rules.minCompanyAgeYears) add(failed, "companyAge", `Needs at least ${rules.minCompanyAgeYears} years of trading.`, `Απαιτεί τουλάχιστον ${rules.minCompanyAgeYears} χρόνια λειτουργίας.`);
      else add(met, "companyAge", "Company age fits.", "Η ηλικία της εταιρείας ταιριάζει.");
    }
  }

  // Sector
  const sectors = (rules.sectors ?? []).map((s) => s.toLowerCase());
  const openSector = sectors.length === 0 || sectors.includes("any");
  if (!openSector) {
    if (!biz.sector) add(missing, "sectors", "Industry must be checked.", "Πρέπει να ελεγχθεί ο κλάδος.", "sector");
    else if (sectors.includes(biz.sector)) add(met, "sectors", `Aimed at ${biz.sector}.`, `Απευθύνεται στον κλάδο ${biz.sector}.`);
    else add(failed, "sectors", `Aimed at ${sectors.join(", ")}.`, `Απευθύνεται σε: ${sectors.join(", ")}.`);
  }

  const specificRules = new Set(["sectors", "employees", "revenue", "companyAge"]);
  const hasSpecificMatch = met.some((m) => specificRules.has(m.rule));

  let verdict: Verdict = "hidden";
  if (failed.length === 0 && met.length >= MIN_MET && missing.length <= MAX_MISSING) {
    verdict = missing.length === 0 ? (hasSpecificMatch ? "strong" : "hidden") : "needs_info";
  }
  return { verdict, met, missing, failed };
}

/** Whole years between an ISO date and now; null when unreadable. */
export function yearsSince(iso: string | null | undefined, now = new Date()): number | null {
  if (!iso) return null;
  const m = iso.match(/(\d{4})-(\d{2})-(\d{2})|(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  const d = m[1] ? new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`) : new Date(`${m[6]}-${m[5]}-${m[4]}T00:00:00Z`);
  if (!Number.isFinite(d.getTime())) return null;
  return Math.floor((now.getTime() - d.getTime()) / (365.25 * 86_400_000));
}
