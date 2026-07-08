"use client";

/**
 * Scope 1 / 2 / 3 mini emissions calculator.
 * Not a certified tool — indicative estimates using rounded 2024 UK/EU DEFRA-style factors.
 */

import { useMemo, useState } from "react";
import { Info, Flame, Zap, Truck } from "lucide-react";

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
  const [gas, setGas] = useState(80000);
  const [diesel, setDiesel] = useState(4000);
  const [elec, setElec] = useState(120000);
  const [travel, setTravel] = useState(25000);
  const [supply, setSupply] = useState(400000);

  const { s1, s2, s3, total } = useMemo(() => {
    const s1 = (gas * FACTORS.naturalGas_kWh + diesel * FACTORS.diesel_L) / 1000;
    const s2 = (elec * FACTORS.electricity_kWh_EU) / 1000;
    const s3 = (travel * FACTORS.businessTravel_km + supply * FACTORS.supplyChain_EUR) / 1000;
    return { s1, s2, s3, total: s1 + s2 + s3 };
  }, [gas, diesel, elec, travel, supply]);

  const pct = (v: number) => (total > 0 ? (v / total) * 100 : 0);

  const rows = [
    { label: l.scope1, icon: Flame, color: "bg-orange-500", value: s1, pct: pct(s1) },
    { label: l.scope2, icon: Zap, color: "bg-yellow-500", value: s2, pct: pct(s2) },
    { label: l.scope3, icon: Truck, color: "bg-primary", value: s3, pct: pct(s3) },
  ];

  const fields = [
    { label: l.gas, value: gas, set: setGas, max: 500000, step: 1000 },
    { label: l.diesel, value: diesel, set: setDiesel, max: 50000, step: 100 },
    { label: l.elec, value: elec, set: setElec, max: 1000000, step: 1000 },
    { label: l.travel, value: travel, set: setTravel, max: 200000, step: 500 },
    { label: l.supply, value: supply, set: setSupply, max: 5000000, step: 10000 },
  ];

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
          {fields.map((f) => (
            <div key={f.label}>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label className="text-sm font-medium">{f.label}</label>
                <span className="text-sm tabular-nums text-muted-foreground">
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
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col rounded-2xl border bg-background p-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {l.total}
          </p>
          <p className="mt-2 font-serif text-5xl font-semibold tabular-nums tracking-tight">
            {total.toLocaleString(locale === "el" ? "el-CY" : "en-GB", { maximumFractionDigits: 1 })}
            <span className="ml-2 text-base font-normal text-muted-foreground">{l.unit}</span>
          </p>

          <p className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {l.split}
          </p>
          <div className="mt-3 space-y-3">
            {rows.map((r) => (
              <div key={r.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2">
                    <r.icon className="h-3.5 w-3.5" />
                    {r.label}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {r.value.toFixed(1)} t · {r.pct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${r.color} transition-[width] duration-300`}
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-none" />
            {l.note}
          </p>
        </div>
      </div>
    </div>
  );
}
