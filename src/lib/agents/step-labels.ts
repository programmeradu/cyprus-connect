/**
 * Plain-language labels for the step ledger. Pure functions, no database, so
 * the console and the tests describe agent steps the same way.
 */

export type StepDecision = "executed" | "queued_for_approval" | "blocked" | "failed";
export type Tone = "good" | "warn" | "bad" | "idle" | "live";

const TOOL_LABELS: Record<string, { verb: string; kind: "read" | "write" | "outward" | "legal" }> = {
  read_metrics: { verb: "Read the metric history", kind: "read" },
  read_obligations: { verb: "Read open obligations", kind: "read" },
  read_cbam_imports: { verb: "Read CBAM import lines", kind: "read" },
  create_task: { verb: "Added a task to your review queue", kind: "write" },
  record_fact: { verb: "Recorded a fact with its source", kind: "write" },
  save_cbam_draft: { verb: "Saved the CBAM declaration draft", kind: "write" },
  sign_cbam_declaration: { verb: "Signature of the CBAM declaration", kind: "legal" },
  read_cbam_suppliers: { verb: "Read supplier contacts and past requests", kind: "read" },
  withdraw_approval_request: { verb: "Withdrew an out-of-date request", kind: "write" },
  close_evidence_task: { verb: "Closed an evidence request that is now covered", kind: "write" },
  send_supplier_request: { verb: "Email to a supplier asking for CBAM data", kind: "outward" },
  read_company_profile: { verb: "Read the company record", kind: "read" },
  search_company_registry: { verb: "Searched the Cyprus Registrar of Companies", kind: "read" },
  lookup_company_registry: { verb: "Read a Registrar of Companies entry", kind: "read" },
  find_wikirate_company: { verb: "Looked up a company on WikiRate", kind: "read" },
  read_wikirate_figures: { verb: "Read a company's published figures on WikiRate", kind: "read" },
  compare_with_peers: { verb: "Compared emissions per employee with published peers", kind: "read" },
  read_cyprus_context: { verb: "Read national context (Climate TRACE, CyStat)", kind: "read" },
  read_utility_bills: { verb: "Read electricity and water bills", kind: "read" },
  read_bank_spend: { verb: "Read bank spend by category", kind: "read" },
  read_workspace_facts: { verb: "Read facts other agents recorded", kind: "read" },
};

export const RISK_LABELS = ["Read only", "Internal write", "Outward action", "Legal or financial"] as const;

export type LabelLocale = "en" | "el";

const EL_VERBS: Record<string, string> = {
  read_metrics: "Διάβασε το ιστορικό δεικτών",
  read_obligations: "Διάβασε τις ανοιχτές υποχρεώσεις",
  read_cbam_imports: "Διάβασε τις γραμμές εισαγωγών CBAM",
  create_task: "Πρόσθεσε εργασία στην ουρά ελέγχου σας",
  record_fact: "Κατέγραψε στοιχείο μαζί με την πηγή του",
  save_cbam_draft: "Αποθήκευσε το σχέδιο δήλωσης CBAM",
  sign_cbam_declaration: "Υπογραφή της δήλωσης CBAM",
  read_cbam_suppliers: "Διάβασε επαφές προμηθευτών και προηγούμενα αιτήματα",
  withdraw_approval_request: "Απέσυρε ένα παρωχημένο αίτημα",
  close_evidence_task: "Έκλεισε αίτημα τεκμηρίωσης που πλέον καλύπτεται",
  send_supplier_request: "Email σε προμηθευτή για δεδομένα CBAM",
  read_company_profile: "Διάβασε τα στοιχεία της εταιρείας",
  search_company_registry: "Αναζήτησε στο Μητρώο Εταιρειών Κύπρου",
  lookup_company_registry: "Διάβασε εγγραφή του Μητρώου Εταιρειών",
  find_wikirate_company: "Αναζήτησε εταιρεία στο WikiRate",
  read_wikirate_figures: "Διάβασε δημοσιευμένα στοιχεία εταιρείας στο WikiRate",
  compare_with_peers: "Σύγκρινε εκπομπές ανά εργαζόμενο με δημοσιευμένες εταιρείες",
  read_cyprus_context: "Διάβασε εθνικό πλαίσιο (Climate TRACE, CyStat)",
  read_utility_bills: "Διάβασε λογαριασμούς ρεύματος και νερού",
  read_bank_spend: "Διάβασε τραπεζικές δαπάνες ανά κατηγορία",
  read_workspace_facts: "Διάβασε στοιχεία που κατέγραψαν άλλοι πράκτορες",
};
const EL_RISK = ["Μόνο ανάγνωση", "Εσωτερική εγγραφή", "Ενέργεια προς τα έξω", "Νομική ή οικονομική"] as const;
const EL_DECISION: Record<string, string> = {
  executed: "Ολοκληρώθηκε",
  queued_for_approval: "Περιμένει εσάς",
  blocked: "Μπλοκαρίστηκε από πολιτική",
  failed: "Απέτυχε",
};
const EL_STATUS: Record<string, string> = { succeeded: "Ολοκληρώθηκε", running: "Σε εξέλιξη", failed: "Απέτυχε" };
const EL_TRIGGER: Record<string, string> = {
  cron: "Προγραμματισμένη",
  manual: "Ξεκίνησε από άνθρωπο",
  event: "Από συμβάν",
  approval: "Μετά από έγκριση",
};

export function toolLabel(tool: string, locale: LabelLocale = "en"): { verb: string; kind: string } {
  const base = toolLabel_(tool);
  return locale === "el" && EL_VERBS[tool] ? { ...base, verb: EL_VERBS[tool] } : base;
}

function toolLabel_(tool: string): { verb: string; kind: string } {
  return TOOL_LABELS[tool] ?? { verb: tool.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()), kind: "other" };
}

export function riskLabel(level: number, locale: LabelLocale = "en"): string {
  if (locale === "el") return EL_RISK[level] ?? `Επίπεδο κινδύνου ${level}`;
  return RISK_LABELS[level] ?? `Risk level ${level}`;
}

export function decisionLabel(decision: string, locale: LabelLocale = "en"): { label: string; tone: Tone } {
  const r = decisionLabel_(decision);
  return locale === "el" && EL_DECISION[decision] ? { ...r, label: EL_DECISION[decision] } : r;
}

function decisionLabel_(decision: string): { label: string; tone: Tone } {
  switch (decision) {
    case "executed":
      return { label: "Done", tone: "good" };
    case "queued_for_approval":
      return { label: "Waiting for you", tone: "live" };
    case "blocked":
      return { label: "Blocked by policy", tone: "warn" };
    case "failed":
      return { label: "Failed", tone: "bad" };
    default:
      return { label: decision, tone: "idle" };
  }
}

export function runStatusLabel(
  status: string,
  locale: LabelLocale = "en",
  failedSteps = 0,
): { label: string; tone: Tone } {
  if (failedSteps > 0 && (status === "succeeded" || status === "finished")) {
    return {
      label: locale === "el" ? "Ολοκληρώθηκε με σφάλματα" : "Finished with errors",
      tone: "warn",
    };
  }
  const r = runStatusLabel_(status);
  return locale === "el" && EL_STATUS[status] ? { ...r, label: EL_STATUS[status] } : r;
}

function runStatusLabel_(status: string): { label: string; tone: Tone } {
  switch (status) {
    case "succeeded":
      return { label: "Finished", tone: "good" };
    case "running":
      return { label: "Running", tone: "live" };
    case "failed":
      return { label: "Failed", tone: "bad" };
    default:
      return { label: status.replace(/_/g, " "), tone: "idle" };
  }
}

export function triggerLabel(trigger: string, locale: LabelLocale = "en"): string {
  if (locale === "el" && EL_TRIGGER[trigger]) return EL_TRIGGER[trigger];
  if (trigger === "cron") return "Scheduled";
  if (trigger === "manual") return "Started by a person";
  if (trigger === "event") return "Triggered by an event";
  if (trigger === "approval") return "Run after approval";
  return trigger;
}

/**
 * One short sentence about what a step returned. Never throws on odd JSON;
 * the ledger stores text that may be truncated at 8000 characters.
 */
export function summarizeOutput(decision: string, output: string | null, locale: LabelLocale = "en"): string | null {
  const el = locale === "el";
  if (!output) return null;
  let v: unknown;
  try {
    v = JSON.parse(output);
  } catch {
    return output.length > 140 ? `${output.slice(0, 137)}…` : output;
  }
  if (decision === "queued_for_approval" && v && typeof v === "object" && "taskId" in v) {
    const o = v as { taskId: unknown; reused?: unknown };
    if (el) return o.reused ? `Το ίδιο αίτημα περιμένει ήδη ως εργασία #${o.taskId}.` : `Άνοιξε εργασία έγκρισης #${o.taskId}.`;
    return o.reused ? `Same request already waiting as task #${o.taskId}.` : `Opened approval task #${o.taskId}.`;
  }
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    if ("taskId" in o && "created" in o) {
      if (el) return o.created ? `Άνοιξε εργασία #${o.taskId}.` : `Η εργασία #${o.taskId} ήταν ήδη ανοιχτή και διατηρήθηκε χωρίς διπλότυπο.`;
      return o.created ? `Opened task #${o.taskId}.` : `Task #${o.taskId} was already open, so it was kept, not duplicated.`;
    }
    if (typeof o.error === "string") return o.error;
    if (typeof o.reason === "string") return o.reason;
  }
  if (Array.isArray(v) && el) return v.length === 1 ? "Επιστράφηκε 1 στοιχείο." : `Επιστράφηκαν ${v.length} στοιχεία.`;
  if (Array.isArray(v)) return v.length === 1 ? "1 item returned." : `${v.length} items returned.`;
  if (v && typeof v === "object") {
    const keys = Object.keys(v as object);
    if (!keys.length) return el ? "Κανένα αποτέλεσμα." : "No result.";
    const parts = keys.slice(0, 3).map((k) => {
      const val = (v as Record<string, unknown>)[k];
      const shown = typeof val === "string" || typeof val === "number" || typeof val === "boolean" ? String(val) : Array.isArray(val) ? `${val.length} items` : "…";
      return `${k.replace(/_/g, " ")}: ${shown.length > 40 ? `${shown.slice(0, 37)}…` : shown}`;
    });
    return parts.join(" · ") + (keys.length > 3 ? " · …" : "");
  }
  return String(v);
}
