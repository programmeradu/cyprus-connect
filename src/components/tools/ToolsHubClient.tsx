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

const CATEGORY_ORDER: ToolCategory[] = ["carbon", "cbam", "csrd", "vsme", "taxonomy"];

export default function ToolsHubClient({
  locale,
  heading,
  subheading,
  countLabel,
  comingSoonLabel,
  ctaHeading,
  ctaBody,
  ctaAction,
}: Props) {
  const available = TOOLS.filter((t) => t.available);

  return (
    <div>
      <MarketingHeader />

      <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
        {/* Header */}
        <header className="mb-20 max-w-3xl sm:mb-28">
          <h1 className="text-[44px] font-semibold leading-[1.02] tracking-[-0.025em] sm:text-[68px] md:text-[80px]">
            {heading}
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-[1.6] text-foreground/70 sm:text-[19px]">
            {subheading}
          </p>
          <p className="mt-6 text-[14px] text-foreground/50">
            {countLabel
              .replace("{count}", String(TOOLS.length))
              .replace("{available}", String(available.length))}
          </p>
        </header>

        {/* Grid by category */}
        {CATEGORY_ORDER.filter((k) => TOOLS.some((t) => t.category === k)).map((catKey) => {
          const cat = CATEGORY_META[catKey][locale];
          const items = TOOLS.filter((t) => t.category === catKey);
          return (
            <section key={catKey} className="mb-20 sm:mb-24">
              <div className="mb-8 border-b border-foreground/10 pb-4">
                <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[34px]">
                  {cat.label}
                </h2>
                <p className="mt-2 max-w-xl text-[15px] leading-[1.5] text-foreground/60">
                  {cat.description}
                </p>
              </div>

              <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2">
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
                        {!tool.available && (
                          <span className="absolute left-3 top-3 border border-foreground/20 bg-background/90 px-2 py-1 text-[12px] font-medium text-foreground/70 backdrop-blur">
                            {comingSoonLabel}
                          </span>
                        )}
                      </div>
                      <div className="mt-5">
                        <h3
                          className={`text-[22px] font-semibold leading-[1.2] tracking-[-0.015em] sm:text-[26px] ${
                            tool.available
                              ? "text-foreground group-hover:text-primary"
                              : "text-foreground/70"
                          }`}
                        >
                          {c.title}
                        </h3>
                        <p className="mt-3 text-[15px] leading-[1.6] text-foreground/65">
                          {c.cardDescription}
                        </p>
                        <p className="mt-4 text-[13.5px] text-foreground/45">{c.eyebrow}</p>
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
        <section className="mt-8 border-t border-foreground/15 pt-16 sm:pt-20">
          <div className="max-w-2xl">
            <h2 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[40px]">
              {ctaHeading}
            </h2>
            <p className="mt-4 text-[16px] leading-[1.6] text-foreground/70 sm:text-[17px]">
              {ctaBody}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/${locale}/auth`}
                className="inline-flex h-11 items-center border border-foreground bg-foreground px-6 text-[14.5px] font-medium text-background transition hover:bg-foreground/85"
              >
                {ctaAction}
              </Link>
              <Link
                href={`/${locale}/learn`}
                className="inline-flex h-11 items-center border border-foreground/25 px-6 text-[14.5px] font-medium text-foreground transition hover:border-foreground"
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
