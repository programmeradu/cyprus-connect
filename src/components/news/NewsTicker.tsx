"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
 * NewsTicker - a single quiet line of ESG/climate headlines that drifts across
 * the page. No box, no border, no background: it must read as part of the
 * photograph above it, so the edge fade uses an alpha mask rather than a
 * colour gradient (a colour gradient painted chalky blocks over the hero).
 */
export function NewsTicker() {
  const locale = (useLocale() as "en" | "el") ?? "en";
  const [items, setItems] = useState<NewsItem[]>([]);
  const trackRef = useRef<HTMLDivElement | null>(null);

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

  // Measure one copy of the list so the loop repeats exactly, and scale the
  // duration to the measured width so the drift speed stays constant no
  // matter how many (or how long) the headlines are.
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el || items.length === 0) return;

    const measure = () => {
      const first = el.children[0] as HTMLElement | undefined;
      const second = el.children[items.length] as HTMLElement | undefined;
      if (!first || !second) return;
      const shift = second.offsetLeft - first.offsetLeft;
      if (shift <= 0) return;
      el.style.setProperty("--viq-ticker-shift", `${shift}px`);
      // ~48 px per second reads calmly at any width.
      el.style.setProperty("--viq-ticker-duration", `${Math.max(20, shift / 48)}s`);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (typeof document !== "undefined" && "fonts" in document) {
      (document as Document & { fonts: FontFaceSet }).fonts.ready.then(measure).catch(() => {});
    }
    return () => ro.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const label = locale === "el" ? "Ροή ESG & κλίματος" : "ESG & climate wire";
  const allLink = locale === "el" ? "Όλες οι ειδήσεις" : "All news";

  // Duplicate for a seamless loop
  const track = [...items, ...items];


  return (
    <section aria-label="News ticker" className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-baseline gap-6">
          <span
            className="hidden shrink-0 text-[13px] font-semibold leading-none text-foreground/70 sm:block"
            style={{ fontFamily: "var(--editorial-sans)" }}
          >
            {label}
          </span>

          <div
            className="group relative min-w-0 flex-1 overflow-hidden py-1"
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0, #000 5%, #000 92%, transparent 100%)",
              maskImage:
                "linear-gradient(to right, transparent 0, #000 5%, #000 92%, transparent 100%)",
            }}
          >
            <div className="vuneli-ticker-track flex min-w-max items-baseline gap-12">
              {track.map((it, i) => {
                const date = it.pubDate
                  ? new Date(it.pubDate).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                    })
                  : "";
                return (
                  <a
                    key={`${i}-${it.link}`}
                    href={it.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/item flex shrink-0 items-baseline gap-3 whitespace-nowrap"
                  >
                    {date && (
                      <span
                        className="text-[13px] font-medium tabular-nums text-foreground/60"
                        style={{ fontFamily: "var(--editorial-sans)" }}
                      >
                        {date}
                      </span>
                    )}
                    <span
                      className="text-[15.5px] font-medium leading-tight text-foreground decoration-foreground/40 underline-offset-[6px] transition-colors group-hover/item:underline"
                      style={{ fontFamily: "var(--editorial-sans)" }}
                    >
                      {it.title}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          <Link
            href={`/${locale}/news`}
            className="hidden shrink-0 text-[13px] font-semibold leading-none text-foreground/80 underline-offset-[6px] transition-colors hover:text-foreground hover:underline sm:block"
            style={{ fontFamily: "var(--editorial-sans)" }}
          >
            {allLink}
          </Link>
        </div>
      </div>

    </section>
  );
}
