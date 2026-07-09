"use client";

/**
 * VerdeIQ CBAM Report Generator — quarterly declaration draft.
 *
 * Aggregates in-scope imports by CN code, applies default (or user-entered)
 * embedded emission factors and produces a printable PDF, CSV and an
 * XML skeleton aligned with the Transitional Registry data model.
 *
 * Not an official submission tool. Draft only — validate in the
 * Transitional CBAM Registry before filing.
 */

import { useMemo, useState } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import type { Locale } from "@/data/tools";
import {
  CN_CODES,
  CBAM_COUNTRIES,
  SECTOR_META,
  type CnCode,
} from "@/data/tools/cbam-cn-codes";

type Props = { locale: Locale };

type Line = {
  id: string;
  cn: string;
  country: string;
  quantity: number; // tonnes (MWh for electricity)
  directOverride: string; // empty → use default
  indirectOverride: string; // empty → use default
  carbonPricePaid: string; // EUR / tCO2e paid abroad, if any
};

type State = {
  quarter: 1 | 2 | 3 | 4;
  year: number;
  importerName: string;
  importerEori: string;
  lines: Line[];
};

const QUARTERS: Array<{ q: 1 | 2 | 3 | 4; label: string }> = [
  { q: 1, label: "Q1 (Jan–Mar)" },
  { q: 2, label: "Q2 (Apr–Jun)" },
  { q: 3, label: "Q3 (Jul–Sep)" },
  { q: 4, label: "Q4 (Oct–Dec)" },
];

const uid = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_STATE: State = {
  quarter: (Math.floor(new Date().getMonth() / 3) + 1) as 1 | 2 | 3 | 4,
  year: new Date().getFullYear(),
  importerName: "",
  importerEori: "",
  lines: [
    { id: uid(), cn: "7208", country: "TR", quantity: 500, directOverride: "", indirectOverride: "", carbonPricePaid: "" },
    { id: uid(), cn: "7601", country: "CN", quantity: 120, directOverride: "", indirectOverride: "", carbonPricePaid: "" },
    { id: uid(), cn: "2523 29 00", country: "EG", quantity: 800, directOverride: "", indirectOverride: "", carbonPricePaid: "" },
  ],
};

const T = {
  en: {
    interactive: "Interactive tool",
    quarter: "Reporting quarter",
    year: "Reporting year",
    importerName: "Reporting declarant",
    importerNameHint: "Name (as registered)",
    importerEori: "EORI number",
    importerEoriHint: "EU EORI identifier (e.g. CY123456789012345)",
    goods: "Goods",
    cn: "CN code",
    country: "Country of origin",
    quantity: "Quantity",
    quantityUnit: "t (MWh for electricity)",
    directFactor: "Direct EF (tCO₂e/t)",
    indirectFactor: "Indirect EF (tCO₂e/t)",
    default: "default",
    carbonPrice: "Carbon price paid (€/tCO₂e)",
    lineTotal: "Embedded emissions",
    addRow: "+ Add row",
    remove: "Remove",
    totals: "Report totals",
    totalGoods: "Total goods declared",
    totalDirect: "Direct embedded emissions",
    totalIndirect: "Indirect embedded emissions",
    totalEmbedded: "Total embedded emissions",
    totalPaid: "Effective carbon price paid",
    downloadCsv: "Download CSV",
    downloadXml: "Download XML draft",
    print: "Save as PDF",
    reset: "Reset",
    reportTitle: "CBAM quarterly report draft",
    generatedOn: "Generated on",
    disclaimer:
      "Draft only. Default embedded-emission values are applicable during the transitional period; from January 2026 you must use actual verified data. Validate in the CBAM Transitional Registry before submitting.",
    sourcesNote: "Sources: Commission Regulation (EU) 2023/956 · Annex I default values (DG TAXUD, 2024).",
    perLine: "Line breakdown",
    sector: "Sector",
    tCO2e: "tCO₂e",
    tonnes: "t",
    breakdownBySector: "Breakdown by sector",
    linesRequired: "Add at least one goods line to see totals.",
  },
  el: {
    interactive: "Διαδραστικό εργαλείο",
    quarter: "Τρίμηνο αναφοράς",
    year: "Έτος αναφοράς",
    importerName: "Αναφέρων εισαγωγέας",
    importerNameHint: "Όνομα (όπως έχει καταχωρηθεί)",
    importerEori: "Αριθμός EORI",
    importerEoriHint: "π.χ. CY123456789012345",
    goods: "Εμπορεύματα",
    cn: "CN κωδικός",
    country: "Χώρα προέλευσης",
    quantity: "Ποσότητα",
    quantityUnit: "t (MWh για ηλεκτρισμό)",
    directFactor: "Άμεσος EF (tCO₂e/t)",
    indirectFactor: "Έμμεσος EF (tCO₂e/t)",
    default: "προεπιλογή",
    carbonPrice: "Τιμή άνθρακα (€/tCO₂e)",
    lineTotal: "Ενσωμ. εκπομπές",
    addRow: "+ Προσθήκη γραμμής",
    remove: "Αφαίρεση",
    totals: "Σύνολα αναφοράς",
    totalGoods: "Συνολικά εμπορεύματα",
    totalDirect: "Άμεσες ενσωματωμένες εκπομπές",
    totalIndirect: "Έμμεσες ενσωματωμένες εκπομπές",
    totalEmbedded: "Σύνολο ενσωματωμένων εκπομπών",
    totalPaid: "Τιμή άνθρακα που καταβλήθηκε",
    downloadCsv: "Λήψη CSV",
    downloadXml: "Λήψη XML",
    print: "Αποθήκευση PDF",
    reset: "Επαναφορά",
    reportTitle: "Προσχέδιο τριμηνιαίας αναφοράς CBAM",
    generatedOn: "Δημιουργήθηκε",
    disclaimer:
      "Μόνο προσχέδιο. Οι προεπιλεγμένες τιμές ισχύουν μόνο για τη μεταβατική περίοδο· από τον Ιανουάριο 2026 απαιτούνται πραγματικά επαληθευμένα δεδομένα.",
    sourcesNote: "Πηγές: Κανονισμός (ΕΕ) 2023/956 · Annex I default values (DG TAXUD, 2024).",
    perLine: "Ανάλυση γραμμών",
    sector: "Τομέας",
    tCO2e: "tCO₂e",
    tonnes: "t",
    breakdownBySector: "Ανάλυση ανά τομέα",
    linesRequired: "Προσθέστε τουλάχιστον μία γραμμή για να δείτε σύνολα.",
  },
} as const;

const findCn = (code: string): CnCode | undefined => CN_CODES.find((c) => c.code === code);

export default function CbamReportGenerator({ locale }: Props) {
  const l = T[locale];
  const [state, setState] = usePersistedState<State>("verdeiq.tool.cbam", DEFAULT_STATE);

  const set = <K extends keyof State>(key: K, val: State[K]) =>
    setState((s) => ({ ...s, [key]: val }));

  const setLine = (id: string, patch: Partial<Line>) =>
    setState((s) => ({
      ...s,
      lines: s.lines.map((ln) => (ln.id === id ? { ...ln, ...patch } : ln)),
    }));
  const addLine = () =>
    setState((s) => ({
      ...s,
      lines: [
        ...s.lines,
        { id: uid(), cn: CN_CODES[0]!.code, country: "CN", quantity: 0, directOverride: "", indirectOverride: "", carbonPricePaid: "" },
      ],
    }));
  const removeLine = (id: string) =>
    setState((s) => ({ ...s, lines: s.lines.filter((ln) => ln.id !== id) }));

  const numLocale = locale === "el" ? "el-CY" : "en-GB";
  const fmt = (n: number, digits = 2) =>
    n.toLocaleString(numLocale, { maximumFractionDigits: digits, minimumFractionDigits: digits });

  const enriched = useMemo(() => {
    return state.lines.map((ln) => {
      const cn = findCn(ln.cn);
      const dEF = ln.directOverride !== "" ? Number(ln.directOverride) : cn?.defaultDirect ?? 0;
      const iEF = ln.indirectOverride !== "" ? Number(ln.indirectOverride) : cn?.defaultIndirect ?? 0;
      const direct = ln.quantity * dEF;
      const indirect = ln.quantity * iEF;
      const embedded = direct + indirect;
      const paid = Number(ln.carbonPricePaid || 0) * embedded;
      return { ...ln, cnInfo: cn, dEF, iEF, direct, indirect, embedded, paid };
    });
  }, [state.lines]);

  const totals = useMemo(() => {
    return enriched.reduce(
      (acc, r) => ({
        goods: acc.goods + r.quantity,
        direct: acc.direct + r.direct,
        indirect: acc.indirect + r.indirect,
        embedded: acc.embedded + r.embedded,
        paid: acc.paid + r.paid,
      }),
      { goods: 0, direct: 0, indirect: 0, embedded: 0, paid: 0 },
    );
  }, [enriched]);

  const sectorBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of enriched) {
      if (!r.cnInfo) continue;
      map.set(r.cnInfo.sector, (map.get(r.cnInfo.sector) ?? 0) + r.embedded);
    }
    return Array.from(map.entries())
      .map(([k, v]) => ({
        sector: k as keyof typeof SECTOR_META,
        emissions: v,
        pct: totals.embedded > 0 ? (v / totals.embedded) * 100 : 0,
      }))
      .sort((a, b) => b.emissions - a.emissions);
  }, [enriched, totals.embedded]);

  const downloadCsv = () => {
    const header = [
      "cn_code",
      "sector",
      "country",
      "quantity_t",
      "direct_ef",
      "indirect_ef",
      "direct_tco2e",
      "indirect_tco2e",
      "embedded_tco2e",
      "carbon_price_paid_eur_per_t",
      "carbon_price_paid_eur",
    ].join(",");
    const rows = enriched.map((r) =>
      [
        r.cn,
        r.cnInfo?.sector ?? "",
        r.country,
        r.quantity,
        r.dEF,
        r.iEF,
        r.direct.toFixed(4),
        r.indirect.toFixed(4),
        r.embedded.toFixed(4),
        r.carbonPricePaid || 0,
        r.paid.toFixed(2),
      ].join(","),
    );
    rows.push(
      `,,,${totals.goods},,,${totals.direct.toFixed(4)},${totals.indirect.toFixed(4)},${totals.embedded.toFixed(4)},,${totals.paid.toFixed(2)}`,
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verdeiq-cbam-${state.year}-Q${state.quarter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadXml = () => {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const lines = enriched
      .map(
        (r) => `    <goodsImport>
      <cnCode>${esc(r.cn)}</cnCode>
      <sector>${esc(r.cnInfo?.sector ?? "")}</sector>
      <countryOfOrigin>${esc(r.country)}</countryOfOrigin>
      <quantity unit="t">${r.quantity}</quantity>
      <directEmissionsFactor>${r.dEF}</directEmissionsFactor>
      <indirectEmissionsFactor>${r.iEF}</indirectEmissionsFactor>
      <embeddedDirect unit="tCO2e">${r.direct.toFixed(4)}</embeddedDirect>
      <embeddedIndirect unit="tCO2e">${r.indirect.toFixed(4)}</embeddedIndirect>
      <carbonPricePaid unit="EUR">${r.paid.toFixed(2)}</carbonPricePaid>
    </goodsImport>`,
      )
      .join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<cbamQuarterlyReport xmlns="urn:eu:cbam:quarterly:draft:v1">
  <reportingPeriod>
    <year>${state.year}</year>
    <quarter>${state.quarter}</quarter>
  </reportingPeriod>
  <reportingDeclarant>
    <name>${esc(state.importerName)}</name>
    <eori>${esc(state.importerEori)}</eori>
  </reportingDeclarant>
  <goods>
${lines}
  </goods>
  <totals>
    <totalGoods unit="t">${totals.goods}</totalGoods>
    <totalDirect unit="tCO2e">${totals.direct.toFixed(4)}</totalDirect>
    <totalIndirect unit="tCO2e">${totals.indirect.toFixed(4)}</totalIndirect>
    <totalEmbedded unit="tCO2e">${totals.embedded.toFixed(4)}</totalEmbedded>
    <totalCarbonPricePaid unit="EUR">${totals.paid.toFixed(2)}</totalCarbonPricePaid>
  </totals>
  <disclaimer>Draft generated by VerdeIQ CBAM Report Generator — not an official submission.</disclaimer>
</cbamQuarterlyReport>`;
    const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verdeiq-cbam-${state.year}-Q${state.quarter}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doPrint = () => window.print();
  const reset = () => setState(DEFAULT_STATE);

  return (
    <div className="viq-tool not-prose border-y border-foreground/15 print:border-none">
      {/* Header + controls */}
      <div className="border-b border-foreground/10 py-8 sm:py-10">
        <div className="flex flex-wrap items-baseline justify-end gap-4">
          <p className="viq-meta max-w-2xl print:hidden sm:text-right">
            {l.sourcesNote}
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <div>
            <label className="viq-field-label block">
              {l.quarter}
            </label>
            <select
              value={state.quarter}
              onChange={(e) => set("quarter", Number(e.target.value) as 1 | 2 | 3 | 4)}
              className="mt-2 w-full border-0 border-b border-foreground/25 bg-transparent pb-1 text-[16px] font-medium tracking-[-0.005em] outline-none focus:border-primary"
            >
              {QUARTERS.map((q) => (
                <option key={q.q} value={q.q}>
                  {q.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="viq-field-label block">
              {l.year}
            </label>
            <input
              type="number"
              value={state.year}
              min={2023}
              max={2035}
              onChange={(e) => set("year", Number(e.target.value))}
              className="mt-2 w-32 border-0 border-b border-foreground/25 bg-transparent pb-1 text-[22px] font-semibold tabular-nums tracking-[-0.02em] outline-none focus:border-primary"
            />
          </div>
          <div className="lg:col-span-1">
            <label className="viq-field-label block">
              {l.importerName}
            </label>
            <input
              type="text"
              value={state.importerName}
              placeholder={l.importerNameHint}
              onChange={(e) => set("importerName", e.target.value)}
              className="mt-2 w-full border-0 border-b border-foreground/25 bg-transparent pb-1 text-[14px] tracking-[-0.005em] outline-none placeholder:text-foreground/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="viq-field-label block">
              {l.importerEori}
            </label>
            <input
              type="text"
              value={state.importerEori}
              placeholder={l.importerEoriHint}
              onChange={(e) => set("importerEori", e.target.value.toUpperCase())}
              className="mt-2 w-full border-0 border-b border-foreground/25 bg-transparent pb-1 text-[14px] tabular-nums tracking-[-0.005em] outline-none placeholder:text-foreground/30 focus:border-primary"
            />
          </div>
        </div>

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
            onClick={downloadXml}
              className="viq-button inline-flex h-9 items-center border border-foreground/25 px-4 text-foreground transition hover:border-foreground"
          >
            {l.downloadXml}
          </button>
          <button
            type="button"
            onClick={downloadCsv}
              className="viq-button inline-flex h-9 items-center border border-foreground/25 px-4 text-foreground transition hover:border-foreground"
          >
            {l.downloadCsv}
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

      {/* Goods table */}
      <div className="border-b border-foreground/10 py-8 sm:py-10">
          <p className="viq-section-label">
          {l.goods}
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-foreground/20 text-left text-foreground/65">
                <th className="py-2 pr-3 viq-table-heading">{l.cn}</th>
                <th className="py-2 pr-3 viq-table-heading">{l.country}</th>
                <th className="py-2 pr-3 text-right viq-table-heading">{l.quantity}</th>
                <th className="py-2 pr-3 text-right viq-table-heading">{l.directFactor}</th>
                <th className="py-2 pr-3 text-right viq-table-heading">{l.indirectFactor}</th>
                <th className="py-2 pr-3 text-right viq-table-heading">{l.carbonPrice}</th>
                <th className="py-2 pr-3 text-right viq-table-heading">{l.lineTotal}</th>
                <th className="py-2 text-right viq-table-heading print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((r) => (
                <tr key={r.id} className="border-b border-foreground/10 align-top">
                  <td className="py-3 pr-3">
                    <select
                      value={r.cn}
                      onChange={(e) => setLine(r.id, { cn: e.target.value })}
                      className="w-full min-w-[220px] border-0 border-b border-transparent bg-transparent pb-0.5 text-[12.5px] tabular-nums outline-none hover:border-foreground/25 focus:border-primary"
                    >
                      {CN_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.description}
                        </option>
                      ))}
                    </select>
                    <p className="viq-caption mt-1">
                      {r.cnInfo ? SECTOR_META[r.cnInfo.sector][locale] : "—"}
                    </p>
                  </td>
                  <td className="py-3 pr-3">
                    <select
                      value={r.country}
                      onChange={(e) => setLine(r.id, { country: e.target.value })}
                      className="w-full min-w-[140px] border-0 border-b border-transparent bg-transparent pb-0.5 text-[12.5px] outline-none hover:border-foreground/25 focus:border-primary"
                    >
                      {CBAM_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} · {c[locale]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={r.quantity}
                      onChange={(e) => setLine(r.id, { quantity: Number(e.target.value) })}
                      className="w-24 border-0 border-b border-foreground/20 bg-transparent pb-0.5 text-right text-[12.5px] tabular-nums outline-none focus:border-primary"
                    />
                    <p className="viq-numeric-note mt-1 text-right tabular-nums">
                      {l.tonnes}
                    </p>
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      type="number"
                      min={0}
                      step={0.001}
                      placeholder={String(r.cnInfo?.defaultDirect ?? 0)}
                      value={r.directOverride}
                      onChange={(e) => setLine(r.id, { directOverride: e.target.value })}
                      className="w-24 border-0 border-b border-foreground/20 bg-transparent pb-0.5 text-right text-[12.5px] tabular-nums outline-none placeholder:text-foreground/30 focus:border-primary"
                    />
                    <p className="viq-numeric-note mt-1 text-right tabular-nums">
                      {r.directOverride === "" ? l.default : "override"}
                    </p>
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      type="number"
                      min={0}
                      step={0.001}
                      placeholder={String(r.cnInfo?.defaultIndirect ?? 0)}
                      value={r.indirectOverride}
                      onChange={(e) => setLine(r.id, { indirectOverride: e.target.value })}
                      className="w-24 border-0 border-b border-foreground/20 bg-transparent pb-0.5 text-right text-[12.5px] tabular-nums outline-none placeholder:text-foreground/30 focus:border-primary"
                    />
                    <p className="viq-numeric-note mt-1 text-right tabular-nums">
                      {r.directOverride === "" && r.indirectOverride === "" ? l.default : "override"}
                    </p>
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      value={r.carbonPricePaid}
                      onChange={(e) => setLine(r.id, { carbonPricePaid: e.target.value })}
                      className="w-24 border-0 border-b border-foreground/20 bg-transparent pb-0.5 text-right text-[12.5px] tabular-nums outline-none placeholder:text-foreground/30 focus:border-primary"
                    />
                  </td>
                  <td className="py-3 pr-3 text-right tabular-nums text-[13px] font-medium">
                    {fmt(r.embedded)} {l.tCO2e}
                  </td>
                  <td className="py-3 text-right print:hidden">
                    <button
                      type="button"
                      onClick={() => removeLine(r.id)}
                      className="viq-button-sm text-foreground/65 underline underline-offset-4 hover:text-foreground"
                    >
                      {l.remove}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {enriched.length === 0 && (
          <p className="mt-4 text-[13px] text-foreground/55">{l.linesRequired}</p>
        )}

        <button
          type="button"
          onClick={addLine}
          className="viq-button mt-6 inline-flex h-9 items-center border border-foreground/25 px-4 text-foreground transition hover:border-foreground print:hidden"
        >
          {l.addRow}
        </button>
      </div>

      {/* Totals */}
      <div className="grid gap-10 py-8 sm:py-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-14">
        <div>
          <p className="viq-section-label">
            {l.breakdownBySector}
          </p>
          <div className="mt-6 space-y-5">
            {sectorBreakdown.length === 0 && (
              <p className="text-[13px] text-foreground/50">—</p>
            )}
            {sectorBreakdown.map((b, i) => (
              <div key={b.sector}>
                <div className="mb-1.5 grid grid-cols-[28px_minmax(0,1fr)_auto] items-baseline gap-3 text-[13px]">
                  <span className="viq-minor-code tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-foreground/85">{SECTOR_META[b.sector][locale]}</span>
                  <span className="tabular-nums text-foreground/60">
                    {fmt(b.emissions, 1)} {l.tCO2e} · {b.pct.toFixed(0)}%
                  </span>
                </div>
                <div className="ml-[40px] h-[2px] w-[calc(100%-40px)] overflow-hidden bg-foreground/10">
                  <div
                    className="h-full bg-foreground/80 transition-[width] duration-300"
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-l border-foreground/10 pl-8 sm:pl-10 print:border-none print:pl-0">
          <p className="viq-section-label">
            {l.totals} <span className="tabular-nums text-foreground/60">{state.year} Q{state.quarter}</span>
          </p>
          <p className="mt-3 text-[48px] font-semibold leading-none tabular-nums tracking-[-0.03em] sm:text-[64px]">
            {fmt(totals.embedded, 1)}
          </p>
          <p className="viq-meta mt-2">
            {l.totalEmbedded} · {l.tCO2e}
          </p>

          <dl className="mt-8 divide-y divide-foreground/10 border-y border-foreground/15 text-[13px]">
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-foreground/65">{l.totalGoods}</dt>
              <dd className="tabular-nums font-medium">{fmt(totals.goods, 0)} {l.tonnes}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-foreground/65">{l.totalDirect}</dt>
              <dd className="tabular-nums font-medium">{fmt(totals.direct, 1)} {l.tCO2e}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-foreground/65">{l.totalIndirect}</dt>
              <dd className="tabular-nums font-medium">{fmt(totals.indirect, 1)} {l.tCO2e}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-foreground/65">{l.totalPaid}</dt>
              <dd className="tabular-nums font-medium">€ {fmt(totals.paid, 0)}</dd>
            </div>
          </dl>

          <p className="mt-6 text-[11.5px] leading-[1.6] text-foreground/50">
            {l.disclaimer}
          </p>
          <p className="viq-print-note mt-3 hidden print:block">
            {l.reportTitle} · {l.generatedOn} {new Date().toLocaleDateString(numLocale)}
          </p>
        </div>
      </div>
    </div>
  );
}
