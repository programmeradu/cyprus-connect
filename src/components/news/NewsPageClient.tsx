"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
// SiteFooter is rendered by the locale layout globally.

type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  imageUrl?: string;
};

type Topic = "all" | "cbam" | "csrd" | "energy" | "taxonomy" | "markets";

const TOPIC_KEYWORDS: Record<Topic, string[]> = {
  all: [],
  cbam: ["cbam", "carbon border"],
  csrd: ["csrd", "esrs", "sustainability reporting", "double materiality", "vsme"],
  energy: ["energy", "electricity", "grid", "solar", "wind", "renewable", "gas", "oil"],
  taxonomy: ["taxonomy", "eu taxonomy"],
  markets: ["carbon market", "ets", "credit", "offset", "price", "trading"],
};

const COPY = {
  en: {
    eyebrow: "Newsroom",
    title: "ESG & climate wire",
    subtitle:
      "Curated feed of the sustainability, energy and EU compliance stories that matter for SMEs — updated hourly.",
    filterAll: "All",
    filterCbam: "CBAM",
    filterCsrd: "CSRD / VSME",
    filterEnergy: "Energy",
    filterTaxonomy: "EU Taxonomy",
    filterMarkets: "Markets",
    empty: "No stories match this filter right now.",
    loading: "Loading feed…",
    timelineTitle: "Regulatory timeline",
    timelineSub: "Upcoming EU compliance milestones.",
    takesTitle: "VerdeIQ takes",
    takesSub: "Short analysis of the biggest stories this week.",
    read: "Read →",
  },
  el: {
    eyebrow: "Ειδήσεις",
    title: "ESG & κλιματική ροή",
    subtitle:
      "Επιμελημένη ροή για βιωσιμότητα, ενέργεια και συμμόρφωση ΕΕ — ενημερώνεται ωριαία.",
    filterAll: "Όλα",
    filterCbam: "CBAM",
    filterCsrd: "CSRD / VSME",
    filterEnergy: "Ενέργεια",
    filterTaxonomy: "EU Taxonomy",
    filterMarkets: "Αγορές",
    empty: "Δεν βρέθηκαν άρθρα σε αυτή την κατηγορία.",
    loading: "Φόρτωση…",
    timelineTitle: "Ρυθμιστικό χρονοδιάγραμμα",
    timelineSub: "Επερχόμενες προθεσμίες συμμόρφωσης ΕΕ.",
    takesTitle: "Η άποψη της VerdeIQ",
    takesSub: "Σύντομη ανάλυση της εβδομάδας.",
    read: "Ανάγνωση →",
  },
} as const;

const REGULATORY_DEADLINES = [
  {
    date: "2026-01-01",
    en: { title: "CBAM definitive period begins", body: "Importers must surrender CBAM certificates for embedded emissions." },
    el: { title: "Έναρξη οριστικής περιόδου CBAM", body: "Εισαγωγείς υποβάλλουν πιστοποιητικά CBAM για ενσωματωμένες εκπομπές." },
  },
  {
    date: "2026-01-01",
    en: { title: "CSRD Wave 2 first reports", body: "Large non-EU parents & remaining large EU companies begin reporting FY25." },
    el: { title: "Πρώτες αναφορές CSRD Κύμα 2", body: "Μεγάλες μη-ΕΕ μητρικές και μεγάλες εταιρείες ΕΕ ξεκινούν αναφορές FY25." },
  },
  {
    date: "2026-06-30",
    en: { title: "VSME voluntary standard adoption window", body: "SMEs begin publishing VSME-aligned disclosures ahead of value-chain requests." },
    el: { title: "Παράθυρο υιοθέτησης VSME", body: "ΜμΕ ξεκινούν VSME δημοσιεύσεις πριν από αιτήματα αλυσίδας αξίας." },
  },
  {
    date: "2027-01-01",
    en: { title: "CSRD Wave 3 — listed SMEs", body: "Listed SMEs (with 2-year opt-out) begin sustainability reporting on FY26." },
    el: { title: "CSRD Κύμα 3 — εισηγμένες ΜμΕ", body: "Εισηγμένες ΜμΕ ξεκινούν αναφορές βιωσιμότητας για FY26." },
  },
];

export function NewsPageClient() {
  const locale = (useLocale() as "en" | "el") ?? "en";
  const t = COPY[locale] ?? COPY.en;

  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [topic, setTopic] = useState<Topic>("all");

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
  const timeline = REGULATORY_DEADLINES
    .map((d) => ({ ...d, ts: new Date(d.date).getTime() }))
    .filter((d) => d.ts >= now - 30 * 24 * 60 * 60 * 1000)
    .sort((a, b) => a.ts - b.ts);

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased">
      <MarketingHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-10 sm:px-6 sm:pt-20">
        <div className="eyebrow">{t.eyebrow}</div>
        <h1 className="mt-4 font-[family-name:var(--editorial-serif)] text-[2.4rem] leading-[1.02] tracking-[-0.02em] sm:text-[4rem]">
          {t.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t.subtitle}
        </p>
      </section>

      {/* Filters */}
      <div className="border-y border-border/60">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
          {filters.map((f) => {
            const active = topic === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setTopic(f.key)}
                className={`text-sm tracking-tight underline-offset-4 transition-colors ${
                  active
                    ? "font-semibold text-foreground underline"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed + Timeline */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-16">
          {/* Feed */}
          <div>
            {items === null ? (
              <p className="text-sm text-muted-foreground">{t.loading}</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.empty}</p>
            ) : (
              <ul className="divide-y divide-border/60 border-y border-border/60">
                {filtered.map((it, i) => {
                  const date = it.pubDate
                    ? new Date(it.pubDate).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "";
                  const source = getSource(it.link);
                  return (
                    <li key={`${i}-${it.link}`} className="py-6 sm:py-8">
                      <a
                        href={it.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group grid gap-6 sm:grid-cols-[1fr_auto]"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            {source && <span>{source}</span>}
                            {source && date && <span className="text-border">/</span>}
                            {date && <span className="normal-case tracking-normal">{date}</span>}
                          </div>
                          <h2 className="mt-3 font-[family-name:var(--editorial-serif)] text-xl leading-tight tracking-tight text-foreground sm:text-2xl">
                            <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">
                              {it.title}
                            </span>
                          </h2>
                          {it.description && (
                            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                              {it.description}
                            </p>
                          )}
                          <div className="mt-4 text-xs font-medium tracking-tight text-foreground/70 group-hover:text-foreground">
                            {t.read}
                          </div>
                        </div>
                        {it.imageUrl && (
                          <div className="hidden aspect-[4/3] w-40 shrink-0 overflow-hidden rounded-sm bg-muted sm:block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={it.imageUrl}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          </div>
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Regulatory timeline */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="eyebrow">{t.timelineTitle}</div>
            <p className="mt-3 text-sm text-muted-foreground">{t.timelineSub}</p>
            <ol className="mt-6 space-y-6 border-l border-border/60 pl-5">
              {timeline.map((d, i) => {
                const copy = locale === "el" ? d.el : d.en;
                const dateLabel = new Date(d.date).toLocaleDateString(locale, {
                  year: "numeric",
                  month: "long",
                });
                const daysAway = Math.max(0, Math.round((d.ts - now) / (1000 * 60 * 60 * 24)));
                return (
                  <li key={`${d.date}-${i}`} className="relative">
                    <span className="absolute -left-[23px] top-1.5 h-2 w-2 rounded-full bg-foreground" />
                    <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {dateLabel} · {daysAway}d
                    </div>
                    <h3 className="mt-1 font-[family-name:var(--editorial-serif)] text-base leading-snug tracking-tight">
                      {copy.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {copy.body}
                    </p>
                  </li>
                );
              })}
            </ol>
          </aside>
        </div>
      </section>

      {/* VerdeIQ takes */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-10 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <div className="eyebrow">{t.takesTitle}</div>
              <h2 className="mt-4 font-[family-name:var(--editorial-serif)] text-3xl leading-[1.05] tracking-[-0.02em] sm:text-4xl">
                {t.takesSub}
              </h2>
            </div>
            <div className="sm:col-span-7">
              <ul className="divide-y divide-border/60 border-y border-border/60">
                {(locale === "el" ? EDITORIAL_TAKES.el : EDITORIAL_TAKES.en).map((take, i) => (
                  <li key={i} className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 py-6 sm:py-8">
                    <span className="pt-1 text-xs tabular-nums tracking-[0.15em] text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-[family-name:var(--editorial-serif)] text-xl leading-tight tracking-tight sm:text-2xl">
                        {take.title}
                      </h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                        {take.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      
    </div>
  );
}

const EDITORIAL_TAKES = {
  en: [
    {
      title: "CBAM's definitive period will surface hidden supply-chain costs",
      body: "Cyprus importers of steel, cement and fertilizer are underestimating certificate exposure. Start collecting supplier emissions data now — not in Q4 2025.",
    },
    {
      title: "VSME is the on-ramp, not the ceiling",
      body: "Adopting VSME early gives SMEs a defensible answer when banks and large customers request sustainability data — before CSRD Wave 3 arrives.",
    },
    {
      title: "Grid intensity matters more than tariff shopping",
      body: "For most Cyprus SMEs, timing loads to lower-carbon hours moves Scope 2 more than switching supplier. Renewables share is the real signal.",
    },
  ],
  el: [
    {
      title: "Η οριστική περίοδος CBAM θα αναδείξει κρυφά κόστη",
      body: "Κύπριοι εισαγωγείς χάλυβα, τσιμέντου και λιπασμάτων υποτιμούν την έκθεση σε πιστοποιητικά. Ξεκινήστε συλλογή δεδομένων προμηθευτών τώρα.",
    },
    {
      title: "Το VSME είναι η αρχή, όχι το όριο",
      body: "Η πρώιμη υιοθέτηση VSME δίνει στις ΜμΕ αξιόπιστη απάντηση σε τράπεζες και μεγάλους πελάτες πριν το CSRD Κύμα 3.",
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
