"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { LearnLinksSection } from "@/components/learn/LearnLinksSection";
import heroPhoto from "@/assets/hub-news-press.jpg";

/**
 * /news - the Vuneli wire.
 *
 * House rules: Fraunces display + Instrument Sans body, cinematic hero so the
 * fixed header stays legible, hairline ledger rows, numerals for hierarchy,
 * no pills, no icons, readable metadata (medium weight, normal tracking).
 */

type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  imageUrl?: string;
};

type Take = { title: string; body: string };

type Topic = "all" | "cbam" | "csrd" | "energy" | "taxonomy" | "markets";


const TOPIC_KEYWORDS: Record<Topic, string[]> = {
  all: [],
  cbam: ["cbam", "carbon border"],
  csrd: ["csrd", "esrs", "sustainability reporting", "double materiality", "vsme"],
  energy: ["energy", "electricity", "grid", "solar", "wind", "renewable", "gas", "oil"],
  taxonomy: ["taxonomy", "eu taxonomy"],
  markets: ["carbon market", "ets", "credit", "offset", "price", "trading"],
};

const ACCENT_BUTTON =
  "inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full bg-[var(--accent-lime)] px-6 text-[15px] font-semibold tracking-[-0.01em] text-[var(--accent-lime-foreground)] shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--accent-lime)_55%,transparent)] transition-transform hover:scale-[1.02]";

const COPY = {
  en: {
    eyebrow: "The Vuneli wire",
    titleA: "ESG and climate,",
    titleB: "read for Cyprus",
    subtitle:
      "A curated feed of the sustainability, energy and EU compliance stories that change what Cyprus SMEs must file, pay or prove. Updated hourly.",
    filterAll: "All stories",
    filterCbam: "CBAM",
    filterCsrd: "CSRD / VSME",
    filterEnergy: "Energy",
    filterTaxonomy: "EU Taxonomy",
    filterMarkets: "Markets",
    empty: "No stories match this filter right now. Try another topic.",
    loading: "Loading the feed",
    lead: "Lead story",
    latest: "Latest",
    timelineTitle: "Regulatory timeline",
    timelineSub: "The next EU compliance dates that apply to Cyprus SMEs.",
    takesTitle: "Vuneli takes",
    takesSub: "What the week actually means for a Cyprus SME",
    read: "Read the story",
    daysAway: "days away",
    today: "today",
    factSources: "Sources tracked",
    factSourcesValue: "18 EU and Cyprus outlets",
    factRefresh: "Refresh",
    factRefreshValue: "Hourly",
    factScope: "Scope",
    factScopeValue: "Cyprus and EU rules",
    factNext: "Next deadline",
    ctaTitle: "Turn the news into a filing you can defend",
    ctaBody:
      "Vuneli tracks the same rules and applies them to your own data - your bills, your suppliers, your reporting year.",
    ctaAction: "Start with one bill",
    ctaSecondary: "See the tools",
  },
  el: {
    eyebrow: "Η ροή της Vuneli",
    titleA: "ESG και κλίμα,",
    titleB: "με κυπριακή ματιά",
    subtitle:
      "Επιμελημένη ροή για βιωσιμότητα, ενέργεια και συμμόρφωση ΕΕ - όσα αλλάζουν τι πρέπει να υποβάλει ή να αποδείξει μια κυπριακή ΜμΕ. Ενημέρωση κάθε ώρα.",
    filterAll: "Όλα",
    filterCbam: "CBAM",
    filterCsrd: "CSRD / VSME",
    filterEnergy: "Ενέργεια",
    filterTaxonomy: "EU Taxonomy",
    filterMarkets: "Αγορές",
    empty: "Δεν βρέθηκαν άρθρα σε αυτή την κατηγορία. Δοκιμάστε άλλο θέμα.",
    loading: "Φόρτωση ροής",
    lead: "Κύριο θέμα",
    latest: "Πρόσφατα",
    timelineTitle: "Ρυθμιστικό χρονοδιάγραμμα",
    timelineSub: "Οι επόμενες προθεσμίες ΕΕ που αφορούν κυπριακές ΜμΕ.",
    takesTitle: "Η άποψη της Vuneli",
    takesSub: "Τι σημαίνει η εβδομάδα για μια κυπριακή ΜμΕ",
    read: "Διαβάστε το άρθρο",
    daysAway: "ημέρες",
    today: "σήμερα",
    factSources: "Πηγές",
    factSourcesValue: "18 μέσα ΕΕ και Κύπρου",
    factRefresh: "Ανανέωση",
    factRefreshValue: "Κάθε ώρα",
    factScope: "Εμβέλεια",
    factScopeValue: "Κανόνες Κύπρου και ΕΕ",
    factNext: "Επόμενη προθεσμία",
    ctaTitle: "Μετατρέψτε τις ειδήσεις σε υποβολή που αντέχει έλεγχο",
    ctaBody:
      "Η Vuneli παρακολουθεί τους ίδιους κανόνες και τους εφαρμόζει στα δικά σας δεδομένα - λογαριασμοί, προμηθευτές, έτος αναφοράς.",
    ctaAction: "Ξεκινήστε με έναν λογαριασμό",
    ctaSecondary: "Δείτε τα εργαλεία",
  },
} as const;

const REGULATORY_DEADLINES = [
  {
    date: "2026-12-31",
    en: {
      title: "VSME adoption window closes on FY26 data",
      body: "SMEs that want a VSME report for 2026 must have the year of data collected before the books close.",
    },
    el: {
      title: "Παράθυρο VSME για δεδομένα 2026",
      body: "ΜμΕ που θέλουν έκθεση VSME για το 2026 πρέπει να έχουν συλλέξει τα δεδομένα πριν κλείσει η χρήση.",
    },
  },
  {
    date: "2027-01-01",
    en: {
      title: "CSRD Wave 3 - listed SMEs begin",
      body: "Listed SMEs start sustainability reporting on FY26, unless they use the two-year opt-out.",
    },
    el: {
      title: "CSRD Κύμα 3 - εισηγμένες ΜμΕ",
      body: "Εισηγμένες ΜμΕ ξεκινούν αναφορές βιωσιμότητας για το FY26, εκτός αν χρησιμοποιήσουν τη διετή εξαίρεση.",
    },
  },
  {
    date: "2027-05-31",
    en: {
      title: "First CBAM annual declaration",
      body: "Importers declare 2026 embedded emissions and surrender the matching CBAM certificates.",
    },
    el: {
      title: "Πρώτη ετήσια δήλωση CBAM",
      body: "Οι εισαγωγείς δηλώνουν τις ενσωματωμένες εκπομπές του 2026 και παραδίδουν τα αντίστοιχα πιστοποιητικά.",
    },
  },
  {
    date: "2028-01-01",
    en: {
      title: "CSRD Wave 4 - non-EU parent groups",
      body: "Non-EU parents with large EU turnover report on FY28 under the separate ESRS standard.",
    },
    el: {
      title: "CSRD Κύμα 4 - μη-ΕΕ όμιλοι",
      body: "Μη-ΕΕ μητρικές με μεγάλο κύκλο εργασιών στην ΕΕ αναφέρουν για το FY28 με ξεχωριστό πρότυπο ESRS.",
    },
  },
];

export function NewsPageClient() {
  const locale = (useLocale() as "en" | "el") ?? "en";
  const t = COPY[locale] ?? COPY.en;

  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [topic, setTopic] = useState<Topic>("all");
  const [takes, setTakes] = useState<Take[] | null>(null);
  const [takesMeta, setTakesMeta] = useState<{ sourceCount: number; fallback: boolean } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/news?country=cy")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Vuneli takes: three analyst notes written from the live feed. The route
  // caches per locale for an hour and always answers with an editorial
  // baseline, so this never leaves the section empty.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/news/takes?locale=${locale}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (cancelled || !Array.isArray(data.takes) || data.takes.length === 0) return;
        setTakes(data.takes as Take[]);
        setTakesMeta({
          sourceCount: Number(data.sourceCount) || 0,
          fallback: Boolean(data.fallback),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setTakes(EDITORIAL_TAKES[locale] ?? EDITORIAL_TAKES.en);
          setTakesMeta({ sourceCount: 0, fallback: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);


  const filtered = useMemo(() => {
    if (!items) return [];
    if (topic === "all") return items;
    const kws = TOPIC_KEYWORDS[topic];
    return items.filter((it) => {
      const hay = `${it.title} ${it.description}`.toLowerCase();
      return kws.some((k) => hay.includes(k));
    });
  }, [items, topic]);

  const filters: { key: Topic; label: string }[] = [
    { key: "all", label: t.filterAll },
    { key: "cbam", label: t.filterCbam },
    { key: "csrd", label: t.filterCsrd },
    { key: "energy", label: t.filterEnergy },
    { key: "taxonomy", label: t.filterTaxonomy },
    { key: "markets", label: t.filterMarkets },
  ];

  const now = Date.now();
  const timeline = REGULATORY_DEADLINES.map((d) => ({ ...d, ts: new Date(d.date).getTime() }))
    .filter((d) => d.ts >= now - 30 * 24 * 60 * 60 * 1000)
    .sort((a, b) => a.ts - b.ts);

  const next = timeline[0];
  const nextDays = next ? Math.max(0, Math.round((next.ts - now) / 86_400_000)) : 0;

  const lead = filtered[0];
  const rest = filtered.slice(1);

  const fmtDate = (raw: string) =>
    raw
      ? new Date(raw).toLocaleDateString(locale === "el" ? "el-CY" : "en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-[var(--accent-lime)] selection:text-black">
      <MarketingHeader />

      {/* ------------------------------------------------------------- Hero */}
      <section className="relative isolate flex min-h-[80svh] w-full flex-col overflow-hidden sm:min-h-[74svh]">
        <div className="absolute inset-0 -z-10">
          <Image
            src={heroPhoto}
            alt="Folded newspapers and an EU policy dossier on a stone table in morning light"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[65%_center] sm:object-center"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-black/80 via-black/35 to-transparent md:block" />
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
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/75">{t.eyebrow}</p>
            <h1
              className="mt-5 font-[family-name:var(--editorial-display)] text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.025em] text-white sm:text-[4rem]"
              style={{ textWrap: "balance" }}
            >
              {t.titleA} <span className="font-normal italic text-white/85">{t.titleB}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-[16.5px] font-medium leading-[1.6] text-white/85 sm:text-[18px] md:mx-0">
              {t.subtitle}
            </p>
            <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center md:justify-start">
              <a href="#feed" className={ACCENT_BUTTON}>
                {t.latest}
              </a>
              <a
                href="#timeline"
                className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-white/30 px-6 text-[15px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10"
              >
                {t.timelineTitle}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- Fact ledger */}
      <section className="border-b border-border/60">
        <dl className="mx-auto grid max-w-6xl grid-cols-1 gap-px bg-border/60 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [t.factSources, t.factSourcesValue],
            [t.factRefresh, t.factRefreshValue],
            [t.factScope, t.factScopeValue],
            [
              t.factNext,
              next
                ? `${nextDays} ${t.daysAway}`
                : locale === "el"
                  ? "Καμία εντός 12 μηνών"
                  : "None within 12 months",
            ],
          ].map(([label, value]) => (
            <div key={label} className="bg-background px-5 py-7 sm:px-7">
              <dt className="text-[13px] font-semibold uppercase tracking-[0.1em] text-foreground/60">{label}</dt>
              <dd className="mt-2 font-[family-name:var(--editorial-display)] text-[24px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[27px]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* --------------------------------------------------------- Filters */}
      <div id="feed" className="scroll-mt-24 border-b border-border/60">
        <div className="mx-auto max-w-6xl overflow-x-auto px-5 py-4 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2">
            {filters.map((f) => {
              const active = topic === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setTopic(f.key)}
                  aria-pressed={active}
                  className={[
                    "h-9 whitespace-nowrap border px-4 text-[14.5px] font-semibold transition-colors",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border/70 text-foreground/70 hover:border-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- Feed + dates */}
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div className="min-w-0">
            {items === null ? (
              <p className="text-[15px] font-medium text-foreground/60">{t.loading}</p>
            ) : filtered.length === 0 ? (
              <p className="text-[15px] font-medium text-foreground/60">{t.empty}</p>
            ) : (
              <>
                {/* Lead story */}
                {lead && (
                  <a
                    href={lead.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block border-b border-border/60 pb-10"
                  >
                    <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-foreground/55">
                      {t.lead}
                    </p>
                    {lead.imageUrl && (
                      <div className="mt-5 aspect-[16/9] w-full overflow-hidden rounded-md border border-border/50 bg-muted/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={lead.imageUrl}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      </div>
                    )}
                    <h2 className="mt-5 font-[family-name:var(--editorial-display)] text-[1.7rem] font-semibold leading-[1.1] tracking-[-0.025em] transition-colors group-hover:text-primary sm:text-[2.4rem]">
                      {lead.title}
                    </h2>
                    {lead.description && (
                      <p className="mt-4 max-w-2xl text-[16px] leading-[1.62] text-foreground/70">
                        {lead.description}
                      </p>
                    )}
                    <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] font-semibold text-foreground/60">
                      {getSource(lead.link) && <span className="capitalize">{getSource(lead.link)}</span>}
                      {getSource(lead.link) && lead.pubDate && <span aria-hidden>/</span>}
                      {lead.pubDate && <span>{fmtDate(lead.pubDate)}</span>}
                      <span aria-hidden>/</span>
                      <span className="text-foreground/80">
                        {t.read}{" "}
                        <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </span>
                    </p>
                  </a>
                )}

                {/* Remaining stories */}
                <ul>
                  {rest.map((it, i) => {
                    const source = getSource(it.link);
                    return (
                      <li key={`${i}-${it.link}`} className="border-b border-border/60">
                        <a
                          href={it.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group grid grid-cols-[minmax(0,1fr)_auto] items-start gap-5 py-7 sm:gap-8 sm:py-9"
                        >
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] font-semibold text-foreground/55">
                              <span aria-hidden className="tabular-nums text-foreground/35">
                                {String(i + 2).padStart(2, "0")}
                              </span>
                              {source && <span className="capitalize">{source}</span>}
                              {source && it.pubDate && <span aria-hidden>/</span>}
                              {it.pubDate && <span>{fmtDate(it.pubDate)}</span>}
                            </p>
                            <h3 className="mt-2.5 font-[family-name:var(--editorial-display)] text-[1.25rem] font-semibold leading-[1.18] tracking-[-0.02em] transition-colors group-hover:text-primary sm:text-[1.6rem]">
                              {it.title}
                            </h3>
                            {it.description && (
                              <p className="mt-3 max-w-2xl text-[15.5px] leading-[1.62] text-foreground/70">
                                {it.description}
                              </p>
                            )}
                            <p className="mt-4 text-[14px] font-semibold text-foreground/70">
                              {t.read}{" "}
                              <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">
                                →
                              </span>
                            </p>
                          </div>
                          {it.imageUrl && (
                            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border/50 bg-muted/40 sm:h-28 sm:w-40">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={it.imageUrl}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                              />
                            </div>
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>

          {/* Regulatory timeline */}
          <aside id="timeline" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-[family-name:var(--editorial-display)] text-[1.5rem] font-semibold leading-[1.1] tracking-[-0.02em]">
              {t.timelineTitle}
            </h2>
            <p className="mt-3 text-[15px] leading-[1.6] text-foreground/65">{t.timelineSub}</p>
            <ol className="mt-7 border-t border-border/60">
              {timeline.map((d, i) => {
                const copy = locale === "el" ? d.el : d.en;
                const dateLabel = new Date(d.date).toLocaleDateString(locale === "el" ? "el-CY" : "en-GB", {
                  year: "numeric",
                  month: "long",
                });
                const days = Math.max(0, Math.round((d.ts - now) / 86_400_000));
                return (
                  <li key={`${d.date}-${i}`} className="border-b border-border/60 py-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span className="text-[14px] font-semibold text-foreground/70">{dateLabel}</span>
                      <span className="text-[14px] font-semibold tabular-nums text-foreground/50">
                        {days === 0 ? t.today : `${days} ${t.daysAway}`}
                      </span>
                    </div>
                    <h3 className="mt-2 font-[family-name:var(--editorial-display)] text-[17px] font-semibold leading-[1.25] tracking-[-0.015em]">
                      {copy.title}
                    </h3>
                    <p className="mt-1.5 text-[14.5px] leading-[1.55] text-foreground/65">{copy.body}</p>
                  </li>
                );
              })}
            </ol>
          </aside>
        </div>
      </section>

      {/* ------------------------------------------------------ Vuneli takes */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid gap-10 md:grid-cols-12 md:gap-14">
            <div className="md:col-span-5">
              <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-foreground/60">
                {t.takesTitle}
              </p>
              <h2 className="mt-4 font-[family-name:var(--editorial-display)] text-[2rem] font-semibold leading-[1.06] tracking-[-0.025em] sm:text-[2.8rem]">
                {t.takesSub}
              </h2>
            </div>
            <ol className="md:col-span-7">
              {(locale === "el" ? EDITORIAL_TAKES.el : EDITORIAL_TAKES.en).map((take, i) => (
                <li key={i} className="border-t border-border/60 py-8 first:border-t-0 first:pt-0 sm:py-10">
                  <div className="flex items-baseline gap-5 sm:gap-8">
                    <span
                      aria-hidden
                      className="font-[family-name:var(--editorial-display)] text-[1.6rem] italic leading-none tracking-[-0.03em] text-foreground/25 sm:text-[2rem]"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-[family-name:var(--editorial-display)] text-[1.3rem] font-semibold leading-[1.16] tracking-[-0.02em] sm:text-[1.65rem]">
                        {take.title}
                      </h3>
                      <p className="mt-3 text-[15.5px] leading-[1.62] text-foreground/70">{take.body}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 sm:py-24 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <h2 className="font-[family-name:var(--editorial-display)] text-[2rem] font-semibold leading-[1.06] tracking-[-0.025em] sm:text-[2.9rem]">
              {t.ctaTitle}
            </h2>
            <p className="mt-5 max-w-xl text-[16.5px] leading-[1.62] text-foreground/70">{t.ctaBody}</p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row md:col-span-5 md:justify-end">
            <Link href={`/${locale}/auth`} className={ACCENT_BUTTON}>
              {t.ctaAction}
            </Link>
            <Link
              href={`/${locale}/tools`}
              className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-foreground/25 px-6 text-[15px] font-semibold text-foreground transition-colors hover:border-foreground"
            >
              {t.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      <LearnLinksSection />
    </div>
  );
}

const EDITORIAL_TAKES = {
  en: [
    {
      title: "The CBAM definitive period is now surfacing hidden supply-chain costs",
      body: "Cyprus importers of steel, cement and fertilizer still underestimate certificate exposure. Collect supplier emissions data for the 2026 declaration now, not next spring.",
    },
    {
      title: "VSME is the on-ramp, not the ceiling",
      body: "An early VSME report gives an SME a defensible answer when a bank or a large customer asks for sustainability data - well before CSRD Wave 3 lands.",
    },
    {
      title: "Grid intensity matters more than tariff shopping",
      body: "For most Cyprus SMEs, moving load into lower-carbon hours cuts Scope 2 more than a supplier switch. The renewables share is the signal to watch.",
    },
  ],
  el: [
    {
      title: "Η οριστική περίοδος CBAM αναδεικνύει κρυφά κόστη",
      body: "Κύπριοι εισαγωγείς χάλυβα, τσιμέντου και λιπασμάτων υποτιμούν την έκθεση σε πιστοποιητικά. Συλλέξτε δεδομένα προμηθευτών για τη δήλωση του 2026 τώρα.",
    },
    {
      title: "Το VSME είναι η αρχή, όχι το όριο",
      body: "Η πρώιμη υιοθέτηση VSME δίνει στις ΜμΕ αξιόπιστη απάντηση σε τράπεζες και μεγάλους πελάτες πριν φτάσει το CSRD Κύμα 3.",
    },
    {
      title: "Η ένταση δικτύου μετράει περισσότερο από την αλλαγή παρόχου",
      body: "Ο χρονισμός φορτίων σε ώρες χαμηλού άνθρακα μειώνει το Scope 2 πιο πολύ από την αλλαγή προμηθευτή.",
    },
  ],
};

function getSource(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "news.google.com") return "";
    return host.split(".")[0];
  } catch {
    return "";
  }
}
