"use client";

/**
 * VerdeIQ SBTi Target Setter — bilingual guided form producing an
 * SBTi Near-Term Target draft, exportable as PDF (window.print), JSON, CSV.
 *
 * Method: SBTi Corporate Net-Zero Standard v1.2 + Near-Term Criteria v5.1.
 * See src/data/tools/sbti-pathways.ts for the linear-contraction math.
 */

import { useMemo, useState } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import type { Locale } from "@/data/tools";
import {
  computePathway,
  formatPct,
  formatTonnes,
  SBTI_ANNUAL_LINEAR_RATE,
  SBTI_MAX_HORIZON,
  SBTI_MIN_HORIZON,
  SBTI_NET_ZERO_YEAR,
  SBTI_SCOPE3_THRESHOLD,
  type AmbitionKey,
} from "@/data/tools/sbti-pathways";

type Inputs = {
  company: string;
  sector: string;
  baseYear: number;
  targetYear: number;
  scope1: string;
  scope2: string;
  scope3: string;
  scope12Ambition: AmbitionKey;
  scope3Ambition: AmbitionKey;
};

const DEFAULT_INPUTS: Inputs = {
  company: "",
  sector: "",
  baseYear: 2024,
  targetYear: 2030,
  scope1: "",
  scope2: "",
  scope3: "",
  scope12Ambition: "1.5C",
  scope3Ambition: "WB2C",
};

const T = {
  en: {
    interactive: "Interactive tool",
    progress: "Progress",
    of: "of",
    step: "Step",
    prev: "Previous",
    next: "Next",
    print: "Save as PDF",
    csv: "Download CSV",
    json: "Download JSON",
    reset: "Reset",
    steps: [
      "Company",
      "Base emissions",
      "Ambition",
      "Results",
    ],
    // Step 1
    s1Title: "Company profile",
    s1Body: "The base year fixes the reference against which reductions are measured. SBTi requires the base year to be no more than two years before submission.",
    company: "Company name",
    sector: "Sector or activity",
    baseYear: "Base year",
    // Step 2
    s2Title: "Base-year emissions",
    s2Body: "Enter your inventoried Scope 1, 2 and 3 emissions for the base year, in tonnes of CO₂-equivalent (t CO₂e). Location-based Scope 2 is the SBTi default.",
    scope1: "Scope 1 — direct",
    scope2: "Scope 2 — purchased energy (location-based)",
    scope3: "Scope 3 — value chain",
    tCO2e: "t CO₂e",
    // Step 3
    s3Title: "Ambition & target year",
    s3Body: "SBTi near-term targets cover 5–10 years from the base year. A Scope 3 target becomes mandatory when Scope 3 exceeds 40% of your total inventory.",
    targetYear: "Target year",
    scope12Ambition: "Scope 1 & 2 ambition",
    scope3Ambition: "Scope 3 ambition",
    "amb-1.5C": "1.5°C aligned",
    "amb-1.5C-desc": "4.2% linear reduction / yr",
    "amb-WB2C": "Well-below 2°C",
    "amb-WB2C-desc": "2.5% linear reduction / yr",
    // Step 4
    s4Title: "Your draft SBTi near-term target",
    s4Body: "Below is a draft target statement following SBTi Corporate Net-Zero Standard v1.2. Review with a qualified sustainability lead before submitting for validation.",
    baselineHeading: "Baseline",
    targetHeading: "Near-term target",
    netZeroHeading: "Long-term net-zero",
    statementHeading: "Draft target statement",
    kBaseYear: "Base year",
    kHorizon: "Horizon",
    years: "years",
    kScope12: "Scope 1 & 2",
    kScope3: "Scope 3",
    kTotal: "Total",
    kShareScope3: "Scope 3 share",
    kScope3Required: "Scope 3 target required",
    yes: "Yes",
    no: "No",
    reductionBy: "reduction by",
    residualBy: "residual by",
    warnHorizonShort: `Horizon shorter than ${SBTI_MIN_HORIZON} years — SBTi near-term targets require a minimum horizon of ${SBTI_MIN_HORIZON} years.`,
    warnHorizonLong: `Horizon longer than ${SBTI_MAX_HORIZON} years — SBTi near-term targets have a maximum horizon of ${SBTI_MAX_HORIZON} years.`,
    warnScope3: `Scope 3 exceeds ${Math.round(SBTI_SCOPE3_THRESHOLD * 100)}% of your inventory — a Scope 3 target is mandatory (criterion C15).`,
    warnNoBase: "Enter base-year emissions above zero to produce a target.",
    statementTemplate: (o: {
      company: string; sector: string; base: string; target: string;
      pctS12: string; pctS3: string; baseYear: string; targetYear: string;
      s12BaseT: string; s3BaseT: string; nzYear: string; nzPct: string;
    }) =>
      `${o.company || "Our company"}${o.sector ? ` (${o.sector})` : ""} commits to reduce absolute Scope 1 & 2 GHG emissions ${o.pctS12} by ${o.targetYear} from a ${o.baseYear} base year (from ${o.s12BaseT} to ${o.base} t CO₂e). ${o.company || "Our company"} also commits to reduce absolute Scope 3 GHG emissions ${o.pctS3} within the same timeframe (from ${o.s3BaseT} to ${o.target} t CO₂e). Long-term, ${o.company || "our company"} commits to reach net-zero emissions across the value chain by ${o.nzYear}, with a ${o.nzPct} absolute reduction against the ${o.baseYear} base year.`,
    disclaimer: "This tool produces a working draft. Submitting a target to SBTi requires validation against the current Corporate Net-Zero Standard and, for most companies, a fee-based review.",
    sourcesNote: "SBTi Corporate Net-Zero Standard v1.2 · Near-Term Criteria v5.1 · linear absolute contraction",
    reportTitle: "SBTi near-term target draft",
    generatedOn: "Generated on",
    trajectoryHeading: "Annual pathway (linear absolute contraction)",
    year: "Year",
  },
  el: {
    interactive: "Διαδραστικό εργαλείο",
    progress: "Πρόοδος",
    of: "από",
    step: "Βήμα",
    prev: "Προηγούμενο",
    next: "Επόμενο",
    print: "Αποθήκευση PDF",
    csv: "Λήψη CSV",
    json: "Λήψη JSON",
    reset: "Επαναφορά",
    steps: ["Εταιρεία", "Εκπομπές βάσης", "Φιλοδοξία", "Αποτελέσματα"],
    s1Title: "Προφίλ εταιρείας",
    s1Body: "Το έτος βάσης είναι η αναφορά για τη μέτρηση μειώσεων. Το SBTi απαιτεί το έτος βάσης να μην απέχει πάνω από 2 έτη πριν την υποβολή.",
    company: "Επωνυμία εταιρείας",
    sector: "Κλάδος ή δραστηριότητα",
    baseYear: "Έτος βάσης",
    s2Title: "Εκπομπές έτους βάσης",
    s2Body: "Καταχωρίστε Scope 1, 2 και 3 του έτους βάσης σε τόνους CO₂e. Το Scope 2 δηλώνεται προεπιλεγμένα με τη μέθοδο θέσης (location-based).",
    scope1: "Scope 1 — άμεσες",
    scope2: "Scope 2 — αγορασμένη ενέργεια (location-based)",
    scope3: "Scope 3 — αλυσίδα αξίας",
    tCO2e: "t CO₂e",
    s3Title: "Φιλοδοξία & έτος στόχος",
    s3Body: "Οι βραχυπρόθεσμοι στόχοι SBTi καλύπτουν 5–10 έτη από τη βάση. Στόχος Scope 3 απαιτείται όταν το Scope 3 ξεπερνά το 40% του συνόλου.",
    targetYear: "Έτος στόχος",
    scope12Ambition: "Φιλοδοξία Scope 1 & 2",
    scope3Ambition: "Φιλοδοξία Scope 3",
    "amb-1.5C": "Ευθυγράμμιση 1,5°C",
    "amb-1.5C-desc": "4,2% γραμμική μείωση / έτος",
    "amb-WB2C": "Πολύ κάτω των 2°C",
    "amb-WB2C-desc": "2,5% γραμμική μείωση / έτος",
    s4Title: "Προσχέδιο βραχυπρόθεσμου στόχου SBTi",
    s4Body: "Ακολουθεί προσχέδιο δήλωσης στόχου βάσει SBTi Corporate Net-Zero Standard v1.2. Ελέγξτε με ειδικευμένο υπεύθυνο βιωσιμότητας πριν την υποβολή.",
    baselineHeading: "Βάση",
    targetHeading: "Βραχυπρόθεσμος στόχος",
    netZeroHeading: "Μακροπρόθεσμο net-zero",
    statementHeading: "Προσχέδιο δήλωσης στόχου",
    kBaseYear: "Έτος βάσης",
    kHorizon: "Ορίζοντας",
    years: "έτη",
    kScope12: "Scope 1 & 2",
    kScope3: "Scope 3",
    kTotal: "Σύνολο",
    kShareScope3: "Μερίδιο Scope 3",
    kScope3Required: "Απαιτείται στόχος Scope 3",
    yes: "Ναι",
    no: "Όχι",
    reductionBy: "μείωση έως",
    residualBy: "υπόλοιπο έως",
    warnHorizonShort: `Ο ορίζοντας είναι κάτω από ${SBTI_MIN_HORIZON} έτη — το SBTi απαιτεί τουλάχιστον ${SBTI_MIN_HORIZON} έτη.`,
    warnHorizonLong: `Ο ορίζοντας υπερβαίνει τα ${SBTI_MAX_HORIZON} έτη — μέγιστος βραχυπρόθεσμος ορίζοντας κατά SBTi.`,
    warnScope3: `Το Scope 3 ξεπερνά το ${Math.round(SBTI_SCOPE3_THRESHOLD * 100)}% — στόχος Scope 3 υποχρεωτικός (κριτήριο C15).`,
    warnNoBase: "Καταχωρίστε εκπομπές έτους βάσης πάνω από μηδέν.",
    statementTemplate: (o: {
      company: string; sector: string; base: string; target: string;
      pctS12: string; pctS3: string; baseYear: string; targetYear: string;
      s12BaseT: string; s3BaseT: string; nzYear: string; nzPct: string;
    }) =>
      `Η ${o.company || "εταιρεία μας"}${o.sector ? ` (${o.sector})` : ""} δεσμεύεται να μειώσει τις απόλυτες εκπομπές Scope 1 & 2 κατά ${o.pctS12} έως το ${o.targetYear} από έτος βάσης ${o.baseYear} (από ${o.s12BaseT} σε ${o.base} t CO₂e). Επίσης, δεσμεύεται να μειώσει τις απόλυτες εκπομπές Scope 3 κατά ${o.pctS3} στην ίδια περίοδο (από ${o.s3BaseT} σε ${o.target} t CO₂e). Μακροπρόθεσμα, δεσμεύεται σε net-zero σε όλη την αλυσίδα αξίας έως το ${o.nzYear}, με απόλυτη μείωση ${o.nzPct} από τη βάση ${o.baseYear}.`,
    disclaimer: "Το εργαλείο παράγει προσχέδιο. Η υποβολή στόχου στο SBTi απαιτεί επικύρωση με το τρέχον Corporate Net-Zero Standard.",
    sourcesNote: "SBTi Corporate Net-Zero Standard v1.2 · Near-Term Criteria v5.1 · γραμμική μείωση",
    reportTitle: "Προσχέδιο βραχυπρόθεσμου στόχου SBTi",
    generatedOn: "Δημιουργήθηκε",
    trajectoryHeading: "Ετήσια τροχιά (γραμμική μείωση)",
    year: "Έτος",
  },
} as const;

const TOTAL_STEPS = 4;

export default function SbtiTargetSetter({ locale }: { locale: Locale }) {
  const l = T[locale];
  const [inputs, setInputs] = usePersistedState<Inputs>("verdeiq.tool.sbti", DEFAULT_INPUTS);
  const [step, setStep] = useState(0);

  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) => setInputs((p) => ({ ...p, [k]: v }));

  const result = useMemo(() => {
    return computePathway({
      baseYear: inputs.baseYear,
      targetYear: inputs.targetYear,
      scope1: Number(inputs.scope1) || 0,
      scope2: Number(inputs.scope2) || 0,
      scope3: Number(inputs.scope3) || 0,
      scope12Ambition: inputs.scope12Ambition,
      scope3Ambition: inputs.scope3Ambition,
    });
  }, [inputs]);

  const filledSteps = useMemo(() => {
    let n = 0;
    if (inputs.company.trim() && inputs.sector.trim()) n += 1;
    if (result.totalBase > 0) n += 1;
    if (inputs.targetYear > inputs.baseYear) n += 1;
    if (step >= 3) n += 1;
    return n;
  }, [inputs, result.totalBase, step]);
  const percent = Math.round((filledSteps / TOTAL_STEPS) * 100);

  const goPrev = () => setStep((s) => Math.max(0, s - 1));
  const goNext = () => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  const doPrint = () => window.print();
  const doReset = () => { setInputs(DEFAULT_INPUTS); setStep(0); };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify({ tool: "sbti-target-setter", generatedAt: new Date().toISOString(), inputs, result }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "verdeiq-sbti-target.json"; a.click();
    URL.revokeObjectURL(url);
  };
  const downloadCsv = () => {
    const rows = ["year,scope_1_and_2_tCO2e,scope_3_tCO2e,total_tCO2e"];
    for (const p of result.trajectory) {
      rows.push(`${p.year},${p.scope12.toFixed(1)},${p.scope3.toFixed(1)},${p.total.toFixed(1)}`);
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "verdeiq-sbti-pathway.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const statement = l.statementTemplate({
    company: inputs.company.trim(),
    sector: inputs.sector.trim(),
    base: formatTonnes(result.scope12Target, locale),
    target: formatTonnes(result.scope3Target, locale),
    pctS12: formatPct(result.scope12TargetPct, locale),
    pctS3: formatPct(result.scope3TargetPct, locale),
    baseYear: String(inputs.baseYear),
    targetYear: String(inputs.targetYear),
    s12BaseT: formatTonnes(result.scope12Base, locale),
    s3BaseT: formatTonnes(result.scope3Base, locale),
    nzYear: String(SBTI_NET_ZERO_YEAR),
    nzPct: formatPct(0.9, locale),
  });

  return (
    <div className="viq-tool not-prose border-y border-foreground/15 print:border-none">
      {/* Header */}
      <div className="border-b border-foreground/10 py-8 sm:py-10">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="viq-tool-status viq-meta">
              <strong>{l.steps[step]}</strong>
              <span>{filledSteps} {l.of} {TOTAL_STEPS} complete</span>
            </p>
            <div className="mt-3 h-1.5 w-full max-w-md bg-foreground/10">
              <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} aria-hidden />
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {l.steps.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStep(i)}
                  className={`viq-button viq-button-sm h-9 border px-3 transition ${
                    step === i
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground/25 text-foreground/70 hover:border-foreground"
                  }`}
                >
                  <span className="tabular-nums">{i + 1}</span> {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 print:hidden">
            <button type="button" onClick={doPrint} className="viq-button inline-flex h-9 items-center border border-foreground bg-foreground px-4 text-background transition hover:bg-foreground/85">{l.print}</button>
            <button type="button" onClick={downloadCsv} className="viq-button inline-flex h-9 items-center border border-foreground/25 px-4 text-foreground transition hover:border-foreground">{l.csv}</button>
            <button type="button" onClick={downloadJson} className="viq-button inline-flex h-9 items-center border border-foreground/25 px-4 text-foreground transition hover:border-foreground">{l.json}</button>
            <button type="button" onClick={doReset} className="viq-button inline-flex h-9 items-center px-2 text-foreground/70 underline underline-offset-4 transition hover:text-foreground">{l.reset}</button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="py-8 sm:py-10">
        {step === 0 && (
          <div className="max-w-2xl">
            <p className="viq-section-label">{l.step} 1</p>
            <h3 className="mt-2 text-[24px] font-medium tracking-[-0.015em]">{l.s1Title}</h3>
            <p className="mt-3 text-[14px] leading-[1.65] text-foreground/65">{l.s1Body}</p>
            <div className="mt-6 space-y-5">
              <Field label={l.company}>
                <input type="text" value={inputs.company} onChange={(e) => set("company", e.target.value)} className={inputCls("max-w-md")} />
              </Field>
              <Field label={l.sector}>
                <input type="text" value={inputs.sector} onChange={(e) => set("sector", e.target.value)} className={inputCls("max-w-md")} />
              </Field>
              <Field label={l.baseYear}>
                <input type="number" value={inputs.baseYear} min={2015} max={new Date().getFullYear()} onChange={(e) => set("baseYear", Number(e.target.value))} className={inputCls("max-w-[160px] tabular-nums")} />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="max-w-2xl">
            <p className="viq-section-label">{l.step} 2</p>
            <h3 className="mt-2 text-[24px] font-medium tracking-[-0.015em]">{l.s2Title}</h3>
            <p className="mt-3 text-[14px] leading-[1.65] text-foreground/65">{l.s2Body}</p>
            <div className="mt-6 space-y-5">
              {(["scope1", "scope2", "scope3"] as const).map((k) => (
                <Field key={k} label={l[k]} suffix={l.tCO2e}>
                  <input type="number" inputMode="decimal" min={0} value={inputs[k]} onChange={(e) => set(k, e.target.value)} className={inputCls("max-w-[200px] tabular-nums")} />
                </Field>
              ))}
              <div className="mt-2 border-t border-foreground/10 pt-4 grid grid-cols-3 gap-4 text-[12px]">
                <Stat label={l.kScope12} value={`${formatTonnes(result.scope12Base, locale)} ${l.tCO2e}`} />
                <Stat label={l.kScope3} value={`${formatTonnes(result.scope3Base, locale)} ${l.tCO2e}`} />
                <Stat label={l.kTotal} value={`${formatTonnes(result.totalBase, locale)} ${l.tCO2e}`} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-2xl">
            <p className="viq-section-label">{l.step} 3</p>
            <h3 className="mt-2 text-[24px] font-medium tracking-[-0.015em]">{l.s3Title}</h3>
            <p className="mt-3 text-[14px] leading-[1.65] text-foreground/65">{l.s3Body}</p>
            <div className="mt-6 space-y-6">
              <Field label={l.targetYear}>
                <input type="number" value={inputs.targetYear} min={inputs.baseYear + 1} max={inputs.baseYear + SBTI_MAX_HORIZON} onChange={(e) => set("targetYear", Number(e.target.value))} className={inputCls("max-w-[160px] tabular-nums")} />
              </Field>
              <AmbitionPicker label={l.scope12Ambition} value={inputs.scope12Ambition} onChange={(v) => set("scope12Ambition", v)} labels={l} />
              <AmbitionPicker label={l.scope3Ambition} value={inputs.scope3Ambition} onChange={(v) => set("scope3Ambition", v)} labels={l} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="viq-section-label">{l.step} 4</p>
            <h3 className="mt-2 text-[24px] font-medium tracking-[-0.015em]">{l.s4Title}</h3>
            <p className="mt-3 text-[14px] leading-[1.65] text-foreground/65 print:hidden">{l.s4Body}</p>
            <p className="viq-print-note mt-2 hidden print:block">
              {l.generatedOn} {new Date().toLocaleDateString(locale === "el" ? "el-CY" : "en-GB")}
            </p>

            {result.warnings.length > 0 && (
              <div className="mt-6 space-y-2">
                {result.warnings.includes("no-base-emissions") && <Warning>{l.warnNoBase}</Warning>}
                {result.warnings.includes("horizon-too-short") && <Warning>{l.warnHorizonShort}</Warning>}
                {result.warnings.includes("horizon-too-long") && <Warning>{l.warnHorizonLong}</Warning>}
                {result.warnings.includes("scope3-target-missing") && <Warning>{l.warnScope3}</Warning>}
              </div>
            )}

            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              <ResultCard heading={l.baselineHeading}>
                <Stat label={l.kBaseYear} value={String(inputs.baseYear)} />
                <Stat label={l.kScope12} value={`${formatTonnes(result.scope12Base, locale)} ${l.tCO2e}`} />
                <Stat label={l.kScope3} value={`${formatTonnes(result.scope3Base, locale)} ${l.tCO2e}`} />
                <Stat label={l.kShareScope3} value={formatPct(result.scope3Share, locale)} />
                <Stat label={l.kScope3Required} value={result.scope3Required ? l.yes : l.no} />
              </ResultCard>
              <ResultCard heading={l.targetHeading}>
                <Stat label={l.kBaseYear} value={`${inputs.baseYear} → ${inputs.targetYear}`} />
                <Stat label={l.kHorizon} value={`${result.horizonYears} ${l.years}`} />
                <Stat label={`${l.kScope12} · ${l.reductionBy} ${inputs.targetYear}`} value={`−${formatPct(result.scope12TargetPct, locale)}`} />
                <Stat label={`${l.kScope3} · ${l.reductionBy} ${inputs.targetYear}`} value={`−${formatPct(result.scope3TargetPct, locale)}`} />
                <Stat label={`${l.kTotal} · ${l.residualBy} ${inputs.targetYear}`} value={`${formatTonnes(result.totalTarget, locale)} ${l.tCO2e}`} />
              </ResultCard>
              <ResultCard heading={l.netZeroHeading}>
                <Stat label={l.kBaseYear} value={String(SBTI_NET_ZERO_YEAR)} />
                <Stat label={l.reductionBy + " " + SBTI_NET_ZERO_YEAR} value={`−${formatPct(0.9, locale)}`} />
                <Stat label={l.residualBy + " " + SBTI_NET_ZERO_YEAR} value={`${formatTonnes(result.netZeroTarget, locale)} ${l.tCO2e}`} />
              </ResultCard>
            </div>

            <div className="mt-10 border-t border-foreground/15 pt-6">
              <p className="viq-section-label">{l.statementHeading}</p>
              <p className="mt-3 text-[14.5px] leading-[1.7] text-foreground">{statement}</p>
            </div>

            <div className="mt-10 border-t border-foreground/15 pt-6">
              <p className="viq-section-label">{l.trajectoryHeading}</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-[12.5px]">
                  <thead>
                    <tr className="border-b border-foreground/15 text-left text-foreground/55">
                      <th className="py-2 pr-4 font-medium">{l.year}</th>
                      <th className="py-2 pr-4 text-right font-medium tabular-nums">{l.kScope12} ({l.tCO2e})</th>
                      <th className="py-2 pr-4 text-right font-medium tabular-nums">{l.kScope3} ({l.tCO2e})</th>
                      <th className="py-2 text-right font-medium tabular-nums">{l.kTotal} ({l.tCO2e})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trajectory.map((p) => (
                      <tr key={p.year} className="border-b border-foreground/5">
                        <td className="py-1.5 pr-4 tabular-nums text-foreground/80">{p.year}</td>
                        <td className="py-1.5 pr-4 text-right tabular-nums">{formatTonnes(p.scope12, locale)}</td>
                        <td className="py-1.5 pr-4 text-right tabular-nums">{formatTonnes(p.scope3, locale)}</td>
                        <td className="py-1.5 text-right tabular-nums font-medium">{formatTonnes(p.total, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-8 text-[12px] text-foreground/50">{l.disclaimer}</p>
          </div>
        )}

        {/* Nav */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <button type="button" onClick={goPrev} disabled={step === 0} className="viq-button inline-flex h-9 items-center border border-foreground/25 px-4 text-foreground transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40">← {l.prev}</button>
          <p className="viq-meta tabular-nums">{step + 1} {l.of} {TOTAL_STEPS}</p>
          <button type="button" onClick={goNext} disabled={step === TOTAL_STEPS - 1} className="viq-button inline-flex h-9 items-center border border-foreground bg-foreground px-4 text-background transition hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-40">{l.next} →</button>
        </div>
      </div>
    </div>
  );
}

function inputCls(extra = "") {
  return `mt-2 block w-full border border-foreground/25 bg-transparent px-3 py-2 text-[14px] text-foreground outline-none transition focus:border-foreground ${extra}`;
}

function Field({ label, suffix, children }: { label: string; suffix?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="viq-field-label block">
        {label}
        {suffix ? <span className="ml-2 font-normal normal-case tracking-normal text-foreground/45">({suffix})</span> : null}
      </label>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-foreground/5 py-1.5 last:border-b-0">
      <span className="viq-caption">{label}</span>
      <span className="text-right text-[13px] font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function ResultCard({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="border border-foreground/15 p-5">
      <p className="viq-section-label">{heading}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-amber-500 bg-amber-500/5 px-3 py-2 text-[12.5px] text-foreground/75">
      {children}
    </div>
  );
}

function AmbitionPicker({
  label,
  value,
  onChange,
  labels,
}: {
  label: string;
  value: AmbitionKey;
  onChange: (v: AmbitionKey) => void;
  labels: (typeof T)["en"] | (typeof T)["el"];
}) {
  const opts: AmbitionKey[] = ["1.5C", "WB2C"];
  return (
    <div>
      <label className="viq-field-label block">{label}</label>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {opts.map((k) => {
          const active = value === k;
          const rate = SBTI_ANNUAL_LINEAR_RATE[k];
          return (
            <button
              key={k}
              type="button"
              onClick={() => onChange(k)}
              className={`border px-4 py-3 text-left transition ${
                active ? "border-foreground bg-foreground text-background" : "border-foreground/25 hover:border-foreground"
              }`}
            >
              <p className="text-[12.5px] font-semibold">{labels[`amb-${k}` as const]}</p>
              <p className={`viq-caption mt-1 tabular-nums ${active ? "text-background/75" : "text-foreground/65"}`}>
                {labels[`amb-${k}-desc` as const]} · {(rate * 100).toFixed(1)}%/yr
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
