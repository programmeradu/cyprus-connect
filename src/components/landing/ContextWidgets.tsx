"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";

type Geo = { countryCode?: string; country?: string };
type Carbon = {
  carbonIntensity: number;
  renewablePercentage: number;
  zone: string;
  region?: string;
  fallback?: boolean;
};
type NewsItem = { title: string; link: string; pubDate: string };

const REGULATORY_DEADLINES = [
  {
    date: "2026-01-01",
    en: { title: "CBAM definitive period begins", short: "CBAM live" },
    el: { title: "Έναρξη οριστικής περιόδου CBAM", short: "CBAM ζωντανά" },
  },
  {
    date: "2026-01-01",
    en: { title: "CSRD Wave 2 first reports", short: "CSRD Wave 2" },
    el: { title: "Πρώτες αναφορές CSRD Κύμα 2", short: "CSRD Κύμα 2" },
  },
  {
    date: "2026-06-30",
    en: { title: "VSME voluntary adoption window", short: "VSME window" },
    el: { title: "Παράθυρο υιοθέτησης VSME", short: "VSME" },
  },
  {
    date: "2027-01-01",
    en: { title: "CSRD Wave 3 — listed SMEs", short: "CSRD Wave 3" },
    el: { title: "CSRD Κύμα 3 — εισηγμένες ΜμΕ", short: "CSRD Κύμα 3" },
  },
];

const COPY = {
  en: {
    eyebrow: "05 / Right now",
    titleA: "Where you are,",
    titleB: "what matters",
    subtitle:
      "Live signals for your location — the grid, the calendar, and the headlines shaping sustainability decisions right now.",
    gridLabel: "Grid intensity",
    gridSub: "gCO₂ / kWh",
    gridRenewables: "renewables",
    deadlineLabel: "Next EU deadline",
    deadlineDays: "days away",
    newsLabel: "This week in climate",
    newsAll: "All news →",
    loading: "—",
  },
  el: {
    eyebrow: "05 / Αυτή τη στιγμή",
    titleA: "Πού βρίσκεστε,",
    titleB: "τι έχει σημασία",
    subtitle:
      "Ζωντανά σήματα για την τοποθεσία σας — δίκτυο, ημερολόγιο και ειδήσεις που διαμορφώνουν αποφάσεις βιωσιμότητας.",
    gridLabel: "Ένταση δικτύου",
    gridSub: "gCO₂ / kWh",
    gridRenewables: "ΑΠΕ",
    deadlineLabel: "Επόμενη προθεσμία ΕΕ",
    deadlineDays: "μέρες",
    newsLabel: "Αυτή την εβδομάδα",
    newsAll: "Όλες οι ειδήσεις →",
    loading: "—",
  },
} as const;

export function ContextWidgets() {
  const locale = (useLocale() as "en" | "el") ?? "en";
  const t = COPY[locale] ?? COPY.en;

  const [geo, setGeo] = useState<Geo | null>(null);
  const [carbon, setCarbon] = useState<Carbon | null>(null);
  const [topNews, setTopNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/geolocation")
      .then((r) => r.json())
      .then((g: Geo) => {
        if (cancelled) return;
        setGeo(g);
        const zone = (g.countryCode || "CY").toUpperCase();
        return fetch(`/api/energy-prices/carbon-intensity?zone=${zone}`)
          .then((r) => r.json())
          .then((c: Carbon) => {
            if (!cancelled) setCarbon(c);
          });
      })
      .catch(() => {});

    fetch("/api/news?country=cy")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.items) && data.items[0]) {
          setTopNews(data.items[0]);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Next upcoming deadline
  const now = Date.now();
  const nextDeadline = REGULATORY_DEADLINES
    .map((d) => ({ ...d, ts: new Date(d.date).getTime() }))
    .filter((d) => d.ts > now)
    .sort((a, b) => a.ts - b.ts)[0];
  const daysAway = nextDeadline
    ? Math.max(0, Math.round((nextDeadline.ts - now) / (1000 * 60 * 60 * 24)))
    : null;
  const deadlineCopy = nextDeadline
    ? (locale === "el" ? nextDeadline.el : nextDeadline.en)
    : null;

  const region = geo?.country || (locale === "el" ? "Κύπρος" : "Cyprus");
  const carbonValue = carbon ? Math.round(carbon.carbonIntensity) : null;
  const renewables = carbon ? Math.round(carbon.renewablePercentage) : null;

  const newsDate = topNews?.pubDate
    ? new Date(topNews.pubDate).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="grid gap-10 sm:grid-cols-12 sm:gap-12">
        <div className="sm:col-span-5">
          <div className="eyebrow">{t.eyebrow}</div>
          <h2 className="mt-5 font-[family-name:var(--editorial-serif)] text-[2rem] leading-[1.05] tracking-[-0.02em] sm:text-[3rem]">
            {t.titleA}
            <br />
            <span className="italic text-muted-foreground">{t.titleB}</span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-[17px]">
            {t.subtitle}
          </p>
        </div>

        <div className="sm:col-span-7">
          <ul className="divide-y divide-border/60 border-y border-border/60">
            {/* Grid intensity */}
            <li className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 py-6 sm:gap-x-8 sm:py-8">
              <span className="pt-1 text-xs tabular-nums tracking-[0.15em] text-muted-foreground">
                01
              </span>
              <div className="min-w-0">
                <div className="eyebrow">
                  {t.gridLabel} · {region}
                </div>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="font-[family-name:var(--editorial-serif)] text-5xl tabular-nums leading-none tracking-tight sm:text-6xl">
                    {carbonValue ?? t.loading}
                  </span>
                  <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    {t.gridSub}
                  </span>
                </div>
                {renewables !== null && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="tabular-nums text-foreground">{renewables}%</span>{" "}
                    {t.gridRenewables}
                    {carbon?.fallback && (
                      <span className="ml-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
                        · est.
                      </span>
                    )}
                  </p>
                )}
              </div>
            </li>

            {/* Next EU deadline */}
            <li className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 py-6 sm:gap-x-8 sm:py-8">
              <span className="pt-1 text-xs tabular-nums tracking-[0.15em] text-muted-foreground">
                02
              </span>
              <div className="min-w-0">
                <div className="eyebrow">{t.deadlineLabel}</div>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="font-[family-name:var(--editorial-serif)] text-5xl tabular-nums leading-none tracking-tight sm:text-6xl">
                    {daysAway ?? t.loading}
                  </span>
                  <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    {t.deadlineDays}
                  </span>
                </div>
                {deadlineCopy && (
                  <p className="mt-2 text-sm text-muted-foreground">{deadlineCopy.title}</p>
                )}
              </div>
            </li>

            {/* This week in climate */}
            <li className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 py-6 sm:gap-x-8 sm:py-8">
              <span className="pt-1 text-xs tabular-nums tracking-[0.15em] text-muted-foreground">
                03
              </span>
              <div className="min-w-0">
                <div className="eyebrow">
                  {t.newsLabel}
                  {newsDate && <> · {newsDate}</>}
                </div>
                {topNews ? (
                  <a
                    href={topNews.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block font-[family-name:var(--editorial-serif)] text-xl leading-tight tracking-tight text-foreground hover:underline underline-offset-4 sm:text-2xl"
                  >
                    {topNews.title}
                  </a>
                ) : (
                  <p className="mt-3 text-xl text-muted-foreground">{t.loading}</p>
                )}
                <Link
                  href={`/${locale}/news`}
                  className="mt-4 inline-block text-xs font-medium tracking-tight text-foreground/70 hover:text-foreground underline-offset-4 hover:underline"
                >
                  {t.newsAll}
                </Link>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
