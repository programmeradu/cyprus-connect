"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, List, X, Clock, Calendar, Share2, ArrowUp } from "lucide-react";

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
  sectionsContent: React.ReactNode; // pre-rendered <section id> blocks with optional widget slots
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

  // Reading progress
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

  // Scroll spy
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
    <div className="bg-[color:var(--editorial-bg,#F7F7F5)] text-[color:var(--editorial-fg,#0A0F0A)] dark:bg-background dark:text-foreground">
      {/* Reading progress bar */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-0.5 bg-transparent">
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Mobile TOC trigger */}
      <button
        type="button"
        onClick={() => setMobileTocOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full border bg-background/95 px-4 py-3 text-sm font-medium shadow-lg backdrop-blur lg:hidden"
        aria-label={tocMobileLabel}
      >
        <List className="h-4 w-4" />
        {tocMobileLabel}
      </button>

      {/* Mobile TOC drawer */}
      {mobileTocOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          onClick={() => setMobileTocOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto rounded-t-3xl bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {tocLabel}
              </p>
              <button onClick={() => setMobileTocOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ol className="space-y-3 text-base">
              {toc.map((t, i) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    onClick={() => setMobileTocOpen(false)}
                    className={`block rounded-lg px-3 py-2 leading-snug transition ${
                      activeId === t.id
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/80 hover:bg-muted"
                    }`}
                  >
                    <span className="mr-2 text-xs text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {t.heading}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href={`/${locale}`} className="hover:text-foreground">
                VerdeIQ
              </Link>
            </li>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <li>
              <Link href={`/${locale}/learn`} className="hover:text-foreground">
                Learn
              </Link>
            </li>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <li className="max-w-[60vw] truncate text-foreground" aria-current="page">
              {title}
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="mx-auto mb-12 max-w-4xl text-center sm:mb-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
          <h1
            className="mt-5 text-balance font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-[68px]"
            style={{ fontFamily: "var(--editorial-serif, ui-serif, Georgia, 'Times New Roman', serif)" }}
          >
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {updatedLabel}{" "}
              <time dateTime={updatedAt}>
                {new Date(updatedAt).toLocaleDateString(locale === "el" ? "el-CY" : "en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {readingMinutes} min read
            </span>
            <button
              type="button"
              onClick={share}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition hover:border-primary/50 hover:text-primary"
            >
              <Share2 className="h-3 w-3" />
              {shareLabel}
            </button>
          </div>
        </header>

        {/* Hero image */}
        <div className="relative mx-auto mb-16 aspect-[16/9] w-full max-w-6xl overflow-hidden rounded-3xl border bg-muted shadow-sm sm:mb-20">
          <Image
            src={heroImage}
            alt={title}
            fill
            priority
            sizes="(min-width: 1280px) 1152px, 100vw"
            className="object-cover"
          />
        </div>

        {/* Main grid: sidebar + article */}
        <div ref={articleRef} className="grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)_240px]">
          {/* Left: sticky TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {tocLabel}
              </p>
              <ol className="space-y-1 border-l border-border">
                {toc.map((t, i) => (
                  <li key={t.id}>
                    <a
                      href={`#${t.id}`}
                      className={`-ml-px block border-l-2 py-1.5 pl-4 text-sm leading-snug transition ${
                        activeId === t.id
                          ? "border-primary font-medium text-primary"
                          : "border-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                      }`}
                    >
                      <span className="mr-1.5 tabular-nums text-xs opacity-60">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {t.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          {/* Middle: article */}
          <div className="min-w-0">
            {/* Key takeaways card (top) */}
            <aside
              aria-label={takeawaysLabel}
              className="mb-12 rounded-2xl border bg-card/60 p-6 shadow-sm backdrop-blur-sm"
            >
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-primary">
                {takeawaysLabel}
              </p>
              <ul className="space-y-3">
                {keyTakeaways.map((k, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                    <span
                      aria-hidden
                      className="mt-2 inline-block h-1.5 w-1.5 flex-none rounded-full bg-primary"
                    />
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Introduction */}
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-serif prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-foreground/85 prose-a:text-primary hover:prose-a:underline">
              {introduction}
            </div>

            {/* Sections (pre-rendered by parent, includes widgets) */}
            <div className="prose prose-lg mt-10 max-w-none dark:prose-invert prose-headings:font-serif prose-headings:tracking-tight prose-h2:mt-16 prose-h2:mb-5 prose-h2:text-3xl prose-p:leading-relaxed prose-p:text-foreground/85 prose-a:text-primary hover:prose-a:underline prose-strong:text-foreground">
              {sectionsContent}
            </div>

            {/* FAQ */}
            <section aria-labelledby="faq-heading" className="mt-20">
              <h2
                id="faq-heading"
                className="font-serif text-3xl tracking-tight sm:text-4xl"
                style={{
                  fontFamily: "var(--editorial-serif, ui-serif, Georgia, 'Times New Roman', serif)",
                }}
              >
                {faqLabel}
              </h2>
              <div className="mt-8 divide-y divide-border rounded-2xl border bg-card/40">
                {faq.map((f, i) => (
                  <details key={i} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-base font-medium leading-snug sm:text-lg">
                      <span>{f.q}</span>
                      <span
                        aria-hidden
                        className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full border text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{f.a}</p>
                  </details>
                ))}
              </div>
              {afterFaq}
            </section>


            {/* CTA */}
            <section className="mt-20 overflow-hidden rounded-3xl border bg-gradient-to-br from-primary via-primary to-primary/80 p-8 text-primary-foreground shadow-lg sm:p-12">
              <h2
                className="mt-0 font-serif text-3xl tracking-tight sm:text-4xl"
                style={{
                  fontFamily: "var(--editorial-serif, ui-serif, Georgia, 'Times New Roman', serif)",
                }}
              >
                {cta.heading}
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-primary-foreground/90">{cta.body}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/pricing`}
                  className="inline-flex items-center rounded-full bg-background px-6 py-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-background/90"
                >
                  {locale === "el" ? "Δείτε τα πλάνα" : "See pricing"}
                </Link>
                <Link
                  href={`/${locale}/auth/sign-up`}
                  className="inline-flex items-center rounded-full border border-primary-foreground/40 px-6 py-3 text-sm font-medium transition hover:bg-primary-foreground/10"
                >
                  {locale === "el" ? "Δωρεάν δοκιμή" : "Start free trial"}
                </Link>
              </div>
            </section>
          </div>

          {/* Right: sticky CTA + share rail */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
                  VerdeIQ
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {locale === "el"
                    ? "Αυτοματοποιήστε τη λογιστική άνθρακα και τις αναφορές CSRD/VSME με AI."
                    : "Automate carbon accounting and CSRD/VSME reporting with AI."}
                </p>
                <Link
                  href={`/${locale}/auth/sign-up`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  {locale === "el" ? "Ξεκινήστε δωρεάν" : "Start free"}
                </Link>
                <Link
                  href={`/${locale}/pricing`}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-full border px-4 py-2.5 text-sm font-medium transition hover:border-primary/50 hover:text-primary"
                >
                  {locale === "el" ? "Πλάνα" : "Pricing"}
                </Link>
              </div>
              <button
                type="button"
                onClick={share}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border bg-card p-3 text-sm font-medium text-muted-foreground transition hover:border-primary/50 hover:text-primary"
              >
                <Share2 className="h-4 w-4" />
                {shareLabel}
              </button>
            </div>
          </aside>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section aria-labelledby="related" className="mx-auto mt-24 max-w-6xl">
            <h2
              id="related"
              className="font-serif text-3xl tracking-tight sm:text-4xl"
              style={{
                fontFamily: "var(--editorial-serif, ui-serif, Georgia, 'Times New Roman', serif)",
              }}
            >
              {relatedLabel}
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/${locale}/learn/${r.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition hover:border-primary/50 hover:shadow-md"
                >
                  <div className="relative aspect-[16/9] w-full bg-muted">
                    <Image
                      src={r.heroImage}
                      alt={r.title}
                      fill
                      sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">{r.eyebrow}</p>
                    <h3 className="mt-2 line-clamp-2 text-lg font-medium leading-snug group-hover:text-primary">
                      {r.title}
                    </h3>
                    <p className="mt-auto pt-4 text-xs text-muted-foreground">
                      {r.readingMinutes} min read
                    </p>
                  </div>
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
          className="fixed bottom-5 left-5 z-30 hidden h-11 w-11 items-center justify-center rounded-full border bg-background/95 shadow-lg backdrop-blur transition hover:border-primary/50 hover:text-primary lg:flex"
          aria-label={backLabel}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
