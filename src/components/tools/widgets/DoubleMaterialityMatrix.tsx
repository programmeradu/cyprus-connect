"use client";

/**
 * VerdeIQ Double Materiality Matrix - CSRD / ESRS 1 §3.
 *
 * Score each topic on:
 *   Impact materiality  = f(severity, scope, irremediability, likelihood)
 *   Financial materiality = f(magnitude, likelihood)
 *
 * Plots a 2D scatter and marks topics as "material" when either axis
 * crosses the threshold - as required by ESRS 1 §3.4.
 *
 * Client-side only; no data leaves the browser.
 */

import { useMemo, useState } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import type { Locale } from "@/data/tools";

type Props = { locale: Locale };

type Topic = {
  id: string;
  name: string;
  esrs: string;
  /** Impact axis inputs (0-5). */
  severity: number;
  scope: number;
  irremediability: number;
  impactLikelihood: number;
  /** Financial axis inputs (0-5). */
  magnitude: number;
  financialLikelihood: number;
};

type State = {
  threshold: number; // 0..5
  topics: Topic[];
};

const uid = () => Math.random().toString(36).slice(2, 9);

/** Impact axis (0..5) = average(severity, scope, irremediability) * likelihood/5. */
const impactScore = (t: Topic) => {
  const sev = (t.severity + t.scope + t.irremediability) / 3;
  return (sev * t.impactLikelihood) / 5;
};
/** Financial axis (0..5) = magnitude * likelihood / 5. */
const financialScore = (t: Topic) => (t.magnitude * t.financialLikelihood) / 5;

const isMaterial = (t: Topic, threshold: number) =>
  impactScore(t) >= threshold || financialScore(t) >= threshold;

const DEFAULT_TOPICS: Topic[] = [
  { id: uid(), name: "Climate change mitigation", esrs: "E1", severity: 4, scope: 5, irremediability: 4, impactLikelihood: 5, magnitude: 4, financialLikelihood: 4 },
  { id: uid(), name: "Climate change adaptation", esrs: "E1", severity: 3, scope: 4, irremediability: 3, impactLikelihood: 4, magnitude: 3, financialLikelihood: 4 },
  { id: uid(), name: "Water & marine resources", esrs: "E3", severity: 3, scope: 3, irremediability: 3, impactLikelihood: 3, magnitude: 2, financialLikelihood: 2 },
  { id: uid(), name: "Biodiversity & ecosystems", esrs: "E4", severity: 3, scope: 3, irremediability: 4, impactLikelihood: 2, magnitude: 2, financialLikelihood: 2 },
  { id: uid(), name: "Circular economy", esrs: "E5", severity: 2, scope: 3, irremediability: 2, impactLikelihood: 3, magnitude: 3, financialLikelihood: 3 },
  { id: uid(), name: "Own workforce", esrs: "S1", severity: 3, scope: 4, irremediability: 2, impactLikelihood: 4, magnitude: 3, financialLikelihood: 3 },
  { id: uid(), name: "Workers in value chain", esrs: "S2", severity: 3, scope: 4, irremediability: 3, impactLikelihood: 3, magnitude: 2, financialLikelihood: 3 },
  { id: uid(), name: "Affected communities", esrs: "S3", severity: 2, scope: 3, irremediability: 2, impactLikelihood: 2, magnitude: 2, financialLikelihood: 2 },
  { id: uid(), name: "Consumers & end-users", esrs: "S4", severity: 3, scope: 3, irremediability: 2, impactLikelihood: 3, magnitude: 3, financialLikelihood: 3 },
  { id: uid(), name: "Business conduct", esrs: "G1", severity: 3, scope: 3, irremediability: 3, impactLikelihood: 3, magnitude: 4, financialLikelihood: 4 },
];

const DEFAULT_STATE: State = { threshold: 2.5, topics: DEFAULT_TOPICS };

const T = {
  en: {
    interactive: "Interactive tool",
    threshold: "Materiality threshold",
    thresholdHint: "Topics above this on either axis become material.",
    topic: "Topic",
    esrs: "ESRS",
    severity: "Severity",
    scope: "Scope",
    irremediability: "Irremediability",
    impactLikelihood: "Impact likelihood",
    magnitude: "Financial magnitude",
    financialLikelihood: "Financial likelihood",
    impact: "Impact",
    financial: "Financial",
    add: "+ Add topic",
    remove: "Remove",
    newTopicName: "New topic",
    material: "Material",
    monitor: "Monitor",
    matrix: "Materiality matrix",
    axisImpact: "Impact materiality →",
    axisFinancial: "Financial materiality →",
    materialTopics: "Material topics",
    print: "Save as PDF",
    csv: "Download CSV",
    reset: "Reset",
    reportTitle: "Double materiality assessment",
    generatedOn: "Generated on",
    disclaimer:
      "This is a screening tool. Under ESRS 1 §3 the double materiality assessment must be documented with evidence, stakeholder engagement and time horizons. Treat this scoring as a working baseline, not the final assessment.",
    sourcesNote: "Sources: ESRS 1 §3 (double materiality) · EFRAG IG1 Materiality Assessment Implementation Guidance.",
    empty: "No topics - add one below.",
    impactCol: "Impact score",
    financialCol: "Financial score",
    verdict: "Verdict",
  },
  el: {
    interactive: "Διαδραστικό εργαλείο",
    threshold: "Κατώφλι ουσιαστικότητας",
    thresholdHint: "Θέματα πάνω από το κατώφλι σε οποιονδήποτε άξονα θεωρούνται ουσιώδη.",
    topic: "Θέμα",
    esrs: "ESRS",
    severity: "Σοβαρότητα",
    scope: "Έκταση",
    irremediability: "Μη-αναστρεψιμότητα",
    impactLikelihood: "Πιθανότητα επίπτωσης",
    magnitude: "Οικονομικό μέγεθος",
    financialLikelihood: "Οικονομική πιθανότητα",
    impact: "Επίπτωση",
    financial: "Οικονομικό",
    add: "+ Προσθήκη θέματος",
    remove: "Αφαίρεση",
    newTopicName: "Νέο θέμα",
    material: "Ουσιώδες",
    monitor: "Παρακολούθηση",
    matrix: "Μήτρα ουσιαστικότητας",
    axisImpact: "Ουσιαστικότητα επιπτώσεων →",
    axisFinancial: "Οικονομική ουσιαστικότητα →",
    materialTopics: "Ουσιώδη θέματα",
    print: "Αποθήκευση PDF",
    csv: "Λήψη CSV",
    reset: "Επαναφορά",
    reportTitle: "Αξιολόγηση διπλής ουσιαστικότητας",
    generatedOn: "Δημιουργήθηκε",
    disclaimer:
      "Αυτό είναι εργαλείο προκαταρκτικού ελέγχου. Το ESRS 1 §3 απαιτεί τεκμηρίωση, εμπλοκή ενδιαφερομένων και χρονικούς ορίζοντες. Θεωρήστε το ενδεικτικό, όχι τελική αξιολόγηση.",
    sourcesNote: "Πηγές: ESRS 1 §3 · EFRAG IG1 Materiality Assessment Implementation Guidance.",
    empty: "Χωρίς θέματα - προσθέστε ένα.",
    impactCol: "Βαθμ. επίπτωσης",
    financialCol: "Βαθμ. οικον.",
    verdict: "Ετυμηγορία",
  },
} as const;

export default function DoubleMaterialityMatrix({ locale }: Props) {
  const l = T[locale];
  const [state, setState] = usePersistedState<State>("verdeiq.tool.dma", DEFAULT_STATE);
  const [selected, setSelected] = useState<string | null>(state.topics[0]?.id ?? null);

  const numLocale = locale === "el" ? "el-CY" : "en-GB";
  const fmt = (n: number, digits = 1) =>
    n.toLocaleString(numLocale, { maximumFractionDigits: digits, minimumFractionDigits: digits });

  const setTopic = (id: string, patch: Partial<Topic>) =>
    setState((s) => ({ ...s, topics: s.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  const addTopic = () => {
    const id = uid();
    setState((s) => ({
      ...s,
      topics: [
        ...s.topics,
        { id, name: l.newTopicName, esrs: "-", severity: 2, scope: 2, irremediability: 2, impactLikelihood: 2, magnitude: 2, financialLikelihood: 2 },
      ],
    }));
    setSelected(id);
  };
  const removeTopic = (id: string) => {
    setState((s) => ({ ...s, topics: s.topics.filter((t) => t.id !== id) }));
    setSelected((cur) => (cur === id ? null : cur));
  };

  const rows = useMemo(
    () =>
      state.topics
        .map((t) => ({
          ...t,
          impact: impactScore(t),
          financial: financialScore(t),
          material: isMaterial(t, state.threshold),
        }))
        .sort((a, b) => Math.max(b.impact, b.financial) - Math.max(a.impact, a.financial)),
    [state.topics, state.threshold],
  );

  const active = state.topics.find((t) => t.id === selected) ?? state.topics[0] ?? null;

  const downloadCsv = () => {
    const header = ["topic", "esrs", "severity", "scope", "irremediability", "impact_likelihood", "magnitude", "financial_likelihood", "impact_score", "financial_score", "material"].join(",");
    const lines = rows.map((r) =>
      [
        `"${r.name.replace(/"/g, '""')}"`,
        r.esrs,
        r.severity,
        r.scope,
        r.irremediability,
        r.impactLikelihood,
        r.magnitude,
        r.financialLikelihood,
        r.impact.toFixed(2),
        r.financial.toFixed(2),
        r.material ? "yes" : "no",
      ].join(","),
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verdeiq-double-materiality.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const doPrint = () => window.print();
  const reset = () => setState(DEFAULT_STATE);

  const materialCount = rows.filter((r) => r.material).length;

  /* ----- SVG matrix ----- */
  const SIZE = 520;
  const PAD = 44;
  const plotSize = SIZE - PAD * 2;
  const scale = (v: number) => PAD + (v / 5) * plotSize;
  const thrX = scale(state.threshold);
  const thrY = SIZE - scale(state.threshold);

  return (
    <div className="viq-tool not-prose border-y border-foreground/15 print:border-none">
      {/* Header */}
      <div className="border-b border-foreground/10 py-8 sm:py-10">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <label className="viq-field-label block">
              {l.threshold} <span className="tabular-nums text-foreground/60">{fmt(state.threshold, 1)} / 5</span>
            </label>
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={state.threshold}
              onChange={(e) =>
                setState((s) => ({ ...s, threshold: Number(e.target.value) }))
              }
              className="verdeiq-range mt-3 w-full max-w-md"
            />
            <p className="mt-2 max-w-md text-[12px] text-foreground/55">{l.thresholdHint}</p>
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
              onClick={reset}
              className="viq-button inline-flex h-9 items-center px-2 text-foreground/70 underline underline-offset-4 transition hover:text-foreground"
            >
              {l.reset}
            </button>
          </div>
        </div>
      </div>

      {/* Matrix + scoring */}
      <div className="grid gap-10 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        {/* Matrix */}
        <div>
          <p className="viq-section-label">
            {l.matrix}
          </p>
          <div className="mt-4 aspect-square w-full max-w-[560px]">
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full">
              {/* Quadrant shading */}
              <rect x={thrX} y={0} width={SIZE - thrX} height={thrY} className="fill-primary/10" />
              {/* Axes */}
              <line x1={PAD} y1={SIZE - PAD} x2={SIZE - PAD} y2={SIZE - PAD} className="stroke-foreground/40" />
              <line x1={PAD} y1={PAD} x2={PAD} y2={SIZE - PAD} className="stroke-foreground/40" />
              {/* Threshold lines */}
              <line x1={thrX} y1={PAD} x2={thrX} y2={SIZE - PAD} strokeDasharray="4 4" className="stroke-primary/60" />
              <line x1={PAD} y1={thrY} x2={SIZE - PAD} y2={thrY} strokeDasharray="4 4" className="stroke-primary/60" />
              {/* Gridlines */}
              {[1, 2, 3, 4].map((g) => (
                <g key={g}>
                  <line x1={scale(g)} y1={PAD} x2={scale(g)} y2={SIZE - PAD} className="stroke-foreground/10" />
                  <line x1={PAD} y1={SIZE - scale(g)} x2={SIZE - PAD} y2={SIZE - scale(g)} className="stroke-foreground/10" />
                  <text x={scale(g)} y={SIZE - PAD + 16} textAnchor="middle" className="fill-foreground/40 text-[10px] tabular-nums">
                    {g}
                  </text>
                  <text x={PAD - 8} y={SIZE - scale(g) + 3} textAnchor="end" className="fill-foreground/40 text-[10px] tabular-nums">
                    {g}
                  </text>
                </g>
              ))}
              {/* Axis labels */}
              <text x={SIZE / 2} y={SIZE - 6} textAnchor="middle" className="fill-foreground/65 text-[12px] font-semibold">
                {l.axisImpact}
              </text>
              <text x={-SIZE / 2} y={14} textAnchor="middle" transform="rotate(-90)" className="fill-foreground/65 text-[12px] font-semibold">
                {l.axisFinancial}
              </text>
              {/* Points */}
              {rows.map((r, i) => {
                const cx = scale(r.impact);
                const cy = SIZE - scale(r.financial);
                const isActive = selected === r.id;
                return (
                  <g key={r.id} className="cursor-pointer" onClick={() => setSelected(r.id)}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isActive ? 9 : 7}
                      className={r.material ? "fill-primary/90" : "fill-foreground/30"}
                      stroke="white"
                      strokeWidth={2}
                    />
                    <text
                      x={cx + 12}
                      y={cy + 4}
                      className={`text-[12px] font-semibold tabular-nums ${isActive ? "fill-foreground" : "fill-foreground/60"}`}
                    >
                      {String(i + 1).padStart(2, "0")} {r.esrs}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Scoring panel */}
        <div className="print:hidden">
          <p className="viq-section-label">
            {l.topic}
          </p>
          {active ? (
            <div className="mt-4">
              <div className="mb-4 flex flex-wrap items-baseline gap-3">
                <input
                  type="text"
                  value={active.name}
                  onChange={(e) => setTopic(active.id, { name: e.target.value })}
                  className="w-full max-w-md border-0 border-b border-foreground/25 bg-transparent pb-1 text-[22px] font-semibold tracking-[-0.02em] outline-none focus:border-primary"
                />
                <input
                  type="text"
                  value={active.esrs}
                  onChange={(e) => setTopic(active.id, { esrs: e.target.value })}
                  className="w-24 border-0 border-b border-foreground/25 bg-transparent pb-1 text-[13px] font-semibold outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => removeTopic(active.id)}
                  className="ml-auto text-[11.5px] text-foreground/55 underline underline-offset-4 hover:text-foreground"
                >
                  {l.remove}
                </button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="viq-section-label">
                    {l.impact}
                  </p>
                  <div className="mt-4 space-y-4">
                    {([
                      ["severity", l.severity],
                      ["scope", l.scope],
                      ["irremediability", l.irremediability],
                      ["impactLikelihood", l.impactLikelihood],
                    ] as const).map(([k, lab]) => (
                      <div key={k}>
                        <div className="mb-1.5 flex items-baseline justify-between text-[12.5px]">
                          <label className="text-foreground/75">{lab}</label>
                          <span className="tabular-nums text-foreground/60">{active[k]} / 5</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={5}
                          step={1}
                          value={active[k]}
                          onChange={(e) => setTopic(active.id, { [k]: Number(e.target.value) } as Partial<Topic>)}
                          className="verdeiq-range"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="viq-section-label">
                    {l.financial}
                  </p>
                  <div className="mt-4 space-y-4">
                    {([
                      ["magnitude", l.magnitude],
                      ["financialLikelihood", l.financialLikelihood],
                    ] as const).map(([k, lab]) => (
                      <div key={k}>
                        <div className="mb-1.5 flex items-baseline justify-between text-[12.5px]">
                          <label className="text-foreground/75">{lab}</label>
                          <span className="tabular-nums text-foreground/60">{active[k]} / 5</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={5}
                          step={1}
                          value={active[k]}
                          onChange={(e) => setTopic(active.id, { [k]: Number(e.target.value) } as Partial<Topic>)}
                          className="verdeiq-range"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-6 border-t border-foreground/10 pt-5 text-[13px]">
                <div>
                  <p className="viq-caption">{l.impact}</p>
                  <p className="mt-1 text-[22px] font-semibold tabular-nums tracking-[-0.02em]">
                    {fmt(impactScore(active), 2)}
                  </p>
                </div>
                <div>
                  <p className="viq-caption">{l.financial}</p>
                  <p className="mt-1 text-[22px] font-semibold tabular-nums tracking-[-0.02em]">
                    {fmt(financialScore(active), 2)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-foreground/55">{l.empty}</p>
          )}

          <button
            type="button"
            onClick={addTopic}
            className="viq-button mt-8 inline-flex h-9 items-center border border-foreground/25 px-4 text-foreground transition hover:border-foreground"
          >
            {l.add}
          </button>
        </div>
      </div>

      {/* Topic list / material verdict */}
      <div className="border-t border-foreground/10 py-8 sm:py-10">
        <div className="mb-6 flex items-baseline justify-between">
            <p className="viq-section-label">
            {l.materialTopics}
          </p>
          <p className="viq-meta tabular-nums">
            {materialCount}/{rows.length}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-foreground/20 text-left text-foreground/65">
                <th className="py-2 pr-3 viq-table-heading">#</th>
                <th className="py-2 pr-3 viq-table-heading">{l.topic}</th>
                <th className="py-2 pr-3 viq-table-heading">{l.esrs}</th>
                <th className="py-2 pr-3 text-right viq-table-heading">{l.impactCol}</th>
                <th className="py-2 pr-3 text-right viq-table-heading">{l.financialCol}</th>
                <th className="py-2 text-right viq-table-heading">{l.verdict}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  className={`cursor-pointer border-b border-foreground/10 ${selected === r.id ? "bg-foreground/5" : ""}`}
                >
                  <td className="py-2 pr-3 tabular-nums text-foreground/50">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="py-2 pr-3 font-medium">{r.name}</td>
                  <td className="py-2 pr-3 font-semibold text-foreground/70">{r.esrs}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmt(r.impact, 2)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmt(r.financial, 2)}</td>
                  <td className="py-2 text-right">
                    <span
                      className={`inline-block border px-2 py-0.5 text-[12px] font-semibold ${
                        r.material
                          ? "border-primary/70 text-primary"
                          : "border-foreground/20 text-foreground/50"
                      }`}
                    >
                      {r.material ? l.material : l.monitor}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-[11.5px] leading-[1.6] text-foreground/50">{l.disclaimer}</p>
        <p className="viq-print-note mt-3 hidden print:block">
          {l.reportTitle} · {l.generatedOn} {new Date().toLocaleDateString(numLocale)}
        </p>
      </div>
    </div>
  );
}
