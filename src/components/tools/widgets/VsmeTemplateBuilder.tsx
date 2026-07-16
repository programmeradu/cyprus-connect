"use client";

/**
 * VerdeIQ VSME Template Builder - EFRAG Voluntary SME Standard, Basic Module.
 *
 * Guides the user through B1–B12 disclosures. All data stays client-side.
 * Exports: printable PDF (window.print), JSON snapshot, CSV.
 */

import { useMemo, useState } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import type { Locale } from "@/data/tools";
import { VSME_BASIC } from "@/data/tools/vsme-basic-module";

type Props = { locale: Locale };
type Values = Record<string, Record<string, string>>;

const DEFAULT_VALUES: Values = {};

const T = {
  en: {
    interactive: "Interactive tool",
    progress: "Progress",
    of: "of",
    complete: "complete",
    prev: "Previous",
    next: "Next",
    print: "Save as PDF",
    csv: "Download CSV",
    json: "Download JSON",
    reset: "Reset",
    stepOverview: "Overview",
    stepFinal: "Review & export",
    disclosure: "Disclosure",
    purpose: "Purpose",
    yes: "Yes",
    no: "No",
    notAnswered: "-",
    reportTitle: "VSME Basic Module report",
    generatedOn: "Generated on",
    sourcesNote: "Structure follows EFRAG Voluntary SME Standard (VSME), Basic Module - disclosures B1–B12.",
    disclaimer: "This tool produces a structured working document following the VSME Basic Module. It is a template - a full VSME report requires review by qualified sustainability staff and, where relevant, external assurance.",
    reviewIntro: "Review your entries below, then export as PDF or CSV. Everything stays in your browser.",
    empty: "Not answered",
  },
  el: {
    interactive: "Διαδραστικό εργαλείο",
    progress: "Πρόοδος",
    of: "από",
    complete: "ολοκληρώθηκαν",
    prev: "Προηγούμενο",
    next: "Επόμενο",
    print: "Αποθήκευση PDF",
    csv: "Λήψη CSV",
    json: "Λήψη JSON",
    reset: "Επαναφορά",
    stepOverview: "Επισκόπηση",
    stepFinal: "Έλεγχος & εξαγωγή",
    disclosure: "Αποκάλυψη",
    purpose: "Σκοπός",
    yes: "Ναι",
    no: "Όχι",
    notAnswered: "-",
    reportTitle: "Αναφορά VSME Βασικής Ενότητας",
    generatedOn: "Δημιουργήθηκε",
    sourcesNote: "Ακολουθεί το EFRAG VSME - Βασική Ενότητα, αποκαλύψεις B1–B12.",
    disclaimer: "Το εργαλείο παράγει δομημένο έγγραφο εργασίας. Πλήρης αναφορά VSME απαιτεί έλεγχο από ειδικευμένο προσωπικό.",
    reviewIntro: "Ελέγξτε τις καταχωρίσεις σας και εξάγετε ως PDF ή CSV. Όλα παραμένουν στο πρόγραμμα περιήγησής σας.",
    empty: "Δεν απαντήθηκε",
  },
} as const;

export default function VsmeTemplateBuilder({ locale }: Props) {
  const l = T[locale];
  const [values, setValues] = usePersistedState<Values>("verdeiq.tool.vsme", DEFAULT_VALUES);
  const [step, setStep] = useState(0); // 0 = overview, 1..12 = disclosures, 13 = review

  const totalSteps = VSME_BASIC.length + 2;

  const setField = (disclosureId: string, fieldId: string, value: string) =>
    setValues((v) => ({
      ...v,
      [disclosureId]: { ...(v[disclosureId] ?? {}), [fieldId]: value },
    }));

  const answeredCount = useMemo(() => {
    let n = 0;
    for (const d of VSME_BASIC) {
      const filled = Object.values(values[d.id] ?? {}).some((x) => x && x.trim().length > 0);
      if (filled) n += 1;
    }
    return n;
  }, [values]);

  const percent = Math.round((answeredCount / VSME_BASIC.length) * 100);

  const currentDisclosure = step >= 1 && step <= VSME_BASIC.length ? VSME_BASIC[step - 1] : null;
  const onOverview = step === 0;
  const onReview = step === totalSteps - 1;

  const goPrev = () => setStep((s) => Math.max(0, s - 1));
  const goNext = () => setStep((s) => Math.min(totalSteps - 1, s + 1));

  const doPrint = () => window.print();
  const doReset = () => {
    setValues(DEFAULT_VALUES);
    setStep(0);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify({ tool: "vsme-basic", generatedAt: new Date().toISOString(), values }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "verdeiq-vsme-basic.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsv = () => {
    const rows: string[] = ["disclosure,field,value"];
    for (const d of VSME_BASIC) {
      for (const f of d.fields) {
        const v = (values[d.id]?.[f.id] ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ");
        rows.push(`${d.code},${f.id},"${v}"`);
      }
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "verdeiq-vsme-basic.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="viq-tool not-prose border-y border-foreground/15 print:border-none">
      {/* Header */}
      <div className="border-b border-foreground/10 py-8 sm:py-10">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="viq-tool-status viq-meta">
              <strong>{onOverview ? l.stepOverview : onReview ? l.stepFinal : currentDisclosure?.code}</strong>
              <span>{answeredCount} {l.of} {VSME_BASIC.length} {l.complete}</span>
            </p>
            <div className="mt-3 h-1.5 w-full max-w-md bg-foreground/10">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${percent}%` }}
                aria-hidden
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {VSME_BASIC.map((d, i) => {
                const isCurrent = step === i + 1;
                const isFilled = Object.values(values[d.id] ?? {}).some((x) => x && x.trim().length > 0);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setStep(i + 1)}
                    className={`viq-button viq-button-sm h-9 min-w-[40px] border px-2 tabular-nums transition ${
                      isCurrent
                        ? "border-foreground bg-foreground text-background"
                        : isFilled
                          ? "border-primary/60 text-foreground hover:border-primary"
                          : "border-foreground/25 text-foreground/60 hover:border-foreground"
                    }`}
                    aria-label={d.code}
                  >
                    {d.code}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 print:hidden">
            <button
              type="button"
              onClick={doPrint}
              className="viq-button inline-flex h-9 items-center border border-foreground bg-foreground px-4 text-background transition hover:bg-foreground/85"
            >
              {l.print}
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              className="viq-button inline-flex h-9 items-center border border-foreground/25 px-4 text-foreground transition hover:border-foreground"
            >
              {l.csv}
            </button>
            <button
              type="button"
              onClick={downloadJson}
              className="viq-button inline-flex h-9 items-center border border-foreground/25 px-4 text-foreground transition hover:border-foreground"
            >
              {l.json}
            </button>
            <button
              type="button"
              onClick={doReset}
              className="viq-button inline-flex h-9 items-center px-2 text-foreground/70 underline underline-offset-4 transition hover:text-foreground"
            >
              {l.reset}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="py-8 sm:py-10">
        {onOverview && (
          <div className="max-w-2xl">
            <p className="viq-section-label">{l.stepOverview}</p>
            <h3 className="mt-2 text-[24px] font-medium tracking-[-0.015em] text-foreground">
              {l.reportTitle}
            </h3>
            <p className="mt-4 text-[14.5px] leading-[1.65] text-foreground/70">{l.disclaimer}</p>
            <div className="mt-6 border-t border-foreground/15 pt-6">
              <ol className="space-y-3">
                {VSME_BASIC.map((d, i) => (
                  <li key={d.id} className="grid grid-cols-[auto_auto_1fr] items-baseline gap-4">
                    <span className="viq-minor-code tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="viq-minor-code">
                      {d.code}
                    </span>
                    <span className="text-[13.5px] text-foreground">{d.title[locale]}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {currentDisclosure && (
          <div className="max-w-3xl">
            <p className="viq-section-label">{l.disclosure} {currentDisclosure.code}</p>
            <h3 className="mt-2 text-[24px] font-medium tracking-[-0.015em] text-foreground">
              {currentDisclosure.title[locale]}
            </h3>
            <p className="mt-3 text-[13.5px] leading-[1.65] text-foreground/60">
              <span className="viq-caption font-semibold">{l.purpose}: </span>
              {currentDisclosure.purpose[locale]}
            </p>

            <div className="mt-6 space-y-5">
              {currentDisclosure.fields.map((f) => {
                const val = values[currentDisclosure.id]?.[f.id] ?? "";
                const commonLabel = (
                  <label className="viq-field-label block">
                    {f.label[locale]}
                    {f.unit ? <span className="ml-2 font-normal normal-case tracking-normal text-foreground/45">({f.unit})</span> : null}
                  </label>
                );
                return (
                  <div key={f.id}>
                    {commonLabel}
                    {f.hint && (
                      <p className="mt-1 text-[12px] text-foreground/50">{f.hint[locale]}</p>
                    )}
                    {f.type === "text" && (
                      <textarea
                        value={val}
                        onChange={(e) => setField(currentDisclosure.id, f.id, e.target.value)}
                        rows={4}
                        className="mt-2 block w-full border border-foreground/25 bg-transparent px-3 py-2 text-[14px] text-foreground outline-none transition focus:border-foreground"
                      />
                    )}
                    {f.type === "shorttext" && (
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setField(currentDisclosure.id, f.id, e.target.value)}
                        className="mt-2 block w-full max-w-md border border-foreground/25 bg-transparent px-3 py-2 text-[14px] text-foreground outline-none transition focus:border-foreground"
                      />
                    )}
                    {f.type === "number" && (
                      <input
                        type="number"
                        inputMode="decimal"
                        value={val}
                        onChange={(e) => setField(currentDisclosure.id, f.id, e.target.value)}
                        className="mt-2 block w-full max-w-xs border border-foreground/25 bg-transparent px-3 py-2 text-[14px] tabular-nums text-foreground outline-none transition focus:border-foreground"
                      />
                    )}
                    {f.type === "yesno" && (
                      <div className="mt-2 flex gap-2">
                        {["yes", "no"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setField(currentDisclosure.id, f.id, opt)}
                            className={`h-9 min-w-[68px] border px-4 text-[12.5px] font-medium tracking-[-0.005em] transition ${
                              val === opt
                                ? "border-foreground bg-foreground text-background"
                                : "border-foreground/25 text-foreground hover:border-foreground"
                            }`}
                          >
                            {opt === "yes" ? l.yes : l.no}
                          </button>
                        ))}
                      </div>
                    )}
                    {f.type === "select" && f.options && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {f.options.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setField(currentDisclosure.id, f.id, opt.value)}
                            className={`h-9 border px-4 text-[12.5px] font-medium tracking-[-0.005em] transition ${
                              val === opt.value
                                ? "border-foreground bg-foreground text-background"
                                : "border-foreground/25 text-foreground hover:border-foreground"
                            }`}
                          >
                            {opt[locale]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {onReview && (
          <div>
            <p className="viq-section-label">{l.stepFinal}</p>
            <h3 className="mt-2 text-[24px] font-medium tracking-[-0.015em] text-foreground">
              {l.reportTitle}
            </h3>
            <p className="mt-3 text-[13.5px] text-foreground/55 print:hidden">{l.reviewIntro}</p>
            <p className="viq-print-note mt-2 hidden print:block">
              {l.generatedOn} {new Date().toLocaleDateString(locale === "el" ? "el-CY" : "en-GB")}
            </p>

            <div className="mt-6 divide-y divide-foreground/15 border-y border-foreground/15">
              {VSME_BASIC.map((d) => (
                <div key={d.id} className="grid gap-4 py-6 sm:grid-cols-[160px_1fr]">
                  <div>
                    <p className="viq-minor-code">
                      {d.code}
                    </p>
                    <p className="mt-1 text-[13.5px] font-medium text-foreground">
                      {d.title[locale]}
                    </p>
                  </div>
                  <dl className="space-y-2">
                    {d.fields.map((f) => {
                      const raw = values[d.id]?.[f.id] ?? "";
                      let display: string = raw;
                      if (f.type === "yesno") display = raw === "yes" ? l.yes : raw === "no" ? l.no : "";
                      if (f.type === "select" && f.options) {
                        const opt = f.options.find((o) => o.value === raw);
                        display = opt ? opt[locale] : "";
                      }
                      return (
                        <div key={f.id} className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-foreground/5 pb-1.5 last:border-b-0">
                          <dt className="text-[12.5px] text-foreground/60">
                            {f.label[locale]}
                            {f.unit ? <span className="ml-1 text-foreground/40">({f.unit})</span> : null}
                          </dt>
                          <dd className="text-right text-[13px] text-foreground">
                            {display && display.trim().length > 0 ? (
                              <span className="whitespace-pre-wrap break-words">{display}</span>
                            ) : (
                              <span className="text-foreground/35">{l.empty}</span>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 0}
            className="viq-button inline-flex h-9 items-center border border-foreground/25 px-4 text-foreground transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← {l.prev}
          </button>
          <p className="viq-meta tabular-nums">
            {String(step + 1).padStart(2, "0")} {l.of} {String(totalSteps).padStart(2, "0")}
          </p>
          <button
            type="button"
            onClick={goNext}
            disabled={step === totalSteps - 1}
            className="viq-button inline-flex h-9 items-center border border-foreground bg-foreground px-4 text-background transition hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {l.next} →
          </button>
        </div>
      </div>
    </div>
  );
}
