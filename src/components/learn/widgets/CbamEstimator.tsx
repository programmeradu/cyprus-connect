"use client";

/**
 * CBAM indicative cost estimator.
 * Rough only — CBAM certificate price ≈ weekly EU ETS average.
 */

import { useMemo } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { Info } from "lucide-react";

type Props = { locale: "en" | "el" };

// Default embedded-emission intensities (tCO2e / tonne of product) — indicative.
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
          <div>
            <label className="mb-2 block text-sm font-medium">{l.product}</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PRODUCTS) as ProductKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setProduct(k)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                    product === k
                      ? "border-primary bg-primary/5 text-foreground"
                      : "hover:border-primary/40"
                  }`}
                >
                  <div className="font-medium leading-tight">{PRODUCTS[k][locale]}</div>
                  <div className="mt-1 text-xs tabular-nums text-muted-foreground">
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
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">{f.label}</label>
                <span className="text-sm tabular-nums text-muted-foreground">{f.fmt(f.value)}</span>
              </div>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={f.value}
                onChange={(e) => f.set(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-center rounded-2xl border bg-background p-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {l.exposure}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {nf.format(Math.round(emissions))}
            <span className="ml-2 text-sm font-normal text-muted-foreground">tCO₂e</span>
          </p>

          <div className="my-5 border-t" />

          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">{l.cost}</p>
          <p className="mt-2 font-serif text-5xl font-semibold tabular-nums tracking-tight text-primary">
            {cf.format(cost)}
          </p>

          <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-none" />
            {l.note}
          </p>
        </div>
      </div>
    </div>
  );
}
