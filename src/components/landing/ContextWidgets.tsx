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

/**
 * Instrument-style gauge — perimeter tick marks, dual arc (track + renewables),
 * warmth-mapped stroke, tabular readout inside. Reads as a real dial, not a chip.
 */
function GridIntensityVisual({
  intensity,
  renewables,
}: {
  intensity: number | null;
  renewables: number | null;
}) {
  const size = 112;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 50;
  const rArc = 42;
  const c = 2 * Math.PI * rArc;
  const pct = Math.max(0, Math.min(100, renewables ?? 0));
  const dash = (pct / 100) * c;
  const warmth = Math.max(0, Math.min(1, (intensity ?? 400) / 700));
  const hue = 145 - warmth * 100; // green → amber as intensity climbs
  const stroke = `oklch(0.68 0.15 ${hue})`;
  const gradId = "grid-arc-grad";

  // 60 minor ticks around the perimeter, every 5th a major tick
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const major = i % 5 === 0;
    const rIn = major ? rOuter - 6 : rOuter - 3;
    const rOut = rOuter;
    return {
      x1: cx + Math.cos(angle) * rIn,
      y1: cy + Math.sin(angle) * rIn,
      x2: cx + Math.cos(angle) * rOut,
      y2: cy + Math.sin(angle) * rOut,
      major,
    };
  });

  return (
    <div
      className="hidden sm:grid h-[112px] w-[112px] place-items-center"
      aria-hidden
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
            <stop offset="100%" stopColor={stroke} stopOpacity={1} />
          </linearGradient>
        </defs>
        {/* Perimeter tick ring */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="currentColor"
            strokeOpacity={t.major ? 0.35 : 0.14}
            strokeWidth={t.major ? 1 : 0.6}
            strokeLinecap="round"
          />
        ))}
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={rArc}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.08}
          strokeWidth={4}
        />
        {/* Renewables arc */}
        <circle
          cx={cx}
          cy={cy}
          r={rArc}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        {/* Inner hairline */}
        <circle
          cx={cx}
          cy={cy}
          r={rArc - 8}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={0.75}
        />
        {/* Readout */}
        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground"
          style={{
            fontSize: 18,
            fontFamily: "var(--editorial-serif)",
            letterSpacing: "-0.02em",
          }}
        >
          {renewables !== null ? renewables : "—"}
        </text>
        <text
          x="50%"
          y="63%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground"
          style={{
            fontSize: 6.5,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          % RENEW
        </text>
      </svg>
    </div>
  );
}

/**
 * Editorial punch-card / ticket stub — month header bar, oversized day numeral,
 * perforated edge, footer year. Feels like something you'd tear off a calendar.
 */
function DeadlineVisual({
  dateISO,
  locale,
}: {
  dateISO?: string;
  locale: "en" | "el";
}) {
  if (!dateISO) return null;
  const d = new Date(dateISO);
  const month = d.toLocaleDateString(locale, { month: "short" }).toUpperCase();
  const weekday = d.toLocaleDateString(locale, { weekday: "short" }).toUpperCase();
  const day = d.getDate();
  const year = d.getFullYear();
  return (
    <div
      className="hidden sm:flex relative h-[112px] w-[96px] flex-col overflow-hidden rounded-[4px] border border-border/70 bg-background shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset,0_1px_2px_rgba(0,0,0,0.04),0_14px_28px_-18px_rgba(0,0,0,0.35)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_14px_28px_-18px_rgba(0,0,0,0.6)]"
      aria-hidden
    >
      {/* Binding rings at top */}
      <div className="pointer-events-none absolute top-[3px] left-0 right-0 flex justify-around px-4">
        <span className="block h-[5px] w-[2px] rounded-full bg-foreground/70" />
        <span className="block h-[5px] w-[2px] rounded-full bg-foreground/70" />
      </div>

      {/* Month header */}
      <div className="relative bg-foreground pt-[10px] pb-[5px] text-center text-[9px] font-semibold uppercase tracking-[0.28em] text-background">
        {month}
      </div>

      {/* Hairline under header */}
      <div className="h-px w-full bg-foreground/10" />

      {/* Day numeral */}
      <div className="flex flex-1 flex-col items-center justify-center gap-[2px]">
        <span className="font-[family-name:var(--editorial-serif)] text-[46px] tabular-nums leading-none tracking-[-0.04em]">
          {day}
        </span>
        <span className="text-[8px] uppercase tracking-[0.28em] text-muted-foreground">
          {weekday}
        </span>
      </div>

      {/* Year footer */}
      <div className="border-t border-border/60 py-[4px] text-center text-[9px] tabular-nums tracking-[0.28em] text-muted-foreground">
        {year}
      </div>
    </div>
  );
}

/**
 * Editorial signal chart — baseline grid, filled area beneath a sparkline,
 * animated pulse on the latest peak. Reads as a real newsroom pulse indicator.
 */
function NewsPulseVisual() {
  const w = 112;
  const h = 96;
  const pts: Array<[number, number]> = [
    [6, 68],
    [16, 60],
    [26, 72],
    [36, 42],
    [46, 54],
    [56, 30],
    [66, 58],
    [76, 40],
    [86, 46],
    [98, 34],
    [106, 44],
  ];
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]} ${h - 8} L${pts[0][0]} ${h - 8} Z`;
  const peak = pts.reduce((a, b) => (b[1] < a[1] ? b : a));
  const gradId = "news-area-grad";

  return (
    <div
      className="hidden sm:grid h-[112px] w-[112px] place-items-center"
      aria-hidden
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity={0.22} />
            <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Baseline grid */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={4}
            y1={8 + (h - 16) * f}
            x2={w - 4}
            y2={8 + (h - 16) * f}
            stroke="currentColor"
            strokeOpacity={0.06}
            strokeWidth={0.5}
            strokeDasharray="2 3"
          />
        ))}
        <line
          x1={4}
          y1={h - 8}
          x2={w - 4}
          y2={h - 8}
          stroke="currentColor"
          strokeOpacity={0.2}
          strokeWidth={0.75}
        />

        {/* Filled area */}
        <path d={area} fill={`url(#${gradId})`} className="text-foreground" />
        {/* Line */}
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.9}
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Peak marker */}
        <circle
          cx={peak[0]}
          cy={peak[1]}
          r={6}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.25}
          strokeWidth={0.75}
        >
          <animate
            attributeName="r"
            values="4;9;4"
            dur="2.6s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-opacity"
            values="0.35;0;0.35"
            dur="2.6s"
            repeatCount="indefinite"
          />
        </circle>
        <circle
          cx={peak[0]}
          cy={peak[1]}
          r={2.25}
          className="fill-foreground"
        />

        {/* Axis eyebrow */}
        <text
          x={4}
          y={h - 1}
          className="fill-muted-foreground"
          style={{
            fontSize: 5.5,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
          }}
        >
          7D · SIGNAL
        </text>
      </svg>
    </div>
  );
}
