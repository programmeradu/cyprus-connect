"use client";

import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { PILLARS } from "@/data/learn/pillars";

/**
 * Knowledge index - editorial ledger of the highest-intent guides.
 * Reads as a printed contents page: hairline rules, serif numerals,
 * small square plates, reading time in the right margin.
 */
const TOP_PILLAR_SLUGS = [
  "csrd-reporting-guide",
  "vsme-reporting-guide",
  "cbam-explained",
  "scope-3-emissions-calculation",
  "carbon-accounting-for-smes",
  "esg-reporting-software",
  "csrd-reporting-cyprus",
  "cbam-cyprus",
] as const;

const HEADINGS: Record<
  string,
  { titleA: string; titleB: string; subtitle: string; viewAll: string }
> = {
  en: {
    titleA: "Learn sustainability",
    titleB: "reporting",
    subtitle:
      "In-depth guides on CSRD, VSME, CBAM, and carbon accounting - written for European SMEs, updated as the regulations evolve.",
    viewAll: "Browse all guides",
  },
  el: {
    titleA: "Μάθετε αναφορά",
    titleB: "βιωσιμότητας",
    subtitle:
      "Αναλυτικοί οδηγοί για CSRD, VSME, CBAM και ανθρακική λογιστική - γραμμένοι για ευρωπαϊκές ΜμΕ, ενημερώνονται με τους κανονισμούς.",
    viewAll: "Δείτε όλους τους οδηγούς",
  },
};

export function LearnLinksSection() {
  const locale = useLocale();
  const copy = HEADINGS[locale] ?? HEADINGS.en;
  const localeKey = (locale === "el" ? "el" : "en") as "en" | "el";

  const pillars = TOP_PILLAR_SLUGS.map((slug) => {
    const p = PILLARS[slug];
    if (!p) return null;
    const content = p[localeKey];
    return {
      slug: p.slug,
      title: content.title,
      minutes: p.readingMinutes,
      heroImage: p.heroImage,
    };
  }).filter((x): x is NonNullable<typeof x> => Boolean(x));

  const minutesLabel = locale === "el" ? "λεπτά" : "min";

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-12 sm:items-end sm:gap-12">
          <h2 className="sm:col-span-6 font-[family-name:var(--editorial-serif)] text-[2.4rem] leading-[1.02] tracking-[-0.025em] sm:text-[3.5rem]">
            {copy.titleA}{" "}
            <span className="italic text-muted-foreground">{copy.titleB}</span>
          </h2>
          <p className="sm:col-span-6 max-w-md text-[16.5px] leading-[1.6] text-foreground/70 sm:text-[17.5px]">
            {copy.subtitle}
          </p>
        </div>

        <ol className="mt-12 grid border-t border-border/60 sm:mt-16 sm:grid-cols-2 sm:gap-x-12">
          {pillars.map((p, i) => (
            <li key={p.slug} className="min-w-0 border-b border-border/60">
              <Link
                href={`/${locale}/learn/${p.slug}`}
                className="group flex items-center gap-4 py-4 transition-colors sm:gap-5 sm:py-5"
              >
                <span className="w-6 shrink-0 font-[family-name:var(--editorial-serif)] text-[15px] italic tabular-nums text-foreground/40">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-muted/40 sm:h-16 sm:w-16">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.heroImage}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-[family-name:var(--editorial-serif)] text-[18px] leading-[1.2] tracking-[-0.015em] text-foreground decoration-foreground/25 underline-offset-[6px] group-hover:underline sm:text-[20px]">
                    {p.title}
                  </span>
                </span>

                <span className="shrink-0 self-start pt-1 text-[12px] tabular-nums text-foreground/45 sm:self-center sm:pt-0 sm:text-[13px]">
                  {p.minutes} {minutesLabel}
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <div className="mt-10">
          <Link
            href={`/${locale}/learn`}
            className="group inline-flex items-baseline gap-2 font-[family-name:var(--editorial-serif)] text-[18px] italic text-foreground transition-colors sm:text-[20px]"
          >
            <span className="border-b border-foreground/25 pb-0.5 transition-colors group-hover:border-foreground/70">
              {copy.viewAll}
            </span>
            <span aria-hidden="true" className="not-italic transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
