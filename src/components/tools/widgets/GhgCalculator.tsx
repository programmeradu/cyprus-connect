"use client";

/**
 * Vuneli GHG Calculator - Scope 1 / 2 / 3 emissions estimator.
 *
 * Not audit-grade. Uses published 2024 factors from DEFRA, IEA and EEA
 * (see /tools/ghg-calculator methodology block). All calculations are
 * client-side, no network calls, no data leaves the browser.
 */

import { useMemo, useState } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import type { Locale } from "@/data/tools";

type Props = {
  locale: Locale;
  /** Pre-select a country/region for programmatic per-country pages. */
  initialRegion?: Region;
  /** When true, hide the region selector (country page has already chosen it). */
  lockRegion?: boolean;
  /** Override localStorage key so per-country pages don't collide. */
  storageKey?: string;
};

/* ---------- Emission factors (kg CO2e per unit) ---------- */

const SCOPE1 = {
  naturalGas_kWh: 0.184, // DEFRA 2024 natural gas - kWh gross CV
  diesel_L: 2.51, // DEFRA 2024 mobile combustion - diesel avg
  petrol_L: 2.31, // DEFRA 2024 mobile combustion - petrol avg
  lpg_kg: 2.94, // DEFRA 2024 LPG
} as const;

const SCOPE3 = {
  car_km: 0.170, // DEFRA 2024 avg passenger car (well-to-wheel)
  shortHaulFlight_km: 0.246, // DEFRA 2024 short-haul economy incl. RF
  longHaulFlight_km: 0.195, // DEFRA 2024 long-haul economy incl. RF
  commute_km: 0.140, // DEFRA 2024 mixed-mode commuting proxy
  spend_EUR: 0.35, // EEIO screening avg (indicative)
  waste_kg: 0.467, // DEFRA 2024 mixed municipal to landfill
  water_m3: 0.344, // DEFRA 2024 water supply + treatment combined
} as const;

/* Location-based grid factors (kg CO2e / kWh) - 2023 EEA / national inventories */
const GRID_FACTORS = {
  EU27: 0.253,
  CY: 0.622,
  GR: 0.371,
  DE: 0.381,
  FR: 0.056,
  ES: 0.174,
  IT: 0.257,
  NL: 0.328,
  IE: 0.296,
  PT: 0.158,
  BE: 0.148,
  AT: 0.114,
  SE: 0.008,
  FI: 0.079,
  PL: 0.657,
  UK: 0.207,
} as const;

type Region = keyof typeof GRID_FACTORS;

const REGION_LABELS: Record<Region, { en: string; el: string }> = {
  EU27: { en: "EU-27 average", el: "Μέσος όρος ΕΕ-27" },
  CY: { en: "Cyprus", el: "Κύπρος" },
  GR: { en: "Greece", el: "Ελλάδα" },
  DE: { en: "Germany", el: "Γερμανία" },
  FR: { en: "France", el: "Γαλλία" },
  ES: { en: "Spain", el: "Ισπανία" },
  IT: { en: "Italy", el: "Ιταλία" },
  NL: { en: "Netherlands", el: "Ολλανδία" },
  IE: { en: "Ireland", el: "Ιρλανδία" },
  PT: { en: "Portugal", el: "Πορτογαλία" },
  BE: { en: "Belgium", el: "Βέλγιο" },
  AT: { en: "Austria", el: "Αυστρία" },
  SE: { en: "Sweden", el: "Σουηδία" },
  FI: { en: "Finland", el: "Φινλανδία" },
  PL: { en: "Poland", el: "Πολωνία" },
  UK: { en: "United Kingdom", el: "Ηνωμένο Βασίλειο" },
};

/* ---------- Localised copy ---------- */

const t = {
  en: {
    reportingYear: "Reporting year",
    region: "Country / grid",
    scope1: "Scope 1 · Direct combustion",
    scope2: "Scope 2 · Purchased energy",
    scope3: "Scope 3 · Value chain",
    naturalGas: "Natural gas (kWh / yr)",
    diesel: "Diesel - fleet, generators (L / yr)",
    petrol: "Petrol (L / yr)",
    lpg: "LPG (kg / yr)",
    electricity: "Grid electricity (kWh / yr)",
    car: "Business travel by car (km / yr)",
    shortHaul: "Short-haul flights (km / yr, <3700 km)",
    longHaul: "Long-haul flights (km / yr, ≥3700 km)",
    commute: "Employee commuting (km / yr, total)",
    spend: "Purchased goods & services (€ / yr)",
    waste: "Waste to landfill (kg / yr)",
    water: "Water supply (m³ / yr)",
    total: "Total footprint",
    unit: "tCO₂e / yr",
    breakdown: "Breakdown by scope",
    downloadCsv: "Download CSV",
    print: "Save as PDF",
    reset: "Reset",
    reportTitle: "GHG emissions report",
    factorNote: "Factors: DEFRA 2024 (Scope 1 & 3), national inventories via EEA 2023 (Scope 2 grid).",
    disclaimer:
      "Indicative estimate for planning and screening only. Replace with metered activity data and audited factors before reporting under CSRD, VSME or SBTi.",
    generatedOn: "Generated on",
    category: "Category",
    activity: "Activity",
    factor: "Factor",
    emissions: "tCO₂e",
  },
  el: {
    reportingYear: "Έτος αναφοράς",
    region: "Χώρα / δίκτυο",
    scope1: "Scope 1 · Άμεση καύση",
    scope2: "Scope 2 · Αγορασμένη ενέργεια",
    scope3: "Scope 3 · Αλυσίδα αξίας",
    naturalGas: "Φυσικό αέριο (kWh / έτος)",
    diesel: "Πετρέλαιο - στόλος, γεννήτριες (L / έτος)",
    petrol: "Βενζίνη (L / έτος)",
    lpg: "LPG (kg / έτος)",
    electricity: "Ηλεκτρισμός δικτύου (kWh / έτος)",
    car: "Επαγγελματικά ταξίδια με αυτοκίνητο (km / έτος)",
    shortHaul: "Πτήσεις μικρής απόστασης (km / έτος, <3700 km)",
    longHaul: "Πτήσεις μεγάλης απόστασης (km / έτος, ≥3700 km)",
    commute: "Μετακινήσεις προσωπικού (km / έτος, σύνολο)",
    spend: "Αγορές αγαθών & υπηρεσιών (€ / έτος)",
    waste: "Απόβλητα προς χωματερή (kg / έτος)",
    water: "Παροχή νερού (m³ / έτος)",
    total: "Συνολικό αποτύπωμα",
    unit: "tCO₂e / έτος",
    breakdown: "Ανάλυση ανά scope",
    downloadCsv: "Λήψη CSV",
    print: "Αποθήκευση PDF",
    reset: "Επαναφορά",
    reportTitle: "Αναφορά εκπομπών GHG",
    factorNote: "Συντελεστές: DEFRA 2024 (Scope 1 & 3), εθνικά μητρώα μέσω EEA 2023 (Scope 2 δίκτυο).",
    disclaimer:
      "Ενδεικτική εκτίμηση μόνο για σχεδιασμό και προκαταρκτικό έλεγχο. Αντικαταστήστε με μετρημένα δεδομένα και ελεγμένους συντελεστές πριν την αναφορά υπό CSRD, VSME ή SBTi.",
    generatedOn: "Δημιουργήθηκε",
    category: "Κατηγορία",
    activity: "Δραστηριότητα",
    factor: "Συντελεστής",
    emissions: "tCO₂e",
  },
} as const;

/* ---------- Component ---------- */

type State = {
  year: number;
  region: Region;
  gas: number;
  diesel: number;
  petrol: number;
  lpg: number;
  elec: number;
  car: number;
  shortHaul: number;
  longHaul: number;
  commute: number;
  spend: number;
  waste: number;
  water: number;
};

const DEFAULT_STATE: State = {
  year: new Date().getFullYear(),
  region: "EU27",
  gas: 80000,
  diesel: 4000,
  petrol: 1000,
  lpg: 0,
  elec: 120000,
  car: 25000,
  shortHaul: 15000,
  longHaul: 0,
  commute: 60000,
  spend: 400000,
  waste: 5000,
  water: 800,
};

export default function GhgCalculator({ locale, initialRegion, lockRegion, storageKey }: Props) {
  const l = t[locale];
  const seed: State = initialRegion ? { ...DEFAULT_STATE, region: initialRegion } : DEFAULT_STATE;
  const [state, setState] = usePersistedState<State>(storageKey ?? "vuneli.tool.ghg", seed);
  const [tab, setTab] = useState<"scope1" | "scope2" | "scope3">("scope1");

  const set = <K extends keyof State>(key: K, val: State[K]) =>
    setState((s) => ({ ...s, [key]: val }));

  const gridFactor = GRID_FACTORS[state.region];

  const rows = useMemo(() => {
    return [
      { scope: 1 as const, key: "naturalGas", label: l.naturalGas, value: state.gas, factor: SCOPE1.naturalGas_kWh, unit: "kWh" },
      { scope: 1 as const, key: "diesel", label: l.diesel, value: state.diesel, factor: SCOPE1.diesel_L, unit: "L" },
      { scope: 1 as const, key: "petrol", label: l.petrol, value: state.petrol, factor: SCOPE1.petrol_L, unit: "L" },
      { scope: 1 as const, key: "lpg", label: l.lpg, value: state.lpg, factor: SCOPE1.lpg_kg, unit: "kg" },
      { scope: 2 as const, key: "electricity", label: l.electricity, value: state.elec, factor: gridFactor, unit: "kWh" },
      { scope: 3 as const, key: "car", label: l.car, value: state.car, factor: SCOPE3.car_km, unit: "km" },
      { scope: 3 as const, key: "shortHaul", label: l.shortHaul, value: state.shortHaul, factor: SCOPE3.shortHaulFlight_km, unit: "km" },
      { scope: 3 as const, key: "longHaul", label: l.longHaul, value: state.longHaul, factor: SCOPE3.longHaulFlight_km, unit: "km" },
      { scope: 3 as const, key: "commute", label: l.commute, value: state.commute, factor: SCOPE3.commute_km, unit: "km" },
      { scope: 3 as const, key: "spend", label: l.spend, value: state.spend, factor: SCOPE3.spend_EUR, unit: "EUR" },
      { scope: 3 as const, key: "waste", label: l.waste, value: state.waste, factor: SCOPE3.waste_kg, unit: "kg" },
      { scope: 3 as const, key: "water", label: l.water, value: state.water, factor: SCOPE3.water_m3, unit: "m³" },
    ].map((r) => ({ ...r, tonnes: (r.value * r.factor) / 1000 }));
  }, [state, gridFactor, l]);

  const totals = useMemo(() => {
    const s1 = rows.filter((r) => r.scope === 1).reduce((a, r) => a + r.tonnes, 0);
    const s2 = rows.filter((r) => r.scope === 2).reduce((a, r) => a + r.tonnes, 0);
    const s3 = rows.filter((r) => r.scope === 3).reduce((a, r) => a + r.tonnes, 0);
    return { s1, s2, s3, total: s1 + s2 + s3 };
  }, [rows]);

  const pct = (v: number) => (totals.total > 0 ? (v / totals.total) * 100 : 0);

  /* ---------- Inputs by tab ---------- */

  const scope1Fields: Array<{ label: string; key: keyof State; max: number; step: number }> = [
    { label: l.naturalGas, key: "gas", max: 1000000, step: 1000 },
    { label: l.diesel, key: "diesel", max: 100000, step: 100 },
    { label: l.petrol, key: "petrol", max: 100000, step: 100 },
    { label: l.lpg, key: "lpg", max: 50000, step: 50 },
  ];
  const scope2Fields: Array<{ label: string; key: keyof State; max: number; step: number }> = [
    { label: l.electricity, key: "elec", max: 5000000, step: 1000 },
  ];
  const scope3Fields: Array<{ label: string; key: keyof State; max: number; step: number }> = [
    { label: l.car, key: "car", max: 500000, step: 500 },
    { label: l.shortHaul, key: "shortHaul", max: 500000, step: 500 },
    { label: l.longHaul, key: "longHaul", max: 500000, step: 500 },
    { label: l.commute, key: "commute", max: 5000000, step: 1000 },
    { label: l.spend, key: "spend", max: 10000000, step: 10000 },
    { label: l.waste, key: "waste", max: 200000, step: 100 },
    { label: l.water, key: "water", max: 100000, step: 100 },
  ];

  const tabFields = tab === "scope1" ? scope1Fields : tab === "scope2" ? scope2Fields : scope3Fields;

  /* ---------- Exports ---------- */

  const numLocale = locale === "el" ? "el-CY" : "en-GB";

  const downloadCsv = () => {
    const header = [
      "scope",
      l.category,
      l.activity,
      "value",
      "unit",
      `${l.factor} (kg CO2e / unit)`,
      l.emissions,
    ].join(",");
    const scopeLabel = (s: number) =>
      s === 1 ? "Scope 1" : s === 2 ? "Scope 2" : "Scope 3";
    const lines = rows.map((r) =>
      [
        scopeLabel(r.scope),
        r.label.replace(/,/g, ";"),
        r.key,
        r.value,
        r.unit,
        r.factor,
        r.tonnes.toFixed(4),
      ].join(","),
    );
    lines.push(`,,,,,${l.total},${totals.total.toFixed(4)}`);
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vuneli-ghg-report-${state.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doPrint = () => window.print();

  const reset = () => setState(DEFAULT_STATE);

  const scopeRow = (label: string, value: number, i: number) => (
    <div key={label}>
      <div className="mb-1.5 grid grid-cols-[28px_minmax(0,1fr)_auto] items-baseline gap-3 text-[13px]">
        <span className="viq-minor-code tabular-nums">
          {String(i + 1).padStart(2, "0")}
        </span>
        <span className="text-foreground/85">{label}</span>
        <span className="tabular-nums text-foreground/60">
          {value.toLocaleString(numLocale, { maximumFractionDigits: 1 })} t · {pct(value).toFixed(0)}%
        </span>
      </div>
      <div className="ml-[40px] h-[2px] w-[calc(100%-40px)] overflow-hidden bg-foreground/10">
        <div
          className="h-full bg-foreground/80 transition-[width] duration-300"
          style={{ width: `${pct(value)}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="viq-tool not-prose border-y border-foreground/15 print:border-none">
      {/* Tool header + controls */}
      <div className="border-b border-foreground/10 py-8 sm:py-10">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
          <div>
            <label className="viq-field-label block">
              {l.reportingYear}
            </label>
            <input
              type="number"
              value={state.year}
              min={2020}
              max={2035}
              onChange={(e) => set("year", Number(e.target.value))}
              className="mt-2 w-32 border-0 border-b border-foreground/25 bg-transparent pb-1 text-[26px] font-semibold tabular-nums tracking-[-0.02em] outline-none focus:border-primary"
            />
          </div>
          {lockRegion ? (
            <div>
              <p className="viq-field-label block">
                {l.region}
              </p>
              <p className="mt-2 pb-1 text-[16px] font-medium tracking-[-0.005em]">
                {REGION_LABELS[state.region][locale]} - {GRID_FACTORS[state.region]} kg/kWh
              </p>
            </div>
          ) : (
            <div>
              <label className="viq-field-label block">
                {l.region}
              </label>
              <select
                value={state.region}
                onChange={(e) => set("region", e.target.value as Region)}
                className="mt-2 w-full min-w-[180px] border-0 border-b border-foreground/25 bg-transparent pb-1 text-[16px] font-medium tracking-[-0.005em] outline-none focus:border-primary sm:w-auto"
              >
                {(Object.keys(GRID_FACTORS) as Region[]).map((r) => (
                  <option key={r} value={r}>
                    {REGION_LABELS[r][locale]} - {GRID_FACTORS[r]} kg/kWh
                  </option>
                ))}
              </select>
            </div>
          )}
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
      </div>

      {/* Scope tabs + fields | Totals panel */}
      <div className="grid gap-10 py-8 sm:py-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-14">
        {/* Left: inputs */}
        <div className="print:hidden">
          <div className="mb-6 flex gap-6 border-b border-foreground/10">
            {(["scope1", "scope2", "scope3"] as const).map((s) => {
              const label = s === "scope1" ? l.scope1 : s === "scope2" ? l.scope2 : l.scope3;
              const active = tab === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTab(s)}
                  className={`-mb-px border-b-2 pb-3 text-left text-[12.5px] font-medium tracking-[-0.005em] transition ${
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-foreground/55 hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="space-y-6">
            {tabFields.map((f) => {
              const value = state[f.key] as number;
              return (
                <div key={f.key}>
                  <div className="mb-2 flex items-baseline justify-between gap-4">
                    <label className="text-[13px] font-medium tracking-[-0.005em] text-foreground/80">
                      {f.label}
                    </label>
                    <input
                      type="number"
                      value={value}
                      min={0}
                      step={f.step}
                      onChange={(e) => set(f.key, Number(e.target.value) as State[typeof f.key])}
                      className="w-32 border-0 border-b border-foreground/20 bg-transparent pb-0.5 text-right text-[13px] font-medium tabular-nums outline-none focus:border-primary"
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={f.max}
                    step={f.step}
                    value={value}
                    onChange={(e) => set(f.key, Number(e.target.value) as State[typeof f.key])}
                    className="vuneli-range"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: totals - always visible, also renders in print */}
        <div className="border-l border-foreground/10 pl-8 sm:pl-10 print:border-none print:pl-0">
          <p className="viq-section-label">
            {l.total} <span className="tabular-nums text-foreground/60">{state.year}</span> <span className="text-foreground/60">{REGION_LABELS[state.region][locale]}</span>
          </p>
          <p className="mt-3 text-[56px] font-semibold leading-none tabular-nums tracking-[-0.03em] sm:text-[80px]">
            {totals.total.toLocaleString(numLocale, { maximumFractionDigits: 1 })}
          </p>
          <p className="viq-meta mt-2">{l.unit}</p>

          <p className="viq-section-label mt-8">
            {l.breakdown}
          </p>
          <div className="mt-4 space-y-4">
            {scopeRow(l.scope1, totals.s1, 0)}
            {scopeRow(l.scope2, totals.s2, 1)}
            {scopeRow(l.scope3, totals.s3, 2)}
          </div>

          {/* Full category table - visible on print + optional on screen */}
          <div className="mt-10 hidden border-t border-foreground/10 pt-6 print:block">
            <table className="w-full border-collapse text-[11.5px]">
              <thead>
                <tr className="border-b border-foreground/20 text-left text-foreground/65">
                  <th className="py-2 pr-3">Scope</th>
                  <th className="py-2 pr-3">{l.activity}</th>
                  <th className="py-2 pr-3 text-right">Value</th>
                  <th className="py-2 pr-3 text-right">Unit</th>
                  <th className="py-2 text-right">{l.emissions}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-b border-foreground/10">
                    <td className="py-1.5 pr-3 tabular-nums">{r.scope}</td>
                    <td className="py-1.5 pr-3">{r.label}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {r.value.toLocaleString(numLocale)}
                    </td>
                    <td className="py-1.5 pr-3 text-right">{r.unit}</td>
                    <td className="py-1.5 text-right tabular-nums">{r.tonnes.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td colSpan={4} className="py-2 pr-3 text-right font-semibold">
                    {l.total}
                  </td>
                  <td className="py-2 text-right tabular-nums">{totals.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-8 border-t border-foreground/10 pt-5 text-[11.5px] leading-[1.6] text-foreground/50">
            {l.factorNote} {l.disclaimer}
          </p>
          <p className="viq-print-note mt-3 hidden print:block">
            {l.reportTitle} · {l.generatedOn} {new Date().toLocaleDateString(numLocale)}
          </p>
        </div>
      </div>
    </div>
  );
}
