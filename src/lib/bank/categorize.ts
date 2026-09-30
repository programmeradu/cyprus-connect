/**
 * Sorts a bank payment into a spend category that matters for a footprint.
 *
 * Pure and deterministic: the same description always gets the same answer,
 * and the rule that matched is returned so a person can see why. Anything
 * not matched stays "other"; nothing is guessed. Only money going out
 * (debits) counts as spend.
 */

export type SpendCategory = "electricity" | "fuel" | "water" | "freight" | "other";

export const SPEND_CATEGORIES: Exclude<SpendCategory, "other">[] = ["electricity", "fuel", "water", "freight"];

interface Rule {
  category: Exclude<SpendCategory, "other">;
  /** Shown to the user as the reason. */
  label: string;
  pattern: RegExp;
}

// Short brand names need word boundaries so "EKO" does not match "EKONOMIST".
// \b does not work for Greek letters, so Greek rules use plain substrings.
const RULES: Rule[] = [
  { category: "electricity", label: "EAC", pattern: /\bEAC\b|ELECTRICITY AUTHORITY|\bA\.?H\.?K\b/ },
  { category: "electricity", label: "ΑΗΚ", pattern: /ΑΗΚ|ΑΡΧΗ ΗΛΕΚΤΡΙΣΜΟΥ/ },
  { category: "electricity", label: "Electricity supplier", pattern: /\bELECTRICITY\b|\bNRG\s?POWER\b|\bEXELIXIS\b/ },

  { category: "fuel", label: "Fuel station", pattern: /\bPETROLINA\b|\bEKO\b|\bESSO\b|\bSHELL\b|\bTOTAL(ENERGIES)?\b|\bSTAROIL\b|\bLUKOIL\b|\bAG PETROPOULOS\b|\bFILL\s?UP\b|\bCOSMO\s?OIL\b/ },
  { category: "fuel", label: "Fuel", pattern: /\bFUEL\b|\bPETROL\b|\bDIESEL\b|\bLPG\b|\bHEATING OIL\b/ },
  { category: "fuel", label: "Καύσιμα", pattern: /ΚΑΥΣΙΜ|ΠΕΤΡΕΛΑΙ|ΒΕΝΖΙΝ/ },

  { category: "water", label: "Water board", pattern: /WATER BOARD|\bWBL\b|\bWBN\b|\bWBF\b|\bWDD\b|\bEOA\b/ },
  { category: "water", label: "Υδατοπρομήθεια", pattern: /ΥΔΑΤΟΠΡΟΜΗΘ|ΣΥΜΒΟΥΛΙΟ ΥΔΑΤ|ΕΟΑ/ },

  { category: "freight", label: "Courier", pattern: /\bDHL\b|\bFEDEX\b|\bUPS\b|\bTNT\b|\bACS\b|\bAKIS EXPRESS\b|\bCYPRUS POST\b|\bGAP AKIS\b/ },
  { category: "freight", label: "Shipping line", pattern: /\bMAERSK\b|\bMSC\b|\bCMA CGM\b|\bHAPAG\b|\bCOSCO\b|\bGEODIS\b|\bKUEHNE\b|\bDSV\b/ },
  { category: "freight", label: "Freight", pattern: /\bFREIGHT\b|\bSHIPPING\b|\bCOURIER\b|\bHAULAGE\b|\bLOGISTICS\b/ },
  { category: "freight", label: "Μεταφορικά", pattern: /ΜΕΤΑΦΟΡΙΚ|ΝΑΥΛ/ },
];

/** Upper-case and strip Greek accents so "Αρχή" and "ΑΡΧΗ" match the same rule. */
export function normaliseDescription(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function categorise(
  description: string | null | undefined,
  direction: "debit" | "credit" | "unknown",
): { category: SpendCategory; rule: string | null } {
  if (direction !== "debit" || !description) return { category: "other", rule: null };
  const text = normaliseDescription(description);
  for (const r of RULES) {
    if (r.pattern.test(text)) return { category: r.category, rule: r.label };
  }
  return { category: "other", rule: null };
}

/** Bank of Cyprus sends dates as dd/mm/yyyy. Returns yyyy-mm-dd or null. */
export function parseBocDate(value: string | null | undefined): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((value ?? "").trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  if (d.getUTCFullYear() !== Number(yyyy) || d.getUTCMonth() !== Number(mm) - 1 || d.getUTCDate() !== Number(dd)) return null;
  return `${yyyy}-${mm}-${dd}`;
}

export function formatBocDate(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

export function directionOf(dcInd: unknown): "debit" | "credit" | "unknown" {
  const v = typeof dcInd === "string" ? dcInd.toUpperCase() : "";
  if (v === "DEBIT" || v === "D") return "debit";
  if (v === "CREDIT" || v === "C") return "credit";
  return "unknown";
}

/** Past the bank's consent end date (dd/mm/yyyy)? */
export function consentExpired(endDate: string | null | undefined, now = new Date()): boolean {
  const iso = parseBocDate(endDate);
  if (!iso) return false;
  return new Date(`${iso}T23:59:59Z`).getTime() < now.getTime();
}
