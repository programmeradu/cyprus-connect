"use client";

import Link from "next/link";
import Image from "next/image";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { TOOLS, CATEGORY_META, type Locale, type ToolCategory } from "@/data/tools";

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

const SANS: React.CSSProperties = {
  fontFamily: "var(--editorial-sans)",
  fontFeatureSettings: '"ss01", "ss02", "cv11"',
};

const CATEGORY_ORDER: ToolCategory[] = ["carbon", "cbam", "csrd", "vsme", "taxonomy"];

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
  const available = TOOLS.filter((t) => t.available);

  return (
    <div style={SANS}>
      <MarketingHeader />

      <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-8 sm:pt-16">
        {/* Editorial header */}
        <header className="mx-auto mb-16 max-w-3xl sm:mb-24 sm:text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary sm:text-xs">
            {eyebrow}
          </p>
          <h1
            className="mt-5 text-[44px] font-semibold leading-[0.98] tracking-[-0.03em] sm:mt-7 sm:text-[72px] md:text-[88px]"
            style={SANS}
          >
            {heading}
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-[1.55] text-foreground/70 sm:mx-auto sm:text-[19px] sm:leading-[1.5]">
            {subheading}
          </p>
          <p className="mt-5 text-[13px] tabular-nums text-foreground/50">
            {countLabel.replace("{count}", String(TOOLS.length)).replace("{available}", String(available.length))}
          </p>
        </header>

        {/* Grid by category */}
        {CATEGORY_ORDER.filter((k) => TOOLS.some((t) => t.category === k)).map((catKey) => {
          const cat = CATEGORY_META[catKey][locale];
          const items = TOOLS.filter((t) => t.category === catKey);
          return (
            <section key={catKey} className="mb-16 sm:mb-20">
              <div className="mb-6 flex items-baseline justify-between border-b border-foreground/10 pb-3">
                <div>
                  <h2
                    className="text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[32px]"
                    style={SANS}
                  >
                    {cat.label}
                  </h2>
                  <p className="mt-1 text-[13px] text-foreground/55 sm:text-[14px]">
                    {cat.description}
                  </p>
                </div>
                <span className="text-[11px] tabular-nums text-foreground/40">
                  {String(items.length).padStart(2, "0")}
                </span>
              </div>

              <ul className="grid gap-8 sm:grid-cols-2">
                {items.map((tool) => {
                  const c = tool[locale];
                  const inner = (
                    <>
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                        <Image
                          src={tool.heroImage}
                          alt={c.title}
                          fill
                          sizes="(min-width: 640px) 50vw, 100vw"
                          className={`object-cover transition-transform duration-700 ${
                            tool.available ? "group-hover:scale-[1.03]" : "opacity-60"
                          }`}
                        />
                      </div>
                      <div className="mt-5">
                        <p className="flex items-center gap-3 text-[10.5px] font-medium uppercase tracking-[0.22em] text-primary">
                          <span>{c.eyebrow}</span>
                          <span
                            className={`tabular-nums ${
                              tool.available ? "text-foreground/45" : "text-foreground/40"
                            }`}
                          >
                            · {tool.available ? availableLabel : comingSoonLabel}
                          </span>
                        </p>
                        <h3
                          className={`mt-2.5 text-[22px] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[26px] ${
                            tool.available
                              ? "text-foreground group-hover:text-primary"
                              : "text-foreground/70"
                          }`}
                          style={SANS}
                        >
                          {c.title}
                        </h3>
                        <p className="mt-2.5 text-[14.5px] leading-[1.55] text-foreground/65">
                          {c.cardDescription}
                        </p>
                      </div>
                    </>
                  );

                  return (
                    <li key={tool.slug}>
                      {tool.available ? (
                        <Link
                          href={`/${locale}/tools/${tool.slug}`}
                          className="group block"
                          aria-label={c.title}
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div className="block cursor-not-allowed" aria-disabled>
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

        {/* CTA */}
        <section className="mt-8 border-t border-foreground/15 pt-14 sm:pt-20">
          <div className="mx-auto max-w-2xl sm:text-center">
            <h2
              className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[40px]"
              style={SANS}
            >
              {ctaHeading}
            </h2>
            <p className="mt-4 text-[16px] leading-[1.6] text-foreground/65 sm:text-[17px]">
              {ctaBody}
            </p>
            <div className="mt-8 flex flex-wrap gap-4 sm:justify-center">
              <Link
                href={`/${locale}/auth`}
                className="inline-flex h-11 items-center border border-foreground bg-foreground px-6 text-[14px] font-medium tracking-[-0.005em] text-background transition hover:bg-foreground/85"
              >
                {ctaAction}
              </Link>
              <Link
                href={`/${locale}/learn`}
                className="inline-flex h-11 items-center border border-foreground/25 px-6 text-[14px] font-medium tracking-[-0.005em] text-foreground transition hover:border-foreground"
              >
                {locale === "el" ? "Δείτε τους οδηγούς →" : "Explore the guides →"}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
