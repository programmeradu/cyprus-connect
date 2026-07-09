"use client";

/**
 * Scope 1 / 2 / 3 mini emissions calculator.
 * Not a certified tool — indicative estimates using rounded 2024 UK/EU DEFRA-style factors.
 */

import { useMemo } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";


type Props = { locale: "en" | "el" };

// Simplified emission factors (kg CO2e per unit)
const FACTORS = {
  naturalGas_kWh: 0.184, // Scope 1 combustion
  diesel_L: 2.51, // Scope 1 mobile combustion
  electricity_kWh_EU: 0.253, // Scope 2 location-based EU average
  businessTravel_km: 0.171, // Scope 3.6 avg car
  supplyChain_EUR: 0.35, // Scope 3.1 spend-based crude
} as const;

const t = {
  en: {
    title: "Scope 1 / 2 / 3 mini-calculator",
    subtitle: "Rough annual emissions estimate. For directional planning — replace with metered data before reporting.",
    scope1: "Scope 1 — direct fuel",
    scope2: "Scope 2 — electricity",
    scope3: "Scope 3 — value chain",
    gas: "Natural gas (kWh / yr)",
    diesel: "Diesel for fleet (L / yr)",
    elec: "Grid electricity (kWh / yr)",
    travel: "Business travel by road (km / yr)",
    supply: "Purchased goods & services (€ / yr)",
    total: "Estimated total",
    unit: "tCO₂e / yr",
    split: "Emissions split",
    note: "Uses simplified 2024 EU-average factors (natural gas 0.184, diesel 2.51 kg/L, EU grid 0.253, road travel 0.171 kg/km, spend-based S3 0.35 kg/€). Not audit-grade.",
  },
  el: {
    title: "Μίνι υπολογιστής Scope 1 / 2 / 3",
    subtitle: "Ενδεικτική ετήσια εκτίμηση εκπομπών — για κατεύθυνση σχεδιασμού, αντικαταστήστε με μετρημένα δεδομένα πριν την αναφορά.",
    scope1: "Scope 1 — άμεσα καύσιμα",
    scope2: "Scope 2 — ηλεκτρισμός",
    scope3: "Scope 3 — αλυσίδα αξίας",
    gas: "Φυσικό αέριο (kWh / έτος)",
    diesel: "Πετρέλαιο στόλου (L / έτος)",
    elec: "Ηλεκτρισμός δικτύου (kWh / έτος)",
    travel: "Επαγγελματικά ταξίδια οδικώς (km / έτος)",
    supply: "Αγορές αγαθών & υπηρεσιών (€ / έτος)",
    total: "Εκτιμώμενο σύνολο",
    unit: "tCO₂e / έτος",
    split: "Κατανομή εκπομπών",
    note: "Χρησιμοποιεί απλοποιημένους μέσους συντελεστές ΕΕ 2024. Δεν είναι ελεγκτικής ποιότητας.",
  },
} as const;

export default function ScopeCalculator({ locale }: Props) {
  const l = t[locale];
  const [state, setState] = usePersistedState("verdeiq.calc.scope", {
    gas: 80000, diesel: 4000, elec: 120000, travel: 25000, supply: 400000,
  });
  const { gas, diesel, elec, travel, supply } = state;
  const setGas = (v: number) => setState((s) => ({ ...s, gas: v }));
  const setDiesel = (v: number) => setState((s) => ({ ...s, diesel: v }));
  const setElec = (v: number) => setState((s) => ({ ...s, elec: v }));
  const setTravel = (v: number) => setState((s) => ({ ...s, travel: v }));
  const setSupply = (v: number) => setState((s) => ({ ...s, supply: v }));

  const { s1, s2, s3, total } = useMemo(() => {
    const s1 = (gas * FACTORS.naturalGas_kWh + diesel * FACTORS.diesel_L) / 1000;
    const s2 = (elec * FACTORS.electricity_kWh_EU) / 1000;
    const s3 = (travel * FACTORS.businessTravel_km + supply * FACTORS.supplyChain_EUR) / 1000;
    return { s1, s2, s3, total: s1 + s2 + s3 };
  }, [gas, diesel, elec, travel, supply]);

  const pct = (v: number) => (total > 0 ? (v / total) * 100 : 0);

  const rows = [
    { label: l.scope1, value: s1, pct: pct(s1) },
    { label: l.scope2, value: s2, pct: pct(s2) },
    { label: l.scope3, value: s3, pct: pct(s3) },
  ];

  const fields = [
    { label: l.gas, value: gas, set: setGas, max: 500000, step: 1000 },
    { label: l.diesel, value: diesel, set: setDiesel, max: 50000, step: 100 },
    { label: l.elec, value: elec, set: setElec, max: 1000000, step: 1000 },
    { label: l.travel, value: travel, set: setTravel, max: 200000, step: 500 },
    { label: l.supply, value: supply, set: setSupply, max: 5000000, step: 10000 },
  ];

  return (
    <div className="not-prose my-14 border-y border-foreground/15">
      <div className="border-b border-foreground/10 py-8 sm:py-10">
        <div className="flex items-baseline justify-between gap-6">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-foreground/55">
            {locale === "el" ? "Διαδραστικό εργαλείο" : "Interactive tool"}
          </p>
          <p className="tabular-nums text-[11px] text-foreground/40">01 / 03</p>
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
          {fields.map((f) => (
            <div key={f.label}>
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <label className="text-[13px] font-medium tracking-[-0.005em] text-foreground/80">{f.label}</label>
                <span className="tabular-nums text-[13px] text-foreground/55">
                  {f.value.toLocaleString(locale === "el" ? "el-CY" : "en-GB")}
                </span>
              </div>
              <input
                type="range"
                min={0}
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
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-foreground/55">
            {l.total}
          </p>
          <p className="mt-3 text-[56px] font-semibold leading-none tabular-nums tracking-[-0.03em] sm:text-[72px]">
            {total.toLocaleString(locale === "el" ? "el-CY" : "en-GB", { maximumFractionDigits: 1 })}
          </p>
          <p className="mt-2 text-[12px] uppercase tracking-[0.2em] text-foreground/45">{l.unit}</p>

          <p className="mt-8 text-[10.5px] font-semibold uppercase tracking-[0.24em] text-foreground/55">
            {l.split}
          </p>
          <div className="mt-4 space-y-4">
            {rows.map((r, i) => (
              <div key={r.label}>
                <div className="mb-1.5 grid grid-cols-[28px_minmax(0,1fr)_auto] items-baseline gap-3 text-[13px]">
                  <span className="tabular-nums text-[11px] font-semibold text-foreground/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-foreground/80">{r.label}</span>
                  <span className="tabular-nums text-foreground/55">
                    {r.value.toFixed(1)} t · {r.pct.toFixed(0)}%
                  </span>
                </div>
                <div className="ml-[40px] h-[2px] w-[calc(100%-40px)] overflow-hidden bg-foreground/10">
                  <div
                    className="h-full bg-foreground/80 transition-[width] duration-300"
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 border-t border-foreground/10 pt-5 text-[11.5px] leading-[1.6] text-foreground/50">
            {l.note}
          </p>
        </div>
      </div>
    </div>
  );
}
