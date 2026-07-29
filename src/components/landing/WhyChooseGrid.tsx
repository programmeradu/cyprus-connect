"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import heroDashboard from "@/assets/section-why-dashboard.jpg";
import lcaMaterials from "@/assets/section-lca-materials.jpg";

/**
 * Why Choose Vuneli — Emitra-style bento.
 * Rules honoured: no eyebrow labels, no lucide icons, no muted grey body copy.
 * Context-aware SVG glyphs anchor each text tile; the LCA feature carries a
 * dedicated Cyprus product-lifecycle photograph.
 */

/* — Context-aware glyphs — hand-drawn in oxidized-red ink — */

function GlyphAnalytics() {
  return (
    <svg
      viewBox="0 0 56 56"
      className="h-14 w-14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Neural constellation — signal converging into insight */}
      <circle cx="10" cy="14" r="2.2" />
      <circle cx="10" cy="42" r="2.2" />
      <circle cx="46" cy="28" r="2.6" fill="currentColor" fillOpacity="0.15" />
      <circle cx="28" cy="10" r="1.8" />
      <circle cx="28" cy="46" r="1.8" />
      <circle cx="28" cy="28" r="3" />
      <path d="M12 14 L26 27 M12 42 L26 29 M29 11 L45 27 M29 45 L45 29" />
      <path d="M28 25 L28 15 M28 31 L28 43" strokeOpacity="0.35" />
    </svg>
  );
}

function GlyphMonitoring() {
  return (
    <svg
      viewBox="0 0 56 56"
      className="h-14 w-14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Live telemetry — ECG-style pulse across a sensor field */}
      <path d="M4 30 L14 30 L18 20 L24 40 L30 24 L34 34 L40 30 L52 30" />
      <circle cx="40" cy="30" r="1.6" fill="currentColor" />
      <path d="M4 44 L52 44" strokeOpacity="0.35" strokeDasharray="1 3" />
      <path d="M4 16 L52 16" strokeOpacity="0.35" strokeDasharray="1 3" />
    </svg>
  );
}

function GlyphCyprus() {
  // Simplified but recognisable Cyprus outline: main body with the
  // distinctive Karpas peninsula extending north-east.
  const outline =
    "M4 32 Q6 27 12 26 Q18 23 26 24 Q33 22 39 25 Q42 26 44 28 L52 20 L54 22 L46 30 Q42 33 36 34 Q28 36 20 34 Q12 33 8 33 Q5 33 4 32 Z";
  return (
    <svg
      viewBox="0 0 56 56"
      className="h-14 w-14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={outline} fill="currentColor" fillOpacity="0.14" />
      <path d={outline} />
      {/* Nicosia marker — capital, roughly centre-north */}
      <circle cx="30" cy="28" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function WhyChooseGrid() {
  const t = useTranslations("landing");

  const iconTiles = [
    { Glyph: GlyphAnalytics, title: t("benefitAiTitle"), body: t("benefitAiDesc") },
    { Glyph: GlyphMonitoring, title: t("benefitMonitorTitle"), body: t("benefitMonitorDesc") },
  ];

  const mono =
    "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)";
  const display = "var(--editorial-display)";

  return (
    <section className="relative w-full py-24 px-6 sm:px-10 lg:px-12">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header — no eyebrow, just editorial title */}
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2
            className="max-w-2xl text-5xl leading-[0.95] tracking-tight text-foreground md:text-6xl"
            style={{ fontFamily: display }}
          >
            {t("whyTitleA")}{" "}
            <em className="font-normal italic">{t("whyTitleB")}</em>.
          </h2>
          <p className="max-w-sm text-base leading-relaxed text-foreground/80 md:text-right">
            {t("whySubtitle")}
          </p>
        </div>

        {/* Bento */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:auto-rows-[minmax(220px,auto)]">
          {/* A — big feature: dashboard image, spans 4 cols x 2 rows */}
          <article className="group relative overflow-hidden rounded-3xl border border-border md:col-span-4 md:row-span-2">
            <Image
              src={heroDashboard}
              alt=""
              fill
              sizes="(min-width: 768px) 66vw, 100vw"
              className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
              placeholder="blur"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="relative flex h-full min-h-[460px] flex-col justify-end p-8 lg:p-10">
              <h3
                className="mb-3 max-w-md text-3xl leading-tight text-white md:text-4xl"
                style={{ fontFamily: display }}
              >
                {t("benefitReportTitle")}
              </h3>
              <p className="max-w-md text-base leading-relaxed text-white/90">
                {t("benefitReportDesc")}
              </p>
            </div>
          </article>

          {/* Icon tiles B & C */}
          {iconTiles.map(({ Glyph, title, body }) => (
            <article
              key={title}
              className="relative flex flex-col justify-between rounded-3xl border border-border bg-card p-7 md:col-span-2"
            >
              <div>
                <div style={{ color: "var(--accent-oxidized)" }} className="mb-6">
                  <Glyph />
                </div>
                <h3
                  className="mb-3 text-2xl leading-tight text-card-foreground"
                  style={{ fontFamily: display }}
                >
                  {title}
                </h3>
              </div>
              <p className="mt-2 text-base leading-relaxed text-card-foreground/85">
                {body}
              </p>
            </article>
          ))}

          {/* D — Lifecycle LCA: dedicated materials photograph, 4 cols */}
          <article className="group relative overflow-hidden rounded-3xl border border-border md:col-span-4">
            <Image
              src={lcaMaterials}
              alt=""
              fill
              sizes="(min-width: 768px) 66vw, 100vw"
              className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
              placeholder="blur"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
            <div className="relative flex h-full min-h-[260px] flex-col justify-center p-8 lg:p-10">
              <h3
                className="mb-2 max-w-md text-2xl leading-tight text-white md:text-3xl"
                style={{ fontFamily: display }}
              >
                {t("benefitLcaTitle")}
              </h3>
              <p className="max-w-md text-base leading-relaxed text-white/90">
                {t("benefitLcaDesc")}
              </p>
            </div>
          </article>

          {/* E — Cyprus Origin accent tile */}
          <article className="relative flex flex-col justify-between rounded-3xl border border-border bg-card p-7 md:col-span-2">
            <div>
              <div style={{ color: "var(--accent-oxidized)" }} className="mb-6">
                <GlyphCyprus />
              </div>
              <h3
                className="mb-3 text-2xl leading-tight text-card-foreground"
                style={{ fontFamily: display }}
              >
                Built for the Mediterranean.
              </h3>
            </div>
            <p className="mt-2 text-base leading-relaxed text-card-foreground/85">
              Tuned to Cyprus grid data, EU CSRD wave 3, and local utility feeds. No US-first defaults, no bolt-on translations.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
