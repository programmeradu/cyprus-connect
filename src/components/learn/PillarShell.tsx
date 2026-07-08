"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type TocItem = { id: string; heading: string };

type PillarShellProps = {
  locale: "en" | "el";
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  heroImage: string;
  updatedAt: string;
  readingMinutes: number;
  tocLabel: string;
  toc: TocItem[];
  keyTakeaways: string[];
  introduction: React.ReactNode;
  sectionsContent: React.ReactNode;
  faq: { q: string; a: string }[];
  afterFaq?: React.ReactNode;
  cta: { heading: string; body: string };
  related: {
    slug: string;
    heroImage: string;
    eyebrow: string;
    title: string;
    readingMinutes: number;
  }[];
};

const SERIF: React.CSSProperties = {
  fontFamily: "var(--editorial-serif, ui-serif, Georgia, 'Times New Roman', serif)",
  fontFeatureSettings: '"ss01", "ss02"',
};

export default function PillarShell({
  locale,
  eyebrow,
  title,
  subtitle,
  heroImage,
  updatedAt,
  readingMinutes,
  tocLabel,
  toc,
  keyTakeaways,
  introduction,
  sectionsContent,
  faq,
  afterFaq,
  cta,
  related,
}: PillarShellProps) {
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState<string>(toc[0]?.id ?? "");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
      setShowTop(window.scrollY > 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (toc.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0, 0.5, 1] }
    );
    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [toc]);

  const share = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* dismissed */
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const relatedLabel = locale === "el" ? "Συνεχίστε την ανάγνωση" : "Continue reading";
  const takeawaysLabel = locale === "el" ? "Βασικά συμπεράσματα" : "Key takeaways";
  const faqLabel = locale === "el" ? "Συχνές ερωτήσεις" : "Frequently asked questions";
  const shareLabel = locale === "el" ? "Κοινοποίηση" : "Share";
  const updatedLabel = locale === "el" ? "Ενημερώθηκε" : "Updated";
  const backLabel = locale === "el" ? "Επιστροφή στην κορυφή" : "Back to top";
  const tocMobileLabel = locale === "el" ? "Περιεχόμενα" : "On this page";

  return (
    <div className="bg-background text-foreground">
      {/* Reading progress */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-0.5 bg-transparent">
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Mobile TOC trigger — no icon, editorial label */}
      <button
        type="button"
        onClick={() => setMobileTocOpen(true)}
        className="fixed bottom-6 right-5 z-30 border border-foreground/15 bg-background/95 px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.18em] text-foreground shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15)] backdrop-blur lg:hidden"
        aria-label={tocMobileLabel}
      >
        {tocMobileLabel}
      </button>

      {mobileTocOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileTocOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto rounded-t-[24px] bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between border-b border-foreground/10 pb-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-foreground/60">
                {tocLabel}
              </p>
              <button
                onClick={() => setMobileTocOpen(false)}
                aria-label="Close"
                className="text-[11px] uppercase tracking-[0.18em] text-foreground/60 hover:text-foreground"
              >
                Close
              </button>
            </div>
            <ol className="space-y-1">
              {toc.map((t, i) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    onClick={() => setMobileTocOpen(false)}
                    className={`flex gap-4 py-3 text-[15px] leading-snug transition ${
                      activeId === t.id ? "text-primary" : "text-foreground/80"
                    }`}
                  >
                    <span className="w-6 shrink-0 tabular-nums text-[12px] text-foreground/40">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{t.heading}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl px-5 pb-24 pt-8 sm:px-8 sm:pt-14">
        {/* Breadcrumb — no icons, slash separators */}
        <nav aria-label="Breadcrumb" className="mb-10 text-[12px] text-foreground/50 sm:mb-14">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link href={`/${locale}`} className="hover:text-foreground">
                VerdeIQ
              </Link>
            </li>
            <li aria-hidden className="text-foreground/25">/</li>
            <li>
              <Link href={`/${locale}/learn`} className="hover:text-foreground">
                Learn
              </Link>
            </li>
            <li aria-hidden className="text-foreground/25">/</li>
            <li className="text-foreground/80" aria-current="page">
              {title}
            </li>
          </ol>
        </nav>

        {/* Hero — editorial, mobile-first, left-aligned on mobile, centered on desktop */}
        <header className="mx-auto mb-10 max-w-4xl sm:mb-14 sm:text-center">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.28em] text-primary sm:text-[11px]">
            {eyebrow}
          </p>
          <h1
            className="mt-5 text-balance text-[40px] font-normal leading-[0.98] tracking-[-0.03em] sm:mt-7 sm:text-[60px] md:text-[76px] lg:text-[84px]"
            style={SERIF}
          >
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-[17px] leading-[1.55] text-foreground/70 sm:mt-8 sm:text-[20px] sm:leading-[1.45]">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-foreground/55 sm:justify-center sm:text-[13px]">
            <span>
              {updatedLabel}{" "}
              <time dateTime={updatedAt} className="text-foreground/70">
                {new Date(updatedAt).toLocaleDateString(locale === "el" ? "el-CY" : "en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </span>
            <span aria-hidden className="text-foreground/25">·</span>
            <span className="tabular-nums">{readingMinutes} min read</span>
            <span aria-hidden className="text-foreground/25">·</span>
            <button
              type="button"
              onClick={share}
              className="text-foreground/70 underline decoration-foreground/20 underline-offset-4 transition hover:text-primary hover:decoration-primary"
            >
              {shareLabel}
            </button>
          </div>
        </header>

        {/* Hero image */}
        <div className="relative mx-auto mb-14 aspect-[4/3] w-full max-w-6xl overflow-hidden bg-muted sm:mb-20 sm:aspect-[16/9] sm:rounded-[2px]">
          <Image
            src={heroImage}
            alt={title}
            fill
            priority
            sizes="(min-width: 1280px) 1152px, 100vw"
            className="object-cover"
          />
        </div>

        {/* Main grid */}
        <div ref={articleRef} className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)_240px] lg:gap-16">
          {/* Left TOC — desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="mb-5 text-[10.5px] font-medium uppercase tracking-[0.24em] text-foreground/50">
                {tocLabel}
              </p>
              <ol className="space-y-0 border-l border-foreground/10">
                {toc.map((t, i) => (
                  <li key={t.id}>
                    <a
                      href={`#${t.id}`}
                      className={`-ml-px flex gap-3 border-l-2 py-2 pl-4 text-[13.5px] leading-[1.4] transition ${
                        activeId === t.id
                          ? "border-primary font-medium text-primary"
                          : "border-transparent text-foreground/55 hover:border-foreground/30 hover:text-foreground"
                      }`}
                    >
                      <span className="shrink-0 tabular-nums text-[11px] opacity-60">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{t.heading}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          {/* Article */}
          <div className="min-w-0">
            {/* Key takeaways — no bullet dots, numeric prefix */}
            <aside
              aria-label={takeawaysLabel}
              className="mb-12 border-y border-foreground/10 py-8 sm:mb-14"
            >
              <p className="mb-6 text-[10.5px] font-medium uppercase tracking-[0.24em] text-primary">
                {takeawaysLabel}
              </p>
              <ol className="space-y-4">
                {keyTakeaways.map((k, i) => (
                  <li key={i} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 text-[15.5px] leading-[1.55] text-foreground/85 sm:text-[16px]">
                    <span className="pt-0.5 tabular-nums text-[12px] text-primary/70">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{k}</span>
                  </li>
                ))}
              </ol>
            </aside>

            {/* Intro */}
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-normal prose-headings:tracking-[-0.02em] prose-p:leading-[1.7] prose-p:text-foreground/80 prose-p:text-[17px] prose-a:text-primary prose-a:decoration-primary/40 prose-a:underline-offset-4 hover:prose-a:decoration-primary [&_h2]:!font-serif [&_h3]:!font-serif" style={{ ["--tw-prose-headings" as string]: "var(--foreground)" }}>
              <style>{`.prose h1, .prose h2, .prose h3, .prose h4 { font-family: var(--editorial-serif); }`}</style>
              {introduction}
            </div>

            {/* Sections */}
            <div className="prose prose-lg mt-10 max-w-none dark:prose-invert prose-headings:font-normal prose-headings:tracking-[-0.02em] prose-h2:mt-16 prose-h2:mb-5 prose-h2:text-[32px] prose-h2:leading-[1.1] prose-h3:text-[22px] prose-p:leading-[1.7] prose-p:text-foreground/80 prose-p:text-[17px] prose-a:text-primary prose-a:decoration-primary/40 prose-a:underline-offset-4 hover:prose-a:decoration-primary prose-strong:text-foreground prose-strong:font-medium">
              {sectionsContent}
            </div>

            {/* FAQ */}
            <section aria-labelledby="faq-heading" className="mt-20 sm:mt-24">
              <h2
                id="faq-heading"
                className="text-[32px] font-normal leading-[1.05] tracking-[-0.02em] sm:text-[42px]"
                style={SERIF}
              >
                {faqLabel}
              </h2>
              <div className="mt-8 divide-y divide-foreground/10 border-y border-foreground/10">
                {faq.map((f, i) => (
                  <details
                    key={i}
                    className="group py-5 [&_summary::-webkit-details-marker]:hidden sm:py-6"
                  >
                    <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-start gap-5 text-[17px] font-normal leading-[1.35] tracking-[-0.01em] text-foreground sm:text-[19px]" style={SERIF}>
                      <span>{f.q}</span>
                      <span
                        aria-hidden
                        className="mt-1 shrink-0 text-[20px] leading-none text-foreground/40 transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-4 max-w-2xl text-[15.5px] leading-[1.65] text-foreground/65">
                      {f.a}
                    </p>
                  </details>
                ))}
              </div>
              {afterFaq}
            </section>

            {/* CTA — editorial, no icon */}
            <section className="mt-20 border-t border-foreground/10 pt-16 sm:mt-24">
              <h2
                className="max-w-3xl text-[32px] font-normal leading-[1.05] tracking-[-0.025em] sm:text-[48px]"
                style={SERIF}
              >
                {cta.heading}
              </h2>
              <p className="mt-5 max-w-2xl text-[17px] leading-[1.55] text-foreground/70 sm:text-[19px]">
                {cta.body}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Link
                  href={`/${locale}/auth/sign-up`}
                  className="inline-flex items-center justify-center bg-foreground px-7 py-3.5 text-[14px] font-medium text-background transition hover:bg-foreground/85"
                >
                  {locale === "el" ? "Δωρεάν δοκιμή" : "Start free trial"}
                </Link>
                <Link
                  href={`/${locale}/pricing`}
                  className="inline-flex items-center justify-center border border-foreground/20 px-7 py-3.5 text-[14px] font-medium text-foreground transition hover:border-foreground/60"
                >
                  {locale === "el" ? "Δείτε τα πλάνα" : "See pricing"}
                </Link>
              </div>
            </section>
          </div>

          {/* Right rail — desktop only */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div className="border-t border-foreground/15 pt-5">
                <p className="text-[10.5px] font-medium uppercase tracking-[0.24em] text-primary">
                  VerdeIQ
                </p>
                <p className="mt-3 text-[13.5px] leading-[1.55] text-foreground/70">
                  {locale === "el"
                    ? "Αυτοματοποιήστε τη λογιστική άνθρακα και τις αναφορές CSRD/VSME με AI."
                    : "Automate carbon accounting and CSRD/VSME reporting with AI."}
                </p>
                <Link
                  href={`/${locale}/auth/sign-up`}
                  className="mt-5 inline-flex w-full items-center justify-center bg-foreground px-4 py-2.5 text-[13px] font-medium text-background transition hover:bg-foreground/85"
                >
                  {locale === "el" ? "Ξεκινήστε δωρεάν" : "Start free"}
                </Link>
                <Link
                  href={`/${locale}/pricing`}
                  className="mt-2 block text-center text-[12.5px] text-foreground/60 underline underline-offset-4 hover:text-foreground"
                >
                  {locale === "el" ? "Πλάνα" : "See pricing"}
                </Link>
              </div>
              <button
                type="button"
                onClick={share}
                className="text-[11.5px] uppercase tracking-[0.2em] text-foreground/55 underline underline-offset-4 hover:text-primary"
              >
                {shareLabel}
              </button>
            </div>
          </aside>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section aria-labelledby="related" className="mx-auto mt-24 max-w-6xl sm:mt-28">
            <div className="mb-8 border-b border-foreground/10 pb-3">
              <h2
                id="related"
                className="text-[28px] font-normal leading-[1.05] tracking-[-0.02em] sm:text-[38px]"
                style={SERIF}
              >
                {relatedLabel}
              </h2>
            </div>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/${locale}/learn/${r.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    <Image
                      src={r.heroImage}
                      alt={r.title}
                      fill
                      sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  </div>
                  <p className="mt-4 text-[10.5px] font-medium uppercase tracking-[0.22em] text-primary">
                    {r.eyebrow}
                  </p>
                  <h3
                    className="mt-2 text-[20px] font-normal leading-[1.15] tracking-[-0.015em] text-foreground group-hover:text-primary sm:text-[22px]"
                    style={SERIF}
                  >
                    {r.title}
                  </h3>
                  <p className="mt-3 text-[12px] tabular-nums text-foreground/45">
                    {r.readingMinutes} min read
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Back to top */}
      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 left-5 z-30 hidden border border-foreground/15 bg-background/95 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-foreground/70 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15)] backdrop-blur transition hover:text-primary lg:block"
          aria-label={backLabel}
        >
          ↑ Top
        </button>
      )}
    </div>
  );
}
