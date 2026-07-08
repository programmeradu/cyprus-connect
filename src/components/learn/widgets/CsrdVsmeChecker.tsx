"use client";

/**
 * CSRD / VSME reporting timeline & applicability checker.
 * Inputs: EU-listed?, employees, turnover (€M), balance sheet (€M).
 * Determines which regime (CSRD wave 1-4 or VSME voluntary) applies + first reporting year.
 */

import { useMemo, useState } from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

type Props = { locale: "en" | "el" };

const t = {
  en: {
    title: "CSRD & VSME applicability checker",
    subtitle: "Answer four questions to see which sustainability reporting regime applies to your company and when it kicks in.",
    listed: "EU-listed on a regulated market?",
    yes: "Yes",
    no: "No",
    employees: "Employees",
    turnover: "Net turnover (€M)",
    balance: "Balance sheet total (€M)",
    result: "Result",
    regime: "Regime",
    firstReport: "First report",
    covering: "Covering financial year",
    note: "Applicability is our best estimate based on published EU thresholds; consult your auditor for a formal determination.",
    regimes: {
      "csrd-wave1": { label: "CSRD (Wave 1 — large PIEs)", desc: "You are already in scope. Reporting is annual under ESRS." },
      "csrd-wave2": { label: "CSRD (Wave 2 — large undertakings)", desc: "Full ESRS reporting required." },
      "csrd-wave3": { label: "CSRD (Wave 3 — listed SMEs)", desc: "Simplified LSME standard applies. Opt-out possible until 2028." },
      "vsme": { label: "VSME (voluntary standard for SMEs)", desc: "Not in scope of CSRD, but VSME is the recommended framework for value-chain requests." },
      "none": { label: "No mandatory EU sustainability reporting", desc: "Your size falls below all thresholds. VSME Basic module is still recommended for supplier/finance requests." },
    },
  },
  el: {
    title: "Έλεγχος εφαρμογής CSRD & VSME",
    subtitle: "Απαντήστε σε τέσσερις ερωτήσεις για να δείτε ποιο καθεστώς αναφοράς βιωσιμότητας ισχύει για την εταιρεία σας και πότε ξεκινά.",
    listed: "Εισηγμένη σε ρυθμιζόμενη αγορά ΕΕ;",
    yes: "Ναι",
    no: "Όχι",
    employees: "Εργαζόμενοι",
    turnover: "Καθαρός κύκλος εργασιών (€M)",
    balance: "Σύνολο ισολογισμού (€M)",
    result: "Αποτέλεσμα",
    regime: "Καθεστώς",
    firstReport: "Πρώτη αναφορά",
    covering: "Καλύπτει χρήση",
    note: "Η εφαρμογή είναι εκτίμηση βάσει των δημοσιευμένων ορίων της ΕΕ· συμβουλευτείτε τον ελεγκτή σας.",
    regimes: {
      "csrd-wave1": { label: "CSRD (Κύμα 1 — μεγάλες PIEs)", desc: "Είστε ήδη εντός πεδίου. Ετήσια αναφορά κατά ESRS." },
      "csrd-wave2": { label: "CSRD (Κύμα 2 — μεγάλες οντότητες)", desc: "Πλήρης αναφορά ESRS απαιτείται." },
      "csrd-wave3": { label: "CSRD (Κύμα 3 — εισηγμένες ΜμΕ)", desc: "Ισχύει το απλοποιημένο LSME. Δυνατότητα opt-out έως το 2028." },
      "vsme": { label: "VSME (εθελοντικό πρότυπο για ΜμΕ)", desc: "Εκτός CSRD, αλλά το VSME είναι το προτεινόμενο πλαίσιο για αιτήματα από την αλυσίδα αξίας." },
      "none": { label: "Καμία υποχρεωτική αναφορά βιωσιμότητας ΕΕ", desc: "Το μέγεθος είναι κάτω από όλα τα όρια. Το VSME Basic συνιστάται για αιτήματα προμηθευτών/χρηματοδοτών." },
    },
  },
} as const;

function determine(listed: boolean, employees: number, turnover: number, balance: number): {
  regime: keyof typeof t.en.regimes;
  firstReport: string;
  covering: string;
} {
  const isLarge =
    [employees > 250, turnover > 50, balance > 25].filter(Boolean).length >= 2;
  const isMedium =
    [employees > 50, turnover > 10, balance > 5].filter(Boolean).length >= 2;
  const isMicro = employees <= 10 && turnover <= 2 && balance <= 2;

  if (listed && isLarge && employees > 500) {
    return { regime: "csrd-wave1", firstReport: "2025", covering: "FY 2024" };
  }
  if (isLarge) {
    return { regime: "csrd-wave2", firstReport: "2028", covering: "FY 2027" };
  }
  if (listed && isMedium) {
    return { regime: "csrd-wave3", firstReport: "2029", covering: "FY 2028" };
  }
  if (isMedium || (!isMicro && employees > 10)) {
    return { regime: "vsme", firstReport: "—", covering: "voluntary" };
  }
  return { regime: "none", firstReport: "—", covering: "—" };
}

export default function CsrdVsmeChecker({ locale }: Props) {
  const l = t[locale];
  const [listed, setListed] = useState(false);
  const [employees, setEmployees] = useState(75);
  const [turnover, setTurnover] = useState(12);
  const [balance, setBalance] = useState(6);

  const result = useMemo(() => determine(listed, employees, turnover, balance), [listed, employees, turnover, balance]);
  const regimeInfo = l.regimes[result.regime];
  const inScope = result.regime !== "none";

  return (
    <div className="not-prose my-12 overflow-hidden rounded-3xl border bg-card shadow-sm">
      <div className="border-b bg-gradient-to-br from-primary/10 to-transparent p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
          {locale === "el" ? "Διαδραστικό εργαλείο" : "Interactive tool"}
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{l.title}</h3>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{l.subtitle}</p>
      </div>

      <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-2">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">{l.listed}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setListed(true)}
                className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition ${listed ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50"}`}
              >
                {l.yes}
              </button>
              <button
                type="button"
                onClick={() => setListed(false)}
                className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition ${!listed ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50"}`}
              >
                {l.no}
              </button>
            </div>
          </div>

          {[
            { label: l.employees, value: employees, set: setEmployees, min: 1, max: 1000, step: 1, suffix: "" },
            { label: l.turnover, value: turnover, set: setTurnover, min: 0, max: 200, step: 0.5, suffix: "M€" },
            { label: l.balance, value: balance, set: setBalance, min: 0, max: 200, step: 0.5, suffix: "M€" },
          ].map((f) => (
            <div key={f.label}>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">{f.label}</label>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {f.value}
                  {f.suffix}
                </span>
              </div>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={f.value}
                onChange={(e) => f.set(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-center rounded-2xl border bg-background p-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {l.result}
          </p>
          <div className="mt-3 flex items-start gap-3">
            {inScope ? (
              <CheckCircle2 className="mt-0.5 h-6 w-6 flex-none text-primary" />
            ) : (
              <AlertCircle className="mt-0.5 h-6 w-6 flex-none text-muted-foreground" />
            )}
            <div>
              <p className="text-lg font-semibold leading-snug">{regimeInfo.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{regimeInfo.desc}</p>
            </div>
          </div>
          {result.firstReport !== "—" && (
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t pt-5 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">{l.firstReport}</dt>
                <dd className="mt-1 text-base font-semibold tabular-nums">{result.firstReport}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">{l.covering}</dt>
                <dd className="mt-1 text-base font-semibold">{result.covering}</dd>
              </div>
            </dl>
          )}
          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-none" />
            {l.note}
          </p>
        </div>
      </div>
    </div>
  );
}
