"use client";

import Link from "next/link";
import Image from "next/image";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { LearnLinksSection } from "@/components/learn/LearnLinksSection";
import { TOOLS, CATEGORY_META, type Locale, type ToolCategory } from "@/data/tools";
import heroPhoto from "@/assets/hub-tools-desk.jpg";

/**
 * /tools - the free tool register.
 *
 * House rules: Fraunces display + Instrument Sans body, cinematic hero so the
 * fixed header stays legible, hairline ledger rows and numerals for hierarchy,
 * no pills, no icons, no thin low-contrast metadata.
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
  const available = TOOLS.filter((t) => t.available);
  const sections = CATEGORY_ORDER.filter((k) => TOOLS.some((t) => t.category === k));

  const facts: [string, string][] = [
    [el ? "Ζωντανά εργαλεία" : "Live tools", `${available.length} / ${TOOLS.length}`],
    [el ? "Κόστος" : "Cost", el ? "Δωρεάν, χωρίς εγγραφή" : "Free, no signup"],
    [el ? "Μεθοδολογία" : "Methodology", el ? "Δημοσιευμένη σε κάθε σελίδα" : "Published on every page"],
    [el ? "Εξαγωγή" : "Export", el ? "PDF και CSV" : "PDF and CSV"],
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-[var(--accent-lime)] selection:text-black">
      <MarketingHeader />

      {/* ------------------------------------------------------------- Hero */}
      <section className="relative isolate flex min-h-[86svh] w-full flex-col overflow-hidden sm:min-h-[80svh]">
        <div className="absolute inset-0 -z-10">
          <Image
            src={heroPhoto}
            alt="A Nicosia desk at dusk with printed energy bills and emission worksheets"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[70%_center] sm:object-center"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-black/80 via-black/40 to-transparent md:block" />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
              backgroundSize: "240px 240px",
            }}
          />
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-16 pt-28 text-center sm:px-8 sm:pb-20 sm:pt-36 md:justify-end md:text-left">
          <div className="mx-auto w-full max-w-3xl md:mx-0">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/75">{eyebrow}</p>
            <h1
              className="mt-5 font-[family-name:var(--editorial-display)] text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.025em] text-white sm:text-[4rem]"
              style={{ textWrap: "balance" }}
            >
              {heading}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-[16.5px] font-medium leading-[1.6] text-white/85 sm:text-[18px] md:mx-0">
              {subheading}
            </p>
            <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center md:justify-start">
              <a href="#register" className={ACCENT_BUTTON}>
                {el ? "Δείτε τα εργαλεία" : "Browse the tools"}
              </a>
              <Link
                href={`/${locale}/learn`}
                className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-white/30 px-6 text-[15px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10"
              >
                {el ? "Οδηγοί" : "Read the guides"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- Fact ledger */}
      <section className="border-b border-border/60">
        <dl className="mx-auto grid max-w-6xl grid-cols-1 gap-px bg-border/60 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label} className="bg-background px-5 py-7 sm:px-7">
              <dt className="text-[13px] font-semibold uppercase tracking-[0.1em] text-foreground/60">{label}</dt>
              <dd className="mt-2 font-[family-name:var(--editorial-display)] text-[24px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[27px]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mx-auto max-w-6xl px-5 pt-8 text-[14.5px] font-medium text-foreground/60 sm:px-8">
        {countLabel.replace("{count}", String(TOOLS.length)).replace("{available}", String(available.length))}
      </p>

      {/* -------------------------------------------------------- Register */}
      <div id="register" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-4 sm:px-8">
        {sections.map((catKey, catIndex) => {
          const cat = CATEGORY_META[catKey][locale];
          const items = TOOLS.filter((t) => t.category === catKey);

          return (
            <section key={catKey} className="pt-14 sm:pt-20">
              <div className="grid gap-6 border-b border-border/60 pb-6 md:grid-cols-12 md:items-end">
                <div className="md:col-span-8">
                  <div className="flex items-baseline gap-4 sm:gap-6">
                    <span
                      aria-hidden
                      className="font-[family-name:var(--editorial-display)] text-[1.5rem] italic leading-none tracking-[-0.03em] text-foreground/25 sm:text-[1.9rem]"
                    >
                      {String(catIndex + 1).padStart(2, "0")}
                    </span>
                    <h2 className="font-[family-name:var(--editorial-display)] text-[1.9rem] font-semibold leading-[1.06] tracking-[-0.025em] sm:text-[2.6rem]">
                      {cat.label}
                    </h2>
                  </div>
                  <p className="mt-3 max-w-xl text-[16px] leading-[1.6] text-foreground/70 sm:pl-[3.4rem]">
                    {cat.description}
                  </p>
                </div>
                <p className="text-[14px] font-semibold text-foreground/55 md:col-span-4 md:text-right">
                  {items.filter((i) => i.available).length} {el ? "διαθέσιμα" : "live"} · {items.length}{" "}
                  {el ? "συνολικά" : "total"}
                </p>
              </div>

              <ul>
                {items.map((tool) => {
                  const c = tool[locale];
                  const inner = (
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-5 sm:gap-8">
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-foreground/55">{c.eyebrow}</p>
                        <h3
                          className={[
                            "mt-2 font-[family-name:var(--editorial-display)] text-[1.35rem] font-semibold leading-[1.16] tracking-[-0.02em] transition-colors sm:text-[1.75rem]",
                            tool.available ? "text-foreground group-hover:text-primary" : "text-foreground/60",
                          ].join(" ")}
                        >
                          {c.title}
                        </h3>
                        <p className="mt-3 max-w-2xl text-[15.5px] leading-[1.62] text-foreground/70">
                          {c.cardDescription}
                        </p>
                        <p className="mt-4 text-[14px] font-semibold text-foreground/60">
                          {tool.available ? (
                            <span className="inline-flex items-center gap-2 text-foreground/80">
                              {availableLabel}
                              <span
                                aria-hidden
                                className="transition-transform group-hover:translate-x-1"
                              >
                                →
                              </span>
                            </span>
                          ) : (
                            comingSoonLabel
                          )}
                        </p>
                      </div>

                      <div
                        className={[
                          "relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border/50 bg-muted/40 sm:h-28 sm:w-40",
                          tool.available ? "" : "opacity-55 grayscale",
                        ].join(" ")}
                      >
                        <Image
                          src={tool.heroImage}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 160px, 80px"
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                        />
                      </div>
                    </div>
                  );

                  return (
                    <li key={tool.slug} className="border-b border-border/60">
                      {tool.available ? (
                        <Link
                          href={`/${locale}/tools/${tool.slug}`}
                          className="group block py-8 transition-colors sm:py-10"
                          aria-label={c.title}
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div className="group block cursor-default py-8 sm:py-10" aria-disabled>
                          {inner}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

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
