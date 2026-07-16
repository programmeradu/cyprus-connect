"use client";

/**
 * CSRD / VSME reporting timeline & applicability checker.
 * Inputs: EU-listed?, employees, turnover (€M), balance sheet (€M).
 * Determines which regime (CSRD wave 1-4 or VSME voluntary) applies + first reporting year.
 */

import { useMemo } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";


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
      "csrd-wave1": { label: "CSRD (Wave 1 - large PIEs)", desc: "You are already in scope. Reporting is annual under ESRS." },
      "csrd-wave2": { label: "CSRD (Wave 2 - large undertakings)", desc: "Full ESRS reporting required." },
      "csrd-wave3": { label: "CSRD (Wave 3 - listed SMEs)", desc: "Simplified LSME standard applies. Opt-out possible until 2028." },
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
      "csrd-wave1": { label: "CSRD (Κύμα 1 - μεγάλες PIEs)", desc: "Είστε ήδη εντός πεδίου. Ετήσια αναφορά κατά ESRS." },
      "csrd-wave2": { label: "CSRD (Κύμα 2 - μεγάλες οντότητες)", desc: "Πλήρης αναφορά ESRS απαιτείται." },
      "csrd-wave3": { label: "CSRD (Κύμα 3 - εισηγμένες ΜμΕ)", desc: "Ισχύει το απλοποιημένο LSME. Δυνατότητα opt-out έως το 2028." },
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
    return { regime: "vsme", firstReport: "-", covering: "voluntary" };
  }
  return { regime: "none", firstReport: "-", covering: "-" };
}




export default function CsrdVsmeChecker({ locale }: Props) {
  const l = t[locale];
  const [state, setState] = usePersistedState("verdeiq.calc.csrd", {
    listed: false,
    employees: 75,
    turnover: 12,
    balance: 6,
  });
  const { listed, employees, turnover, balance } = state;
  const setListed = (v: boolean) => setState((s) => ({ ...s, listed: v }));
  const setEmployees = (v: number) => setState((s) => ({ ...s, employees: v }));
  const setTurnover = (v: number) => setState((s) => ({ ...s, turnover: v }));
  const setBalance = (v: number) => setState((s) => ({ ...s, balance: v }));

  const result = useMemo(() => determine(listed, employees, turnover, balance), [listed, employees, turnover, balance]);
  const regimeInfo = l.regimes[result.regime];
  const inScope = result.regime !== "none";

  return (
    <div className="not-prose my-14 border-y border-foreground/15">
      <div className="border-b border-foreground/10 py-8 sm:py-10">
        <div className="flex items-baseline justify-between gap-6">
          <p className="eyebrow">
            {locale === "el" ? "Διαδραστικό εργαλείο" : "Interactive tool"}
          </p>
          <p className="tabular-nums text-[11px] text-foreground/40">02 / 03</p>
        </div>
        <h3 className="mt-3 max-w-3xl text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[32px]">
          {l.title}
        </h3>
        <p className="mt-3 max-w-2xl text-[14.5px] leading-[1.6] text-foreground/65 sm:text-[15.5px]">
          {l.subtitle}
        </p>
      </div>

      <div className="grid gap-10 py-8 sm:py-10 md:grid-cols-2 md:gap-14">
        <div className="space-y-6">
          <div>
            <label className="mb-3 block text-[13px] font-medium tracking-[-0.005em] text-foreground/80">{l.listed}</label>
            <div className="flex gap-0 border border-foreground/15">
              <button
                type="button"
                onClick={() => setListed(true)}
                className={`flex-1 px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] transition ${listed ? "bg-foreground text-background" : "text-foreground/60 hover:text-foreground"}`}
              >
                {l.yes}
              </button>
              <button
                type="button"
                onClick={() => setListed(false)}
                className={`flex-1 border-l border-foreground/15 px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] transition ${!listed ? "bg-foreground text-background" : "text-foreground/60 hover:text-foreground"}`}
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
              <div className="mb-2 flex items-baseline justify-between">
                <label className="text-[13px] font-medium tracking-[-0.005em] text-foreground/80">{f.label}</label>
                <span className="tabular-nums text-[13px] text-foreground/55">
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
                className="verdeiq-range"
              />
            </div>
          ))}
        </div>

        <div className="border-l border-foreground/10 pl-8 sm:pl-10">
          <p className="eyebrow">
            {l.result}
          </p>
          <p className={`mt-3 eyebrow ${inScope ? "text-foreground" : "text-foreground/45"}`}>
            {inScope ? (locale === "el" ? "Εντός πεδίου" : "In scope") : (locale === "el" ? "Εκτός πεδίου" : "Out of scope")}
          </p>
          <p className="mt-3 text-[22px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[26px]">
            {regimeInfo.label}
          </p>
          <p className="mt-3 max-w-md text-[14px] leading-[1.6] text-foreground/70">{regimeInfo.desc}</p>

          {result.firstReport !== "-" && (
            <dl className="mt-6 grid grid-cols-2 gap-6 border-t border-foreground/10 pt-5">
              <div>
                <dt className="eyebrow">{l.firstReport}</dt>
                <dd className="mt-2 text-[24px] font-semibold tabular-nums tracking-[-0.02em]">{result.firstReport}</dd>
              </div>
              <div>
                <dt className="eyebrow">{l.covering}</dt>
                <dd className="mt-2 text-[24px] font-semibold tracking-[-0.02em]">{result.covering}</dd>
              </div>
            </dl>
          )}
          <p className="mt-8 border-t border-foreground/10 pt-5 text-[11.5px] leading-[1.6] text-foreground/50">
            {l.note}
          </p>
        </div>
      </div>
    </div>
  );
}
