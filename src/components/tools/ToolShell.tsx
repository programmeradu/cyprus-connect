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
  /** The interactive widget itself — a client component. */
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
  fontFamily: "var(--editorial-sans)",
  fontFeatureSettings: '"ss01", "ss02", "cv11"',
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

  const updatedLabel = locale === "el" ? "Ενημερώθηκε" : "Updated";
  const updatedFmt = new Date(updatedAt).toLocaleDateString(locale === "el" ? "el-CY" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const minRead = locale === "el" ? "min" : "min read";

  return (
    <div style={SANS} className="print:!bg-white print:!text-black">
      <div className="print:hidden">
        <MarketingHeader />
      </div>

      <article className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
        {/* Hero */}
        <header className="mb-14 sm:mb-20">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end md:gap-14">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary sm:text-xs">
                {eyebrow}
              </p>
              <h1
                className="mt-4 text-[38px] font-semibold leading-[1.02] tracking-[-0.03em] sm:mt-6 sm:text-[56px] md:text-[64px]"
                style={SANS}
              >
                {title}
              </h1>
              <p className="mt-5 max-w-xl text-[16px] leading-[1.55] text-foreground/70 sm:text-[18px]">
                {subtitle}
              </p>
              <p className="mt-6 text-[12px] tabular-nums uppercase tracking-[0.2em] text-foreground/45">
                {updatedLabel} · {updatedFmt}
              </p>
            </div>
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted print:hidden">
              <Image
                src={heroImage}
                alt=""
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
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
        <section className="mt-20 border-t border-foreground/15 pt-14 sm:mt-24">
          <div className="grid gap-10 md:grid-cols-[240px_minmax(0,1fr)] md:gap-16">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-foreground/55">
                02 · {locale === "el" ? "Μεθοδολογία" : "Methodology"}
              </p>
              <h2
                className="mt-3 text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[36px]"
                style={SANS}
              >
                {methodologyHeading}
              </h2>
            </div>
            <div>
              <p className="max-w-2xl text-[15.5px] leading-[1.65] text-foreground/70 sm:text-[16.5px]">
                {methodologyIntro}
              </p>
              <dl className="mt-8 divide-y divide-foreground/10 border-y border-foreground/15">
                {methodology.map((m, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[28px_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[40px_180px_minmax(0,1fr)] sm:gap-6"
                  >
                    <span className="tabular-nums text-[11px] font-semibold text-foreground/40">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <dt className="text-[14px] font-medium tracking-[-0.005em] text-foreground/80 sm:col-span-1">
                      {m.label}
                    </dt>
                    <dd className="col-span-2 text-[14px] leading-[1.6] text-foreground/65 sm:col-span-1 sm:col-start-3">
                      {m.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Worked example */}
        <section className="mt-20 border-t border-foreground/15 pt-14 sm:mt-24">
          <div className="grid gap-10 md:grid-cols-[240px_minmax(0,1fr)] md:gap-16">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-foreground/55">
                03 · {locale === "el" ? "Παράδειγμα" : "Worked example"}
              </p>
              <h2
                className="mt-3 text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[36px]"
                style={SANS}
              >
                {workedExampleHeading}
              </h2>
            </div>
            <div className="max-w-2xl text-[15.5px] leading-[1.7] text-foreground/75 sm:text-[16.5px]">
              {workedExampleBody}
            </div>
          </div>
        </section>

        {/* FAQ */}
        {faq.length > 0 && (
          <section className="mt-20 border-t border-foreground/15 pt-14 print:hidden sm:mt-24">
            <div className="mb-8">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-foreground/55">
                04 · FAQ
              </p>
              <h2
                className="mt-3 text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[36px]"
                style={SANS}
              >
                {faqHeading}
              </h2>
            </div>
            <ul className="divide-y divide-foreground/10 border-y border-foreground/15">
              {faq.map((f, i) => (
                <li key={i} className="py-6">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
                      <div className="grid grid-cols-[28px_minmax(0,1fr)] items-baseline gap-4">
                        <span className="tabular-nums text-[11px] font-semibold text-foreground/40">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[16px] font-medium leading-[1.35] tracking-[-0.01em] text-foreground sm:text-[17.5px]">
                          {f.q}
                        </span>
                      </div>
                      <span
                        aria-hidden
                        className="shrink-0 pt-0.5 text-[18px] leading-none text-foreground/40 transition group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <div className="ml-[44px] mt-3 max-w-3xl text-[14.5px] leading-[1.7] text-foreground/70 sm:text-[15.5px]">
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
          <section className="mt-20 border-t border-foreground/15 pt-14 print:hidden sm:mt-24">
            <div className="mb-8 flex items-baseline justify-between border-b border-foreground/10 pb-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-foreground/60">
                05 · {relatedHeading}
              </p>
              <span className="tabular-nums text-[11px] text-foreground/40">
                {String(related.length).padStart(2, "0")}
              </span>
            </div>
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/${locale}/learn/${r.slug}`} className="group block">
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                      <Image
                        src={r.heroImage}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="mt-4">
                      <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-primary">
                        {r.eyebrow}
                      </p>
                      <h3
                        className="mt-2 text-[18px] font-semibold leading-[1.2] tracking-[-0.01em] text-foreground group-hover:text-primary sm:text-[20px]"
                        style={SANS}
                      >
                        {r.title}
                      </h3>
                      <p className="mt-3 text-[11.5px] tabular-nums text-foreground/45">
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
        <section className="mt-20 border-t border-foreground/15 pt-14 print:hidden sm:mt-24">
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
                href={`/${locale}/tools`}
                className="inline-flex h-11 items-center border border-foreground/25 px-6 text-[14px] font-medium tracking-[-0.005em] text-foreground transition hover:border-foreground"
              >
                {locale === "el" ? "Όλα τα εργαλεία →" : "All tools →"}
              </Link>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}
