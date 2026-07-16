"use client";

/**
 * VerdeIQ EU Taxonomy Eligibility Checker.
 *
 * 1. User searches / picks a NACE activity from the curated eligible list.
 * 2. Tool shows which of the six environmental objectives it can substantially
 *    contribute to (SC), then walks the DNSH checklist for the OTHER five
 *    objectives and the minimum safeguards under Art. 18.
 * 3. Produces a verdict: aligned / partially aligned / not aligned.
 *
 * All state client-side. Not legal advice - links to the underlying
 * Delegated Acts on each activity card.
 */

import { useMemo, useState } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import type { Locale } from "@/data/tools";
import {
  ACTIVITIES,
  DNSH_CHECKS,
  MIN_SAFEGUARDS,
  OBJECTIVES,
  type TaxonomyActivity,
  type TaxonomyObjective,
} from "@/data/tools/nace-taxonomy";

type Props = { locale: Locale };

type Answer = "yes" | "no" | "na" | "";
type State = {
  activityRef: string;
  primary: TaxonomyObjective | "";
  dnsh: Partial<Record<TaxonomyObjective, Answer>>;
  safeguards: Record<number, Answer>;
};

const DEFAULT_STATE: State = { activityRef: "", primary: "", dnsh: {}, safeguards: {} };

const T = {
  en: {
    interactive: "Interactive tool",
    step01: "Find your activity",
    step02: "Confirm substantial contribution",
    step03: "Do No Significant Harm (DNSH)",
    step04: "Minimum safeguards (Art. 18)",
    step05: "Result",
    search: "Search by NACE code or keyword",
    searchPlaceholder: "e.g. 35.11, solar, cement, buildings",
    selectedNone: "No activity selected yet.",
    selectedActivity: "Selected activity",
    nace: "NACE",
    ref: "Reference",
    contributes: "Objectives this activity can substantially contribute to",
    primaryHelp: "Pick the primary objective you will claim substantial contribution to.",
    dnshIntro: "For the OTHER five objectives, confirm the activity does not significantly harm them.",
    safeguardsIntro: "Confirm compliance with the Art. 18 minimum safeguards.",
    yes: "Yes",
    no: "No",
    na: "N/A",
    verdictAligned: "Taxonomy aligned",
    verdictPartial: "Partially aligned",
    verdictNot: "Not aligned",
    verdictEmpty: "Complete the steps to see your verdict.",
    verdictAlignedBody: "The activity is eligible under the Delegated Acts, you have confirmed substantial contribution, all applicable DNSH checks pass, and minimum safeguards are met. Document your evidence and disclose alignment under Art. 8.",
    verdictPartialBody: "The activity is eligible but at least one DNSH or safeguards check is not met (or unanswered). Report as eligible-but-not-aligned in your Art. 8 disclosure and remediate the failing check.",
    verdictNotBody: "The activity is eligible but a DNSH check has failed. It cannot be reported as aligned; address the issue before reclaiming alignment.",
    print: "Save as PDF",
    csv: "Download CSV",
    reset: "Reset",
    disclaimer: "This tool is a screening aid. It uses a curated subset of eligible activities and generic DNSH questions; the underlying Delegated Acts (Reg. 2021/2139 and Reg. 2023/2486) contain the full technical screening criteria. Consult qualified advisers before claiming alignment.",
    sourcesNote: "Sources: EU Taxonomy Regulation (Reg. 2020/852) · Climate Delegated Act (Reg. 2021/2139) · Environmental Delegated Act (Reg. 2023/2486).",
    generatedOn: "Generated on",
    reportTitle: "EU Taxonomy eligibility screening",
    noResults: "No matching activity - try a different keyword.",
  },
  el: {
    interactive: "Διαδραστικό εργαλείο",
    step01: "Βρείτε τη δραστηριότητά σας",
    step02: "Επιβεβαίωση ουσιαστικής συμβολής",
    step03: "Do No Significant Harm (DNSH)",
    step04: "Ελάχιστες εγγυήσεις (Άρθρο 18)",
    step05: "Αποτέλεσμα",
    search: "Αναζήτηση με NACE ή λέξη-κλειδί",
    searchPlaceholder: "π.χ. 35.11, ηλιακά, τσιμέντο, κτίρια",
    selectedNone: "Δεν έχει επιλεγεί δραστηριότητα.",
    selectedActivity: "Επιλεγμένη δραστηριότητα",
    nace: "NACE",
    ref: "Αναφορά",
    contributes: "Στόχοι όπου η δραστηριότητα συμβάλλει ουσιαστικά",
    primaryHelp: "Επιλέξτε τον κύριο στόχο για τον οποίο θα δηλώσετε ουσιαστική συμβολή.",
    dnshIntro: "Για τους ΑΛΛΟΥΣ πέντε στόχους, επιβεβαιώστε ότι η δραστηριότητα δεν τους βλάπτει ουσιαστικά.",
    safeguardsIntro: "Επιβεβαιώστε τη συμμόρφωση με τις ελάχιστες εγγυήσεις του Άρθρου 18.",
    yes: "Ναι",
    no: "Όχι",
    na: "Δ/Α",
    verdictAligned: "Ευθυγραμμισμένο με το Taxonomy",
    verdictPartial: "Μερικώς ευθυγραμμισμένο",
    verdictNot: "Μη ευθυγραμμισμένο",
    verdictEmpty: "Ολοκληρώστε τα βήματα για να δείτε την ετυμηγορία.",
    verdictAlignedBody: "Η δραστηριότητα είναι επιλέξιμη, η ουσιαστική συμβολή επιβεβαιώθηκε, όλοι οι έλεγχοι DNSH περνούν και οι ελάχιστες εγγυήσεις πληρούνται. Δημοσιοποιήστε την ευθυγράμμιση κατά το Άρθρο 8.",
    verdictPartialBody: "Η δραστηριότητα είναι επιλέξιμη αλλά ένας έλεγχος DNSH ή εγγυήσεων δεν επιβεβαιώθηκε. Αναφέρετε ως επιλέξιμη-όχι-ευθυγραμμισμένη και αποκαταστήστε τον έλεγχο.",
    verdictNotBody: "Η δραστηριότητα είναι επιλέξιμη αλλά ένας έλεγχος DNSH απέτυχε. Δεν μπορεί να αναφερθεί ως ευθυγραμμισμένη πριν την αποκατάσταση.",
    print: "Αποθήκευση PDF",
    csv: "Λήψη CSV",
    reset: "Επαναφορά",
    disclaimer: "Αυτό είναι εργαλείο προκαταρκτικού ελέγχου. Χρησιμοποιεί επιλεγμένο υποσύνολο επιλέξιμων δραστηριοτήτων και γενικές ερωτήσεις DNSH. Οι Πράξεις κατ' εξουσιοδότηση περιέχουν τα πλήρη τεχνικά κριτήρια.",
    sourcesNote: "Πηγές: Κανονισμός Taxonomy (2020/852) · Climate Delegated Act (2021/2139) · Environmental Delegated Act (2023/2486).",
    generatedOn: "Δημιουργήθηκε",
    reportTitle: "Έλεγχος επιλεξιμότητας EU Taxonomy",
    noResults: "Δεν βρέθηκε - δοκιμάστε άλλη λέξη-κλειδί.",
  },
} as const;

export default function EuTaxonomyChecker({ locale }: Props) {
  const l = T[locale];
  const [state, setState] = usePersistedState<State>("verdeiq.tool.taxonomy", DEFAULT_STATE);
  const [query, setQuery] = useState("");

  const activity: TaxonomyActivity | null = useMemo(
    () => ACTIVITIES.find((a) => a.ref === state.activityRef) ?? null,
    [state.activityRef],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ACTIVITIES;
    return ACTIVITIES.filter(
      (a) =>
        a.nace.toLowerCase().includes(q) ||
        a.ref.toLowerCase().includes(q) ||
        a[locale].name.toLowerCase().includes(q) ||
        a[locale].description.toLowerCase().includes(q),
    );
  }, [query, locale]);

  const pickActivity = (ref: string) =>
    setState({
      activityRef: ref,
      primary: (ACTIVITIES.find((a) => a.ref === ref)?.objectives[0] ?? "") as TaxonomyObjective | "",
      dnsh: {},
      safeguards: {},
    });

  const setDnsh = (obj: TaxonomyObjective, v: Answer) =>
    setState((s) => ({ ...s, dnsh: { ...s.dnsh, [obj]: v } }));
  const setSafeguard = (i: number, v: Answer) =>
    setState((s) => ({ ...s, safeguards: { ...s.safeguards, [i]: v } }));
  const reset = () => setState(DEFAULT_STATE);
  const doPrint = () => window.print();

  // Verdict logic
  const otherObjectives = activity && state.primary
    ? OBJECTIVES.filter((o) => o.id !== state.primary).map((o) => o.id)
    : [];
  const dnshAnswers = otherObjectives.map((o) => state.dnsh[o] ?? "");
  const safeAnswers = MIN_SAFEGUARDS.map((_, i) => state.safeguards[i] ?? "");
  const anyFailure = [...dnshAnswers, ...safeAnswers].some((x) => x === "no");
  const allComplete =
    activity != null &&
    state.primary !== "" &&
    dnshAnswers.every((x) => x !== "") &&
    safeAnswers.every((x) => x !== "");
  const allYesOrNa = [...dnshAnswers, ...safeAnswers].every((x) => x === "yes" || x === "na");

  let verdict: "aligned" | "partial" | "not" | "empty" = "empty";
  if (allComplete) {
    if (anyFailure) verdict = "not";
    else if (allYesOrNa) verdict = "aligned";
    else verdict = "partial";
  } else if (activity && state.primary) {
    verdict = anyFailure ? "not" : "partial";
  }

  const downloadCsv = () => {
    if (!activity) return;
    const rows: string[] = ["section,item,answer"];
    rows.push(`activity,${activity.ref} - ${activity.en.name.replace(/,/g, ";")},${state.primary}`);
    otherObjectives.forEach((o) => rows.push(`dnsh,${o},${state.dnsh[o] ?? ""}`));
    MIN_SAFEGUARDS.forEach((s, i) => rows.push(`safeguard_${i + 1},${s.en.replace(/,/g, ";")},${state.safeguards[i] ?? ""}`));
    rows.push(`verdict,,${verdict}`);
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "verdeiq-taxonomy-screening.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const AnswerButtons = ({ value, onChange }: { value: Answer; onChange: (v: Answer) => void }) => (
    <div className="flex gap-1.5">
      {(["yes", "no", "na"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`h-8 min-w-[52px] border px-3 text-[11.5px] font-medium tracking-[-0.005em] transition ${
            value === opt
              ? opt === "yes"
                ? "border-primary bg-primary text-primary-foreground"
                : opt === "no"
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground/60 bg-foreground/10 text-foreground"
              : "border-foreground/25 text-foreground/70 hover:border-foreground"
          }`}
        >
          {opt === "yes" ? l.yes : opt === "no" ? l.no : l.na}
        </button>
      ))}
    </div>
  );

  return (
    <div className="viq-tool not-prose border-y border-foreground/15 print:border-none">
      {/* Header */}
      <div className="border-b border-foreground/10 py-8 sm:py-10">
        <p className="max-w-2xl text-[13px] text-foreground/60 print:hidden">{l.disclaimer}</p>
        <div className="mt-6 flex flex-wrap gap-3 print:hidden">
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
            disabled={!activity}
            className="viq-button inline-flex h-9 items-center border border-foreground/25 px-4 text-foreground transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {l.csv}
          </button>
          <button
            type="button"
            onClick={reset}
            className="viq-button inline-flex h-9 items-center px-2 text-foreground/70 underline underline-offset-4 transition hover:text-foreground"
          >
            {l.reset}
          </button>
        </div>
      </div>

      {/* Step 1 - search + pick */}
      <div className="border-b border-foreground/10 py-8 sm:py-10 print:hidden">
        <p className="viq-section-label">{l.step01}</p>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={l.searchPlaceholder}
          aria-label={l.search}
          className="mt-4 block w-full max-w-xl border border-foreground/25 bg-transparent px-3 py-2 text-[14px] text-foreground outline-none transition focus:border-foreground"
        />
        <div className="mt-5 max-h-[420px] overflow-y-auto border border-foreground/10">
          {filtered.length === 0 && (
            <p className="p-4 text-[13px] text-foreground/50">{l.noResults}</p>
          )}
          <ul className="divide-y divide-foreground/10">
            {filtered.map((a) => {
              const selected = state.activityRef === a.ref;
              return (
                <li key={a.ref}>
                  <button
                    type="button"
                    onClick={() => pickActivity(a.ref)}
                    className={`block w-full px-4 py-3 text-left transition ${
                      selected ? "bg-foreground/5" : "hover:bg-foreground/[.03]"
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <span className="text-[13.5px] font-medium text-foreground">{a[locale].name}</span>
                      <span className="tabular-nums text-[11px] text-foreground/50">
                        {l.nace} {a.nace} · {a.ref}
                      </span>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-[1.5] text-foreground/60">
                      {a[locale].description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {a.objectives.map((o) => (
                        <span
                          key={o}
                          className="border border-foreground/25 px-1.5 py-0.5 text-[12px] font-semibold text-foreground/75"
                        >
                          {o}
                        </span>
                      ))}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Selected activity - always visible when set (also in print) */}
      <div className="border-b border-foreground/10 py-8 sm:py-10">
        <p className="viq-section-label">{l.selectedActivity}</p>
        {!activity && (
          <p className="mt-4 text-[13px] text-foreground/50">{l.selectedNone}</p>
        )}
        {activity && (
          <>
            <h3 className="mt-3 text-[22px] font-medium tracking-[-0.015em] text-foreground">
              {activity[locale].name}
            </h3>
            <p className="mt-2 text-[13.5px] leading-[1.6] text-foreground/65">
              {activity[locale].description}
            </p>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-[12.5px]">
              <dt className="viq-caption">{l.nace}</dt>
              <dd className="tabular-nums text-foreground">{activity.nace}</dd>
              <dt className="viq-caption">{l.ref}</dt>
              <dd className="tabular-nums text-foreground">{activity.ref}</dd>
            </dl>

            <p className="viq-section-label mt-6">
              {l.contributes}
            </p>
            <p className="mt-1 text-[12px] text-foreground/50">{l.primaryHelp}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {activity.objectives.map((o) => {
                const objMeta = OBJECTIVES.find((x) => x.id === o)!;
                const active = state.primary === o;
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setState((s) => ({ ...s, primary: o, dnsh: {} }))}
                    className={`h-9 border px-3 text-[12px] font-medium tracking-[-0.005em] transition ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-foreground/25 text-foreground hover:border-foreground"
                    }`}
                  >
                    {o} · {objMeta[locale]}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Step 3 - DNSH */}
      {activity && state.primary && (
        <div className="border-b border-foreground/10 py-8 sm:py-10">
          <p className="viq-section-label">{l.step03}</p>
          <p className="mt-3 max-w-2xl text-[13px] leading-[1.6] text-foreground/60">{l.dnshIntro}</p>
          <ul className="mt-6 divide-y divide-foreground/10 border-y border-foreground/10">
            {otherObjectives.map((o) => {
              const check = DNSH_CHECKS.find((c) => c.objective === o);
              const objMeta = OBJECTIVES.find((x) => x.id === o)!;
              const val = (state.dnsh[o] ?? "") as Answer;
              return (
                <li key={o} className="grid gap-4 py-4 sm:grid-cols-[220px_1fr_auto] sm:items-center">
                  <div>
                    <p className="viq-minor-code">
                      {o}
                    </p>
                    <p className="text-[13px] text-foreground">{objMeta[locale]}</p>
                  </div>
                  <p className="text-[12.5px] leading-[1.55] text-foreground/65">
                    {check ? check[locale] : ""}
                  </p>
                  <AnswerButtons value={val} onChange={(v) => setDnsh(o, v)} />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Step 4 - Safeguards */}
      {activity && state.primary && (
        <div className="border-b border-foreground/10 py-8 sm:py-10">
          <p className="viq-section-label">{l.step04}</p>
          <p className="mt-3 max-w-2xl text-[13px] leading-[1.6] text-foreground/60">{l.safeguardsIntro}</p>
          <ul className="mt-6 divide-y divide-foreground/10 border-y border-foreground/10">
            {MIN_SAFEGUARDS.map((s, i) => (
              <li key={i} className="grid gap-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <p className="text-[12.5px] leading-[1.55] text-foreground">{s[locale]}</p>
                <AnswerButtons value={(state.safeguards[i] ?? "") as Answer} onChange={(v) => setSafeguard(i, v)} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Step 5 - Verdict */}
      <div className="py-8 sm:py-10">
        <p className="viq-section-label">{l.step05}</p>
        {verdict === "empty" && (
          <p className="mt-4 text-[13px] text-foreground/55">{l.verdictEmpty}</p>
        )}
        {verdict !== "empty" && (
          <div
            className={`mt-4 border p-6 ${
              verdict === "aligned"
                ? "border-primary/40 bg-primary/5"
                : verdict === "not"
                  ? "border-foreground"
                  : "border-foreground/40"
            }`}
          >
            <h3 className="text-[22px] font-medium tracking-[-0.015em] text-foreground">
              {verdict === "aligned" ? l.verdictAligned : verdict === "not" ? l.verdictNot : l.verdictPartial}
            </h3>
            <p className="mt-3 max-w-2xl text-[13.5px] leading-[1.65] text-foreground/70">
              {verdict === "aligned"
                ? l.verdictAlignedBody
                : verdict === "not"
                  ? l.verdictNotBody
                  : l.verdictPartialBody}
            </p>
            <p className="viq-print-note mt-4 hidden print:block">
              {l.generatedOn} {new Date().toLocaleDateString(locale === "el" ? "el-CY" : "en-GB")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
