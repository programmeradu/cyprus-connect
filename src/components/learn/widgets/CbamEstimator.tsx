"use client";

/**
 * CBAM indicative cost estimator.
 * Rough only - CBAM certificate price ≈ weekly EU ETS average.
 */

import { useMemo } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";


type Props = { locale: "en" | "el" };

// Default embedded-emission intensities (tCO2e / tonne of product) - indicative.
const PRODUCTS = {
  steel: { en: "Iron & steel", el: "Σίδηρος & χάλυβας", intensity: 2.0 },
  aluminium: { en: "Aluminium", el: "Αλουμίνιο", intensity: 8.6 },
  cement: { en: "Cement (clinker)", el: "Τσιμέντο (κλίνκερ)", intensity: 0.87 },
  fertiliser: { en: "Fertilisers", el: "Λιπάσματα", intensity: 2.3 },
  hydrogen: { en: "Hydrogen (grey)", el: "Υδρογόνο (γκρι)", intensity: 10.5 },
  electricity: { en: "Electricity (imported)", el: "Ηλεκτρισμός (εισαγόμενος)", intensity: 0.65 },
} as const;

type ProductKey = keyof typeof PRODUCTS;

const t = {
  en: {
    title: "CBAM cost estimator",
    subtitle: "Rough annual CBAM exposure for goods imported into the EU. Based on default embedded-emission intensities.",
    product: "Product category",
    tonnes: "Tonnes imported per year",
    ets: "EU ETS certificate price (€ / tCO₂e)",
    freeAlloc: "Free allocation phase-out (%)",
    exposure: "Estimated embedded emissions",
    cost: "Indicative annual CBAM cost",
    note: "Actual liability = (embedded emissions × certificate price) minus any verified carbon price paid in origin country, adjusted for the CBAM phase-in schedule (2.5% free in 2026 → 0% by 2034).",
  },
  el: {
    title: "Εκτιμητής κόστους CBAM",
    subtitle: "Ενδεικτική ετήσια έκθεση CBAM για αγαθά που εισάγονται στην ΕΕ. Βασίζεται σε προκαθορισμένες εντάσεις εκπομπών.",
    product: "Κατηγορία προϊόντος",
    tonnes: "Τόνοι εισαγωγής ανά έτος",
    ets: "Τιμή πιστοποιητικού EU ETS (€ / tCO₂e)",
    freeAlloc: "Απόσυρση δωρεάν κατανομής (%)",
    exposure: "Εκτιμώμενες ενσωματωμένες εκπομπές",
    cost: "Ενδεικτικό ετήσιο κόστος CBAM",
    note: "Πραγματική υποχρέωση = (ενσωματωμένες εκπομπές × τιμή πιστοποιητικού) μείον οποιαδήποτε επαληθευμένη τιμή άνθρακα στη χώρα προέλευσης, προσαρμοσμένη στο χρονοδιάγραμμα CBAM.",
  },
} as const;

export default function CbamEstimator({ locale }: Props) {
  const l = t[locale];
  const [state, setState] = usePersistedState<{ product: ProductKey; tonnes: number; ets: number; phaseOut: number }>(
    "verdeiq.calc.cbam",
    { product: "steel", tonnes: 500, ets: 85, phaseOut: 50 }
  );
  const { product, tonnes, ets, phaseOut } = state;
  const setProduct = (v: ProductKey) => setState((s) => ({ ...s, product: v }));
  const setTonnes = (v: number) => setState((s) => ({ ...s, tonnes: v }));
  const setEts = (v: number) => setState((s) => ({ ...s, ets: v }));
  const setPhaseOut = (v: number) => setState((s) => ({ ...s, phaseOut: v }));

  const { emissions, cost } = useMemo(() => {
    const intensity = PRODUCTS[product].intensity;
    const emissions = tonnes * intensity;
    const cost = emissions * ets * (phaseOut / 100);
    return { emissions, cost };
  }, [product, tonnes, ets, phaseOut]);

  const nf = new Intl.NumberFormat(locale === "el" ? "el-CY" : "en-GB");
  const cf = new Intl.NumberFormat(locale === "el" ? "el-CY" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  return (
    <div className="not-prose my-14 border-y border-foreground/15">
      <div className="border-b border-foreground/10 py-8 sm:py-10">
        <div className="flex items-baseline justify-between gap-6">
          <p className="eyebrow">
            {locale === "el" ? "Διαδραστικό εργαλείο" : "Interactive tool"}
          </p>
          <p className="tabular-nums text-[11px] text-foreground/40">03 / 03</p>
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
            <label className="mb-3 block text-[13px] font-medium tracking-[-0.005em] text-foreground/80">{l.product}</label>
            <div className="grid grid-cols-2 gap-0 border border-foreground/15">
              {(Object.keys(PRODUCTS) as ProductKey[]).map((k, i) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setProduct(k)}
                  className={`border-foreground/10 px-4 py-3 text-left transition ${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t" : ""} ${
                    product === k
                      ? "bg-foreground text-background"
                      : "hover:bg-foreground/[0.03]"
                  }`}
                >
                  <div className="text-[13px] font-medium leading-tight">{PRODUCTS[k][locale]}</div>
                  <div className={`mt-1 tabular-nums text-[11px] ${product === k ? "text-background/60" : "text-foreground/45"}`}>
                    {PRODUCTS[k].intensity} tCO₂e/t
                  </div>
                </button>
              ))}
            </div>
          </div>

          {[
            { label: l.tonnes, value: tonnes, set: setTonnes, min: 1, max: 20000, step: 10, fmt: (v: number) => `${nf.format(v)} t` },
            { label: l.ets, value: ets, set: setEts, min: 20, max: 200, step: 1, fmt: (v: number) => `€${v}` },
            { label: l.freeAlloc, value: phaseOut, set: setPhaseOut, min: 0, max: 100, step: 5, fmt: (v: number) => `${v}%` },
          ].map((f) => (
            <div key={f.label}>
              <div className="mb-2 flex items-baseline justify-between">
                <label className="text-[13px] font-medium tracking-[-0.005em] text-foreground/80">{f.label}</label>
                <span className="tabular-nums text-[13px] text-foreground/55">{f.fmt(f.value)}</span>
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
            {l.exposure}
          </p>
          <p className="mt-3 text-[32px] font-semibold tabular-nums leading-none tracking-[-0.02em]">
            {nf.format(Math.round(emissions))}
          </p>
          <p className="mt-2 eyebrow text-foreground/50">tCO₂e</p>

          <div className="my-8 border-t border-foreground/10" />

          <p className="eyebrow">{l.cost}</p>
          <p className="mt-3 text-[56px] font-semibold leading-none tabular-nums tracking-[-0.03em] sm:text-[72px]">
            {cf.format(cost)}
          </p>

          <p className="mt-8 border-t border-foreground/10 pt-5 text-[11.5px] leading-[1.6] text-foreground/50">
            {l.note}
          </p>
        </div>
      </div>
    </div>
  );
}
