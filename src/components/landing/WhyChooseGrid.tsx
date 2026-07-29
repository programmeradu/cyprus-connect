"use client";

import { useTranslations } from "next-intl";

/**
 * Why Choose Vuneli — editorial 4-tile grid.
 * Verified Nature aesthetic distilled from the 5-site audit:
 *  - Lifecycle: bracketed mono micro-labels, oxidized-red accent, ledger paper.
 *  - Envirogen: giant italic chapter numerals anchoring each tile.
 *  - Solaric / Emitra: hairline architectural grid + tabular ref metadata.
 *  - GreenX: mixed-weight editorial voice via Fraunces italic titles.
 */
export function WhyChooseGrid() {
  const t = useTranslations("landing");

  const cards = [
    {
      numeral: "I",
      slug: "ANALYTICS",
      kicker: t("benefitAiKicker"),
      title: t("benefitAiTitle"),
      body: t("benefitAiDesc"),
      ref: "VN · 01 / ANALYTICS",
    },
    {
      numeral: "II",
      slug: "COMPLIANCE",
      kicker: t("benefitReportKicker"),
      title: t("benefitReportTitle"),
      body: t("benefitReportDesc"),
      ref: "VN · 02 / CSRD",
    },
    {
      numeral: "III",
      slug: "TELEMETRY",
      kicker: t("benefitMonitorKicker"),
      title: t("benefitMonitorTitle"),
      body: t("benefitMonitorDesc"),
      ref: "VN · 03 / MONITORING",
    },
    {
      numeral: "IV",
      slug: "LIFECYCLE",
      kicker: t("benefitLcaKicker"),
      title: t("benefitLcaTitle"),
      body: t("benefitLcaDesc"),
      ref: "VN · 04 / LCA",
    },
  ];

  return (
    <section className="relative w-full py-24 px-6 sm:px-10 lg:px-12">
      <div className="mx-auto w-full max-w-6xl">
        {/* Section header — bracketed mono eyebrow + Fraunces italic title */}
        <div className="mb-16 flex flex-col justify-between gap-8 border-b border-border pb-10 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span
              className="mb-5 block text-[11px] font-medium uppercase tracking-[0.22em]"
              style={{
                fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
                color: "var(--accent-oxidized)",
              }}
            >
              [ THE VERIFIED NATURE STANDARD ]
            </span>
            <h2
              className="text-5xl leading-[0.95] tracking-tight text-foreground md:text-6xl lg:text-7xl"
              style={{ fontFamily: "var(--editorial-display)", fontStyle: "italic" }}
            >
              {t("whyTitleA")}{" "}
              <span className="whitespace-nowrap">{t("whyTitleB")}.</span>
            </h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-muted-foreground md:text-right">
            {t("whySubtitle")}
          </p>
        </div>

        {/* 4-tile editorial grid — hairline architectural rails */}
        <div className="grid grid-cols-1 border-l border-t border-border sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <article
              key={c.numeral}
              className="group relative flex min-h-[460px] flex-col border-b border-r border-border p-8 transition-colors duration-500 hover:bg-[color:color-mix(in_oklab,var(--foreground)_3%,var(--background))] lg:p-9"
            >
              {/* Bracketed mono kicker */}
              <div className="mb-10 flex items-center justify-between">
                <span
                  className="text-[10.5px] font-medium uppercase leading-none tracking-[0.18em]"
                  style={{
                    fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
                    color: "var(--accent-oxidized)",
                  }}
                >
                  [ {c.slug} ]
                </span>
              </div>

              {/* Giant italic ghost numeral — the Envirogen chapter anchor */}
              <span
                aria-hidden
                className="pointer-events-none mb-6 block select-none text-[128px] leading-[0.75] text-foreground/[0.06] transition-colors duration-700 group-hover:text-[color:color-mix(in_oklab,var(--accent-oxidized)_18%,transparent)]"
                style={{ fontFamily: "var(--editorial-display)", fontStyle: "italic" }}
              >
                {c.numeral}
              </span>

              {/* Title + body */}
              <h3
                className="mb-4 text-[26px] leading-[1.15] text-foreground"
                style={{ fontFamily: "var(--editorial-display)", fontStyle: "italic" }}
              >
                {c.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                {c.body}
              </p>

              {/* Bottom ref rail — ledger metadata */}
              <div className="mt-auto pt-8">
                <div className="mb-3 h-px w-full bg-border" />
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] tabular-nums uppercase tracking-[0.14em] text-foreground/40"
                    style={{
                      fontFamily:
                        "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
                    }}
                  >
                    {c.ref}
                  </span>
                  <span
                    aria-hidden
                    className="block h-px w-6 origin-left scale-x-0 bg-[color:var(--accent-oxidized)] transition-transform duration-500 group-hover:scale-x-100"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Footer meta */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span
              className="text-[10px] uppercase tracking-[0.22em] text-foreground/50"
              style={{
                fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
              }}
            >
              Vuneli · Verified Nature · {new Date().getFullYear()}
            </span>
            <span className="h-px w-10 bg-[color:var(--accent-oxidized)]" />
            <span
              className="text-[10px] uppercase tracking-[0.22em] text-foreground/50"
              style={{
                fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
              }}
            >
              Cyprus Origin
            </span>
          </div>
          <a
            href="#methodology"
            className="group/link inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-[color:var(--accent-oxidized)]"
          >
            <span className="border-b border-foreground pb-0.5 transition-colors group-hover/link:border-[color:var(--accent-oxidized)]">
              {t("whyMethodology")}
            </span>
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
