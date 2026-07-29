"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

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

const SANS: React.CSSProperties = {
  fontFamily: "var(--editorial-sans)",
  fontFeatureSettings: '"ss01", "ss02", "cv11"',
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
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
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
    const shareText = locale === "el" ? "Σύνδεσμος αντιγράφηκε" : "Link copied to clipboard";
    const shareErr = locale === "el" ? "Αποτυχία κοινοποίησης" : "Sharing failed";

    // Try native share (mobile) first
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title,
          text: subtitle,
          url,
        });
        return;
      } catch (err: any) {
        // AbortError = user dismissed; anything else = fall through to clipboard
        if (err?.name === "AbortError") return;
      }
    }

    // Clipboard fallback
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast.success(shareText);
    } catch {
      toast.error(shareErr);
    }
  };

  const relatedLabel = locale === "el" ? "Συνεχίστε την ανάγνωση" : "Continue reading";
  const takeawaysLabel = locale === "el" ? "Βασικά συμπεράσματα" : "Key takeaways";
  const faqLabel = locale === "el" ? "Συχνές ερωτήσεις" : "Frequently asked questions";
  const shareLabel = locale === "el" ? "Κοινοποίηση" : "Share";
  const updatedLabel = locale === "el" ? "Ενημερώθηκε" : "Updated";
  const tocMobileLabel = locale === "el" ? "Περιεχόμενα" : "On this page";

  return (
    <div className="bg-background text-foreground" style={SANS}>
      <MarketingHeader />

      {/* Reading progress */}
      <div className="pointer-events-none fixed inset-x-0 top-[57px] z-40 h-0.5 bg-transparent">
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Mobile TOC trigger */}
      <button
        type="button"
        onClick={() => setMobileTocOpen(true)}
        className="fixed bottom-6 right-5 z-30 border border-foreground/15 bg-background/95 px-4 py-2.5 eyebrow text-foreground shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15)] backdrop-blur lg:hidden"
        aria-label={tocMobileLabel}
      >
        {tocMobileLabel}
      </button>

      {mobileTocOpen && (
        <div
          className="fixed inset-0 z-50 bg-foreground/50 lg:hidden"
          onClick={() => setMobileTocOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto rounded-t-[20px] bg-background p-6"
            onClick={(e) => e.stopPropagation()}
            style={SANS}
          >
            <div className="mb-5 flex items-center justify-between border-b border-foreground/10 pb-4">
              <p className="eyebrow">
                {tocLabel}
              </p>
              <button
                onClick={() => setMobileTocOpen(false)}
                aria-label="Close"
                className="eyebrow hover:text-foreground"
              >
                Close
              </button>
            </div>
            <ol className="space-y-0">
              {toc.map((t, i) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    onClick={() => setMobileTocOpen(false)}
                    className={`flex gap-4 py-3 text-[15px] leading-snug transition ${
                      activeId === t.id ? "text-primary font-medium" : "text-foreground/80"
                    }`}
                  >
                    <span className="w-7 shrink-0 tabular-nums text-[12px] text-foreground/40">
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

      <div className="mx-auto w-full max-w-7xl px-5 pb-24 pt-6 sm:px-8 sm:pt-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 text-[12.5px] text-foreground/55 sm:mb-12">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link href={`/${locale}`} className="hover:text-foreground">
                Vuneli
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

        {/* Hero */}
        <header className="mx-auto mb-10 max-w-4xl sm:mb-14">
          <p className="eyebrow text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-5 text-balance text-[36px] font-semibold leading-[1.05] tracking-[-0.025em] sm:mt-7 sm:text-[52px] md:text-[64px]">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-balance text-[17px] leading-[1.55] text-foreground/70 sm:mt-7 sm:text-[19px]">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-foreground/55">
            <span>
              {updatedLabel}{" "}
              <time dateTime={updatedAt} className="text-foreground/75">
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
              className="font-medium text-foreground/75 underline decoration-foreground/25 underline-offset-4 transition hover:text-primary hover:decoration-primary"
            >
              {shareLabel}
            </button>
          </div>
        </header>

        {/* Hero image */}
        <div className="relative mx-auto mb-14 aspect-[4/3] w-full max-w-6xl overflow-hidden rounded-[4px] bg-muted sm:mb-20 sm:aspect-[16/9]">
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
          {/* Left TOC - desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="mb-4 eyebrow">
                {tocLabel}
              </p>
              <ol className="space-y-0 border-l border-foreground/10">
                {toc.map((t, i) => (
                  <li key={t.id}>
                    <a
                      href={`#${t.id}`}
                      className={`-ml-px flex gap-3 border-l-2 py-2 pl-4 text-[13.5px] leading-[1.4] transition ${
                        activeId === t.id
                          ? "border-primary font-semibold text-primary"
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
          <article className="min-w-0">
            {/* Key takeaways - editorial pull column */}
            <aside
              aria-label={takeawaysLabel}
              className="mb-16 border-y border-foreground/15 py-8 sm:py-10"
            >
              <div className="grid gap-6 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)] sm:gap-10">
                <div>
                  <p className="eyebrow">
                    {takeawaysLabel}
                  </p>
                  <p className="mt-2 tabular-nums text-[11px] text-foreground/40">
                    {String(keyTakeaways.length).padStart(2, "0")} {locale === "el" ? "σημεία" : "points"}
                  </p>
                </div>
                <ol className="space-y-5 sm:border-l sm:border-foreground/10 sm:pl-10">
                  {keyTakeaways.map((k, i) => (
                    <li
                      key={i}
                      className="grid grid-cols-[36px_minmax(0,1fr)] items-baseline gap-4 text-[16px] leading-[1.55] tracking-[-0.005em] text-foreground/90 sm:text-[17px]"
                    >
                      <span className="tabular-nums text-[13px] font-semibold text-foreground/35">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{k}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>

            {/* Article prose - professional editorial formatting */}
            <div className="vuneli-article max-w-[68ch]">
              <div className="vuneli-lead">{introduction}</div>
              <div className="mt-4">{sectionsContent}</div>
            </div>

            {/* FAQ */}
            <section aria-labelledby="faq-heading" className="mt-20 max-w-[68ch] sm:mt-24">
              <div className="mb-8 border-b border-foreground/10 pb-4">
                <p className="eyebrow">
                  FAQ
                </p>
                <h2
                  id="faq-heading"
                  className="mt-2 text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[36px]"
                >
                  {faqLabel}
                </h2>
              </div>
              <div className="divide-y divide-foreground/10 border-b border-foreground/10">
                {faq.map((f, i) => (
                  <details
                    key={i}
                    className="group py-5 [&_summary::-webkit-details-marker]:hidden sm:py-6"
                  >
                    <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-start gap-5 text-[16.5px] font-semibold leading-[1.35] tracking-[-0.01em] text-foreground sm:text-[18px]">
                      <span>{f.q}</span>
                      <span
                        aria-hidden
                        className="mt-0.5 shrink-0 text-[22px] leading-none text-foreground/40 transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-4 max-w-2xl text-[15.5px] leading-[1.65] text-foreground/70">
                      {f.a}
                    </p>
                  </details>
                ))}
              </div>
              {afterFaq}
            </section>

            {/* CTA */}
            <section className="mt-20 rounded-[4px] border border-foreground/10 bg-muted/30 p-8 sm:mt-24 sm:p-12">
              <h2 className="max-w-3xl text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[36px]">
                {cta.heading}
              </h2>
              <p className="mt-4 max-w-2xl text-[16px] leading-[1.55] text-foreground/70 sm:text-[17px]">
                {cta.body}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:gap-3">
                <Link
                  href={`/${locale}/auth/sign-up`}
                  className="inline-flex items-center justify-center rounded-[3px] bg-foreground px-6 py-3 text-[14px] font-semibold text-background transition hover:bg-foreground/85"
                >
                  {locale === "el" ? "Δωρεάν δοκιμή" : "Start free trial"}
                </Link>
                <Link
                  href={`/${locale}/pricing`}
                  className="inline-flex items-center justify-center rounded-[3px] border border-foreground/25 px-6 py-3 text-[14px] font-semibold text-foreground transition hover:border-foreground/60"
                >
                  {locale === "el" ? "Δείτε τα πλάνα" : "See pricing"}
                </Link>
              </div>
            </section>
          </article>

          {/* Right rail */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-[4px] border border-foreground/10 p-5">
                <p className="eyebrow text-primary">
                  Vuneli
                </p>
                <p className="mt-3 text-[13.5px] leading-[1.55] text-foreground/70">
                  {locale === "el"
                    ? "Αυτοματοποιήστε τη λογιστική άνθρακα και τις αναφορές CSRD/VSME με AI."
                    : "Automate carbon accounting and CSRD/VSME reporting with AI."}
                </p>
                <Link
                  href={`/${locale}/auth/sign-up`}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-[3px] bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background transition hover:bg-foreground/85"
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
                className="eyebrow underline underline-offset-4 hover:text-primary"
              >
                {shareLabel}
              </button>
            </div>
          </aside>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section aria-labelledby="related" className="mx-auto mt-24 max-w-6xl sm:mt-28">
            <div className="mb-8 border-b border-foreground/10 pb-4">
              <p className="eyebrow">
                {String(related.length).padStart(2, "0")} · {relatedLabel}
              </p>
              <h2
                id="related"
                className="mt-2 text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[32px]"
              >
                {relatedLabel}
              </h2>
            </div>
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/${locale}/learn/${r.slug}`} className="group block">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[3px] bg-muted">
                      <Image
                        src={r.heroImage}
                        alt={r.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    </div>
                    <p className="mt-4 eyebrow text-primary">
                      {r.eyebrow}
                    </p>
                    <h3 className="mt-2 text-[19px] font-semibold leading-[1.2] tracking-[-0.015em] text-foreground group-hover:text-primary">
                      {r.title}
                    </h3>
                    <p className="mt-2 text-[12.5px] tabular-nums text-foreground/45">
                      {r.readingMinutes} min read
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
