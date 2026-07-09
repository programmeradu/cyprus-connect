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
            <li className="grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-2 py-6 sm:gap-x-8 sm:py-8">
              <span className="pt-1 text-xs tabular-nums tracking-[0.15em] text-muted-foreground self-start">
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
              <GridIntensityVisual
                intensity={carbonValue}
                renewables={renewables}
              />
            </li>

            {/* Next EU deadline */}
            <li className="grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-2 py-6 sm:gap-x-8 sm:py-8">
              <span className="pt-1 text-xs tabular-nums tracking-[0.15em] text-muted-foreground self-start">
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
              <DeadlineVisual
                dateISO={nextDeadline?.date}
                locale={locale}
              />
            </li>

            {/* This week in climate */}
            <li className="grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-2 py-6 sm:gap-x-8 sm:py-8">
              <span className="pt-1 text-xs tabular-nums tracking-[0.15em] text-muted-foreground self-start">
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
              <NewsPulseVisual />
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── Right-side context visuals ─────────────────────────────────── */

function GridIntensityVisual({
  intensity,
  renewables,
}: {
  intensity: number | null;
  renewables: number | null;
}) {
  // Two concentric arcs: outer = renewables share, inner = carbon intensity heat
  const size = 76;
  const r = 30;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, renewables ?? 0));
  const dash = (pct / 100) * c;
  // color hint: greener when renewables high, warmer when intensity high
  const warmth = Math.max(0, Math.min(1, (intensity ?? 400) / 700));
  const stroke = `oklch(0.72 0.16 ${145 - warmth * 100})`;

  return (
    <div
      className="hidden sm:grid h-[76px] w-[76px] place-items-center rounded-full border border-border/60 bg-background/40"
      aria-hidden
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="52%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground"
          style={{ fontSize: 12, fontFamily: "var(--editorial-serif)" }}
        >
          {renewables !== null ? `${renewables}%` : "—"}
        </text>
      </svg>
    </div>
  );
}

function DeadlineVisual({
  dateISO,
  locale,
}: {
  dateISO?: string;
  locale: "en" | "el";
}) {
  if (!dateISO) return null;
  const d = new Date(dateISO);
  const month = d
    .toLocaleDateString(locale, { month: "short" })
    .toUpperCase();
  const day = d.getDate();
  const year = d.getFullYear();
  return (
    <div
      className="hidden sm:flex h-[76px] w-[76px] flex-col overflow-hidden rounded-sm border border-border/60 bg-background/40"
      aria-hidden
    >
      <div className="bg-foreground py-0.5 text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-background">
        {month}
      </div>
      <div className="flex flex-1 items-center justify-center font-[family-name:var(--editorial-serif)] text-2xl tabular-nums leading-none">
        {day}
      </div>
      <div className="pb-1 text-center text-[9px] tabular-nums tracking-[0.15em] text-muted-foreground">
        {year}
      </div>
    </div>
  );
}

function NewsPulseVisual() {
  // Editorial sparkline / signal wave
  return (
    <div
      className="hidden sm:grid h-[76px] w-[76px] place-items-center rounded-sm border border-border/60 bg-background/40"
      aria-hidden
    >
      <svg width={60} height={40} viewBox="0 0 60 40">
        <path
          d="M2 28 L10 24 L16 30 L22 14 L28 22 L34 10 L40 26 L46 18 L52 22 L58 20"
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.85}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={34} cy={10} r={2.5} className="fill-foreground">
          <animate
            attributeName="r"
            values="2;3.5;2"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}
