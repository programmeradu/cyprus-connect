"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";

type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  imageUrl?: string;
};

/**
 * NewsTicker — auto-scrolling marquee of latest ESG/climate headlines.
 * - CSS-driven translateX loop, pauses on hover.
 * - Duplicates track so the loop is seamless.
 * - Silent fallback: if fetch fails, renders nothing (no broken chrome).
 */
export function NewsTicker() {
  const locale = (useLocale() as "en" | "el") ?? "en";
  const [items, setItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/news?country=cy")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (!cancelled && Array.isArray(data.items)) {
          setItems(data.items.slice(0, 12));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length === 0) return null;

  const eyebrow = locale === "el" ? "Ροή / ESG & κλίμα" : "Latest / ESG & climate wire";
  const allLink = locale === "el" ? "Όλες οι ειδήσεις →" : "All news →";

  // Duplicate for seamless loop
  const track = [...items, ...items];

  return (
    <section
      aria-label="News ticker"
      className="relative border-y border-border/60 bg-background/40 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-6">
        <div className="eyebrow shrink-0 hidden sm:block">{eyebrow}</div>

        <div className="group relative flex-1 overflow-hidden">
          {/* left/right fade masks */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />

          <div
            className="flex min-w-max animate-[ticker_60s_linear_infinite] gap-10 group-hover:[animation-play-state:paused]"
          >
            {track.map((it, i) => {
              const date = it.pubDate
                ? new Date(it.pubDate).toLocaleDateString(locale, {
                    month: "short",
                    day: "numeric",
                  })
                : "";
              const source = getSource(it.link);
              return (
                <a
                  key={`${i}-${it.link}`}
                  href={it.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/item flex shrink-0 items-baseline gap-3 text-sm"
                >
                  {source && (
                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {source}
                    </span>
                  )}
                  {date && <span className="text-xs text-muted-foreground/70">{date}</span>}
                  <span className="text-border">/</span>
                  <span className="max-w-[52ch] truncate text-foreground/90 transition-colors group-hover/item:text-foreground">
                    {it.title}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        <Link
          href={`/${locale}/news`}
          className="shrink-0 text-xs font-medium tracking-tight text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
        >
          {allLink}
        </Link>
      </div>

      <style jsx>{`
        @keyframes ticker {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}

function getSource(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    // Google News wraps articles at news.google.com/rss/articles/... — strip that
    if (host === "news.google.com") return "";
    return host.split(".")[0];
  } catch {
    return "";
  }
}
