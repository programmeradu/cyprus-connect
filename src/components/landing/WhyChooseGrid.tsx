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
  // Real Cyprus coastline, traced 1:1 from public-domain country geodata
  // (134 vertices, equirectangular projection corrected at 35.14N).
  const outline =
    "M62.00 14.01 L60.74 14.56 L60.05 14.53 L59.49 15.08 L59.10 14.94 L58.82 15.29 L58.27 15.64 L57.29 15.64 L56.69 16.26 L55.02 16.64 L54.74 17.06 L54.29 17.44 L53.69 18.03 L52.54 18.27 L51.84 18.76 L50.80 18.48 L49.26 20.39 L48.32 20.63 L47.90 20.95 L45.46 21.99 L42.52 23.10 L41.02 23.07 L39.70 23.28 L38.30 24.39 L37.25 24.84 L36.38 24.77 L35.54 25.26 L34.11 25.33 L33.34 25.61 L31.11 25.54 L29.78 25.47 L28.53 25.26 L27.51 25.19 L27.03 25.33 L25.98 24.91 L25.39 25.16 L23.75 24.74 L23.22 25.12 L22.63 24.98 L21.83 24.63 L20.99 24.60 L18.89 23.45 L18.61 23.31 L18.72 25.26 L19.00 25.75 L18.96 27.80 L18.54 29.55 L17.81 30.77 L16.45 31.53 L15.72 30.94 L13.66 30.28 L12.47 29.89 L11.32 29.96 L10.03 30.63 L9.33 30.31 L8.35 31.74 L7.27 33.98 L6.12 34.61 L4.90 34.75 L2.91 32.65 L2.35 32.76 L2.00 34.50 L3.12 36.39 L2.91 37.30 L3.43 38.66 L3.22 39.29 L4.20 40.80 L5.07 41.26 L5.39 43.81 L5.77 44.20 L7.58 45.60 L8.28 45.60 L9.54 45.81 L12.40 47.50 L14.01 47.46 L16.07 46.90 L17.39 46.76 L18.68 48.34 L18.89 49.33 L19.03 49.96 L20.32 49.85 L22.03 49.99 L21.62 48.97 L21.27 47.96 L21.76 46.97 L22.91 46.38 L24.58 45.50 L27.58 45.71 L28.32 45.18 L28.74 45.32 L30.41 44.66 L31.95 43.81 L33.38 43.43 L34.98 42.10 L36.03 42.34 L37.22 40.97 L37.15 39.89 L37.50 38.24 L38.02 37.47 L39.03 37.12 L40.29 37.12 L41.06 37.40 L42.28 38.21 L43.54 38.10 L44.16 37.37 L44.90 37.02 L46.26 37.02 L47.51 37.37 L48.84 37.93 L48.39 36.39 L47.79 35.48 L46.99 34.71 L45.94 33.56 L45.11 32.27 L44.62 31.43 L44.06 30.10 L44.06 29.20 L44.20 27.84 L45.53 26.51 L46.40 26.41 L48.21 26.13 L48.46 25.05 L49.47 23.83 L52.05 22.20 L53.62 21.47 L54.77 20.36 L56.83 19.25 L57.18 18.38 L57.53 17.82 L58.79 17.20 L60.85 16.47 L61.09 15.88 L61.44 14.91 L62.00 14.01 Z";
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-14 w-14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={outline} fill="currentColor" fillOpacity="0.14" />
      <path d={outline} />
      {/* Nicosia - capital, projected from 33.365E / 35.175N */}
      <circle cx="30.2" cy="30.8" r="1.5" fill="currentColor" stroke="none" />
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
