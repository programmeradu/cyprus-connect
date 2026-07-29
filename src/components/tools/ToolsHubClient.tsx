"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { LearnLinksSection } from "@/components/learn/LearnLinksSection";
import { TOOLS, CATEGORY_META, type Locale, type ToolCategory } from "@/data/tools";
import heroPhoto from "@/assets/hub-tools-desk.jpg";

/**
 * /tools - the free tool directory.
 *
 * Structure: short cinematic hero, one-line fact strip, then a single
 * filterable directory. One list, one mental model - no stacked category
 * chapters that make the page read like five separate pages.
 *
 * House rules: Fraunces for titles only, Instrument Sans for everything else,
 * hairline rules, square-cornered bordered tabs (no pills), no decorative icons.
 */

type Props = {
  locale: Locale;
  heading: string;
  subheading: string;
  eyebrow: string;
  countLabel: string;
  comingSoonLabel: string;
  availableLabel: string;
  ctaHeading: string;
  ctaBody: string;
  ctaAction: string;
};

const CATEGORY_ORDER: ToolCategory[] = ["carbon", "cbam", "csrd", "vsme", "taxonomy"];

const ACCENT_BUTTON =
  "inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full bg-[var(--accent-lime)] px-6 text-[15px] font-semibold tracking-[-0.01em] text-[var(--accent-lime-foreground)] shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--accent-lime)_55%,transparent)] transition-transform hover:scale-[1.02]";

export default function ToolsHubClient({
  locale,
  heading,
  subheading,
  eyebrow,
  countLabel,
  comingSoonLabel,
  availableLabel,
  ctaHeading,
  ctaBody,
  ctaAction,
}: Props) {
  const el = locale === "el";
  const [filter, setFilter] = useState<ToolCategory | "all">("all");

  const available = TOOLS.filter((t) => t.available);
  const categories = CATEGORY_ORDER.filter((k) => TOOLS.some((t) => t.category === k));

  const visible = useMemo(
    () => (filter === "all" ? TOOLS : TOOLS.filter((t) => t.category === filter)),
    [filter],
  );

  const facts: [string, string][] = [
    [el ? "Ζωντανά εργαλεία" : "Live tools", `${available.length} / ${TOOLS.length}`],
    [el ? "Κόστος" : "Cost", el ? "Δωρεάν, χωρίς εγγραφή" : "Free, no signup"],
    [el ? "Μεθοδολογία" : "Methodology", el ? "Δημοσιευμένη σε κάθε σελίδα" : "Published on each page"],
    [el ? "Εξαγωγή" : "Export", el ? "PDF και CSV" : "PDF and CSV"],
  ];

  const tabBase =
    "inline-flex h-10 items-center gap-2 whitespace-nowrap border px-4 text-[14px] font-semibold tracking-[-0.005em] transition-colors";

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-[var(--accent-lime)] selection:text-black">
      <MarketingHeader />

      {/* ------------------------------------------------------------- Hero */}
      <section className="relative isolate flex min-h-[62svh] w-full flex-col overflow-hidden sm:min-h-[58svh]">
        <div className="absolute inset-0 -z-10">
          <Image
            src={heroPhoto}
            alt="A Nicosia desk at dusk with printed energy bills and emission worksheets"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[70%_center] sm:object-center"
          />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/65 to-transparent" />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-black/80 via-black/45 to-transparent md:block" />
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-12 pt-28 sm:px-8 sm:pb-14 sm:pt-32">
          <div className="w-full max-w-3xl">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/75">{eyebrow}</p>
            <h1
              className="mt-4 font-[family-name:var(--editorial-display)] text-[2.4rem] font-semibold leading-[1.03] tracking-[-0.025em] text-white sm:text-[3.6rem]"
              style={{ textWrap: "balance" }}
            >
              {heading}
            </h1>
            <p className="mt-5 max-w-xl text-[16.5px] font-medium leading-[1.6] text-white/85 sm:text-[17.5px]">
              {subheading}
            </p>
            <p className="mt-6 text-[14px] font-semibold text-white/70">
              {countLabel
                .replace("{count}", String(TOOLS.length))
                .replace("{available}", String(available.length))}
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Fact strip */}
      <section className="border-b border-border/60">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border/60 lg:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label} className="bg-background px-5 py-6 sm:px-7">
              <dt className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-foreground/60">
                {label}
              </dt>
              <dd className="mt-2 text-[17px] font-semibold leading-[1.25] tracking-[-0.01em] text-foreground sm:text-[19px]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------------------------------------------------------- Filters */}
      <div className="sticky top-[76px] z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div
            role="tablist"
            aria-label={el ? "Κατηγορίες εργαλείων" : "Tool categories"}
            className="-mx-1 flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <button
              type="button"
              role="tab"
              aria-selected={filter === "all"}
              onClick={() => setFilter("all")}
              className={[
                tabBase,
                "ml-1",
                filter === "all"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border/70 text-foreground/70 hover:border-foreground/50 hover:text-foreground",
              ].join(" ")}
            >
              {el ? "Όλα" : "All tools"}
              <span className="text-[13px] font-medium opacity-70">{TOOLS.length}</span>
            </button>
            {categories.map((key) => {
              const count = TOOLS.filter((t) => t.category === key).length;
              const active = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(key)}
                  className={[
                    tabBase,
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border/70 text-foreground/70 hover:border-foreground/50 hover:text-foreground",
                  ].join(" ")}
                >
                  {CATEGORY_META[key][locale].label}
                  <span className="text-[13px] font-medium opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------- Directory */}
      <section className="mx-auto max-w-6xl px-5 pb-4 pt-10 sm:px-8 sm:pt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-border/60 pb-4">
          <h2 className="font-[family-name:var(--editorial-display)] text-[1.7rem] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2rem]">
            {filter === "all"
              ? el
                ? "Όλα τα εργαλεία"
                : "All tools"
              : CATEGORY_META[filter][locale].label}
          </h2>
          <p className="text-[14.5px] font-medium text-foreground/65">
            {filter === "all"
              ? el
                ? "Επιλέξτε κατηγορία για φιλτράρισμα."
                : "Filter by category above."
              : CATEGORY_META[filter][locale].description}
          </p>
        </div>

        <ul className="grid gap-px bg-border/60 sm:grid-cols-2">
          {visible.map((tool) => {
            const c = tool[locale];
            const body = (
              <>
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/40">
                  <Image
                    src={tool.heroImage}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className={[
                      "object-cover transition-transform duration-700",
                      tool.available ? "group-hover:scale-[1.04]" : "opacity-55 grayscale",
                    ].join(" ")}
                  />
                </div>

                <div className="flex flex-1 flex-col px-5 py-6 sm:px-7 sm:py-7">
                  <p className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-foreground/55">
                    {CATEGORY_META[tool.category][locale].label}
                  </p>
                  <h3
                    className={[
                      "mt-2.5 font-[family-name:var(--editorial-display)] text-[1.4rem] font-semibold leading-[1.15] tracking-[-0.02em] transition-colors sm:text-[1.55rem]",
                      tool.available ? "group-hover:text-primary" : "text-foreground/60",
                    ].join(" ")}
                  >
                    {c.title}
                  </h3>
                  <p className="mt-3 text-[15.5px] leading-[1.6] text-foreground/70">{c.cardDescription}</p>

                  <p className="mt-6 flex items-center gap-2 border-t border-border/60 pt-4 text-[14px] font-semibold text-foreground/75">
                    {tool.available ? (
                      <>
                        {availableLabel}
                        <span aria-hidden className="transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </>
                    ) : (
                      <span className="text-foreground/55">{comingSoonLabel}</span>
                    )}
                  </p>
                </div>
              </>
            );

            return (
              <li key={tool.slug} className="flex bg-background">
                {tool.available ? (
                  <Link
                    href={`/${locale}/tools/${tool.slug}`}
                    className="group flex w-full flex-col"
                    aria-label={c.title}
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="group flex w-full cursor-default flex-col" aria-disabled>
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ------------------------------------------------------------- CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <h2 className="font-[family-name:var(--editorial-display)] text-[2rem] font-semibold leading-[1.06] tracking-[-0.025em] sm:text-[2.9rem]">
              {ctaHeading}
            </h2>
            <p className="mt-5 max-w-xl text-[16.5px] leading-[1.62] text-foreground/70">{ctaBody}</p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row md:col-span-5 md:justify-end">
            <Link href={`/${locale}/auth`} className={ACCENT_BUTTON}>
              {ctaAction}
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-foreground/25 px-6 text-[15px] font-semibold text-foreground transition-colors hover:border-foreground"
            >
              {el ? "Δείτε τα πακέτα" : "See pricing"}
            </Link>
          </div>
        </div>
      </section>

      <LearnLinksSection />
    </div>
  );
}
