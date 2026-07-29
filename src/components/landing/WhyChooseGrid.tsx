"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

/**
 * Why Choose Vuneli — editorial 4-tile grid (Direction B).
 * Verified Nature aesthetic: limestone surface, hairline dividers,
 * Fraunces italic titles, oxidized-red kickers.
 */
export function WhyChooseGrid() {
  const t = useTranslations("landing");

  const cards = [
    {
      kicker: t("benefitAiKicker"),
      title: t("benefitAiTitle"),
      body: t("benefitAiDesc"),
    },
    {
      kicker: t("benefitReportKicker"),
      title: t("benefitReportTitle"),
      body: t("benefitReportDesc"),
    },
    {
      kicker: t("benefitMonitorKicker"),
      title: t("benefitMonitorTitle"),
      body: t("benefitMonitorDesc"),
    },
    {
      kicker: t("benefitLcaKicker"),
      title: t("benefitLcaTitle"),
      body: t("benefitLcaDesc"),
    },
  ];

  return (
    <section className="relative w-full py-16 px-6 sm:px-10 lg:px-12">
      <div className="mx-auto w-full max-w-6xl border-y border-border py-16">
        {/* Section header */}
        <div className="mb-16 grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-12">
          <h2
            className="col-span-1 text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl lg:col-span-8 lg:text-6xl"
            style={{ fontFamily: "var(--editorial-display)", fontStyle: "italic" }}
          >
            {t("whyTitleA")}{" "}
            <span className="whitespace-nowrap">{t("whyTitleB")}.</span>
          </h2>
          <p className="col-span-1 max-w-md text-base leading-relaxed text-muted-foreground lg:col-span-4 lg:text-right lg:text-lg">
            {t("whySubtitle")}
          </p>
        </div>

        {/* Grid of 4 cards, hairline dividers via gap-px on border color */}
        <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <article
              key={i}
              className="group flex h-full flex-col bg-background p-8 transition-colors duration-300 hover:bg-[color:color-mix(in_oklab,var(--foreground)_3%,var(--background))]"
            >
              <span
                className="mb-12 block text-[11px] font-medium uppercase tracking-[0.2em]"
                style={{ color: "var(--accent-oxidized)" }}
              >
                {c.kicker}
              </span>
              <h3
                className="mb-4 text-2xl leading-tight text-foreground"
                style={{ fontFamily: "var(--editorial-display)", fontStyle: "italic" }}
              >
                {c.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                {c.body}
              </p>
            </article>
          ))}
        </div>

        {/* Footer meta + methodology link */}
        <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-border pt-8 sm:flex-row sm:items-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/80">
            Vuneli — Verified Nature — {new Date().getFullYear()}
          </p>
          <a
            href="#methodology"
            className="group inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-[color:var(--accent-oxidized)]"
          >
            <span className="border-b border-foreground pb-0.5 transition-colors group-hover:border-[color:var(--accent-oxidized)]">
              {t("whyMethodology")}
            </span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}
