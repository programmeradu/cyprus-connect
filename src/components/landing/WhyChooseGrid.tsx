"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Sparkles, FileCheck2, Activity, Recycle } from "lucide-react";
import heroDashboard from "@/assets/section-why-dashboard.jpg";
import heroOlive from "@/assets/hero-04-olive-grove.jpg";

/**
 * Why Choose Vuneli — Emitra-style bento.
 * Asymmetric 6-col grid: two large image feature tiles paired with two
 * compact text tiles anchored by rounded-square icon marks.
 */
export function WhyChooseGrid() {
  const t = useTranslations("landing");

  const iconTiles = [
    {
      icon: Sparkles,
      kicker: t("benefitAiKicker"),
      title: t("benefitAiTitle"),
      body: t("benefitAiDesc"),
    },
    {
      icon: Activity,
      kicker: t("benefitMonitorKicker"),
      title: t("benefitMonitorTitle"),
      body: t("benefitMonitorDesc"),
    },
  ];

  return (
    <section className="relative w-full py-24 px-6 sm:px-10 lg:px-12">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span
              className="mb-4 block text-[11px] font-medium uppercase tracking-[0.22em]"
              style={{
                fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
                color: "var(--accent-oxidized)",
              }}
            >
              [ WHY VUNELI ]
            </span>
            <h2
              className="text-5xl leading-[0.95] tracking-tight text-foreground md:text-6xl"
              style={{ fontFamily: "var(--editorial-display)" }}
            >
              {t("whyTitleA")}{" "}
              <em className="font-normal italic">{t("whyTitleB")}</em>.
            </h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-muted-foreground md:text-right">
            {t("whySubtitle")}
          </p>
        </div>

        {/* Bento — 6-col asymmetric */}
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
              <span
                className="mb-3 block text-[11px] font-medium uppercase tracking-[0.22em] text-white/85"
                style={{ fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)" }}
              >
                {t("benefitReportKicker")}
              </span>
              <h3
                className="mb-3 max-w-md text-3xl leading-tight text-white md:text-4xl"
                style={{ fontFamily: "var(--editorial-display)" }}
              >
                {t("benefitReportTitle")}
              </h3>
              <p className="max-w-md text-sm leading-relaxed text-white/80 md:text-base">
                {t("benefitReportDesc")}
              </p>
            </div>
          </article>

          {/* Icon tiles B & C — 2 cols each */}
          {iconTiles.map(({ icon: Icon, kicker, title, body }) => (
            <article
              key={title}
              className="relative flex flex-col justify-between rounded-3xl border border-border bg-card p-7 md:col-span-2"
            >
              <div>
                <div
                  className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    background:
                      "color-mix(in oklab, var(--accent-oxidized) 12%, var(--card))",
                    color: "var(--accent-oxidized)",
                  }}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <span
                  className="mb-2 block text-[10.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)" }}
                >
                  {kicker}
                </span>
                <h3
                  className="mb-2 text-2xl leading-tight text-foreground"
                  style={{ fontFamily: "var(--editorial-display)" }}
                >
                  {title}
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </article>
          ))}

          {/* D — second image feature: olive grove, 4 cols */}
          <article className="group relative overflow-hidden rounded-3xl border border-border md:col-span-4">
            <Image
              src={heroOlive}
              alt=""
              fill
              sizes="(min-width: 768px) 66vw, 100vw"
              className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
              placeholder="blur"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
            <div className="relative flex h-full min-h-[240px] flex-col justify-center p-8 lg:p-10">
              <span
                className="mb-2 block text-[11px] font-medium uppercase tracking-[0.22em] text-white/85"
                style={{ fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)" }}
              >
                {t("benefitLcaKicker")}
              </span>
              <h3
                className="mb-2 max-w-md text-2xl leading-tight text-white md:text-3xl"
                style={{ fontFamily: "var(--editorial-display)" }}
              >
                {t("benefitLcaTitle")}
              </h3>
              <p className="max-w-md text-sm leading-relaxed text-white/80">
                {t("benefitLcaDesc")}
              </p>
            </div>
          </article>

          {/* E — accent tile matching row height */}
          <article className="relative flex flex-col justify-between rounded-3xl border border-border bg-card p-7 md:col-span-2">
            <div>
              <div
                className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  background:
                    "color-mix(in oklab, var(--accent-oxidized) 12%, var(--card))",
                  color: "var(--accent-oxidized)",
                }}
              >
                <Recycle className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <span
                className="mb-2 block text-[10.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground"
                style={{ fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)" }}
              >
                [ CYPRUS ORIGIN ]
              </span>
              <h3
                className="mb-2 text-2xl leading-tight text-foreground"
                style={{ fontFamily: "var(--editorial-display)" }}
              >
                Built for the Mediterranean.
              </h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Tuned to Cyprus grid data, EU CSRD wave 3, and local utility feeds. No US-first defaults, no bolt-on translations.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
