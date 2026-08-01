"use client";

import Link from "next/link";
import Image from "next/image";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { getPillar } from "@/data/learn/pillars";
import type { Locale } from "@/data/tools";

export type FaqItem = { q: string; a: string };
export type MethodologyItem = { label: string; value: string };

type Props = {
  locale: Locale;
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  heroImage: string;
  updatedAt: string;
  /** The interactive widget itself - a client component. */
  children: React.ReactNode;
  methodologyHeading: string;
  methodologyIntro: string;
  methodology: MethodologyItem[];
  workedExampleHeading: string;
  workedExampleBody: React.ReactNode;
  faqHeading: string;
  faq: FaqItem[];
  relatedHeading: string;
  relatedPillarSlugs: string[];
  ctaHeading: string;
  ctaBody: string;
  ctaAction: string;
};

const SANS: React.CSSProperties = {
  fontFamily: '"Instrument Sans", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif',
  fontFeatureSettings: '"ss01", "cv11"',
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "-0.005em",
};

const DISPLAY: React.CSSProperties = {
  fontFamily: '"FrauncesAmpFix", "Fraunces", ui-serif, Georgia, serif',
  fontOpticalSizing: "auto",
  letterSpacing: "-0.02em",
};

export default function ToolShell({
  locale,
  eyebrow,
  title,
  subtitle,
  heroImage,
  updatedAt,
  children,
  methodologyHeading,
  methodologyIntro,
  methodology,
  workedExampleHeading,
  workedExampleBody,
  faqHeading,
  faq,
  relatedHeading,
  relatedPillarSlugs,
  ctaHeading,
  ctaBody,
  ctaAction,
}: Props) {
  const related = relatedPillarSlugs
    .map((s) => {
      const p = getPillar(s);
      if (!p) return null;
      const c = p[locale];
      return {
        slug: p.slug,
        eyebrow: c.heroEyebrow,
        title: c.title,
        heroImage: p.heroImage,
        readingMinutes: p.readingMinutes,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const updatedLabel = locale === "el" ? "Ενημερώθηκε" : "Current revision";
  const updatedFmt = new Date(updatedAt).toLocaleDateString(locale === "el" ? "el-CY" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const minRead = locale === "el" ? "min" : "min read";

  return (
    <div style={SANS} className="viq-tool print:!bg-white print:!text-black">
      <div className="print:hidden">
        <MarketingHeader />
      </div>

      <article className="mx-auto w-full max-w-5xl px-5 pb-24 pt-24 sm:px-8 sm:pt-28 md:pt-32">
        {/* Hero */}
        <header className="mb-14 sm:mb-20">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center md:gap-14">
            <div>
              <p className="viq-kicker text-primary">{eyebrow}</p>
              <h1
                className="mt-3 text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] sm:mt-4 sm:text-[46px]"
                style={DISPLAY}
              >
                {title}
              </h1>
              <p className="mt-5 max-w-xl text-[16px] leading-[1.6] text-foreground/70 sm:text-[17px]">
                {subtitle}
              </p>
              <p className="viq-date mt-6">
                <strong>{updatedLabel}</strong> {updatedFmt}
              </p>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted print:hidden">
              <Image
                src={heroImage}
                alt=""
                fill
                sizes="(min-width: 768px) 45vw, 100vw"
                priority
                className="object-cover"
              />
            </div>
          </div>
        </header>

        {/* The tool itself */}
        <section id="tool" className="scroll-mt-24">
          {children}
        </section>

        {/* Methodology */}
        <section className="mt-20 border-t border-foreground/10 pt-12 sm:mt-24">
          <h2
            className="text-[24px] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[30px]"
            style={DISPLAY}
          >
            {methodologyHeading}
          </h2>
          <p className="mt-4 max-w-3xl text-[15.5px] leading-[1.65] text-foreground/70 sm:text-[16px]">
            {methodologyIntro}
          </p>
          <dl className="mt-8 divide-y divide-foreground/10 border-y border-foreground/10">
            {methodology.map((m, i) => (
              <div
                key={i}
                className="grid gap-2 py-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-8"
              >
                <dt className="text-[14.5px] font-medium text-foreground">
                  {m.label}
                </dt>
                <dd className="text-[14.5px] leading-[1.6] text-foreground/70">
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Worked example */}
        <section className="mt-20 border-t border-foreground/10 pt-12 sm:mt-24">
          <h2
            className="text-[24px] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[30px]"
            style={DISPLAY}
          >
            {workedExampleHeading}
          </h2>
          <div className="mt-5 max-w-3xl text-[15.5px] leading-[1.7] text-foreground/75 sm:text-[16px]">
            {workedExampleBody}
          </div>
        </section>

        {/* FAQ */}
        {faq.length > 0 && (
          <section className="mt-20 border-t border-foreground/10 pt-12 print:hidden sm:mt-24">
            <h2
              className="text-[24px] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[30px]"
              style={DISPLAY}
            >
              {faqHeading}
            </h2>
            <ul className="mt-8 divide-y divide-foreground/10 border-y border-foreground/10">
              {faq.map((f, i) => (
                <li key={i}>
                  <details className="group py-5">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
                      <span className="text-[16px] font-medium leading-[1.4] text-foreground sm:text-[17px]">
                        {f.q}
                      </span>
                      <span
                        aria-hidden
                        className="mt-1 shrink-0 text-[18px] leading-none text-foreground/40 transition group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <div className="mt-3 max-w-3xl text-[15px] leading-[1.7] text-foreground/70">
                      {f.a}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Related guides */}
        {related.length > 0 && (
          <section className="mt-20 border-t border-foreground/10 pt-12 print:hidden sm:mt-24">
            <h2
              className="text-[24px] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[30px]"
              style={DISPLAY}
            >
              {relatedHeading}
            </h2>
            <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/${locale}/learn/${r.slug}`} className="group block">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={r.heroImage}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="mt-4">
                      <p className="viq-kicker text-primary">
                        {r.eyebrow}
                      </p>
                      <h3
                        className="mt-1.5 text-[17px] font-semibold leading-[1.3] tracking-[-0.005em] text-foreground group-hover:text-primary"
                        style={SANS}
                      >
                        {r.title}
                      </h3>
                      <p className="viq-meta mt-2">
                        {r.readingMinutes} {minRead}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA */}
        <section className="mt-20 border-t border-foreground/10 pt-12 print:hidden sm:mt-24">
          <div className="mx-auto max-w-2xl sm:text-center">
            <h2
              className="text-[26px] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[34px]"
              style={DISPLAY}
            >
              {ctaHeading}
            </h2>
            <p className="mt-4 text-[16px] leading-[1.6] text-foreground/70">
              {ctaBody}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 sm:justify-center">
              <Link
                href={`/${locale}/auth`}
                className="inline-flex h-11 items-center rounded-md bg-foreground px-6 text-[14.5px] font-medium text-background transition hover:bg-foreground/85"
              >
                {ctaAction}
              </Link>
              <Link
                href={`/${locale}/tools`}
                className="inline-flex h-11 items-center rounded-md border border-foreground/20 px-6 text-[14.5px] font-medium text-foreground transition hover:border-foreground/60"
              >
                {locale === "el" ? "Όλα τα εργαλεία" : "All tools"}
              </Link>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}
