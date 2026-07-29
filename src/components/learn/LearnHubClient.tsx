"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSessionState } from "@/hooks/usePersistedState";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

type PillarCard = {
  slug: string;
  category: string;
  heroImage: string;
  readingMinutes: number;
  publishedAt: string;
  updatedAt: string;
  eyebrow: string;
  title: string;
  description: string;
  keywords: string;
  hasWidget: boolean;
};

type SortKey = "recommended" | "newest" | "shortest" | "longest" | "az";

type Props = {
  locale: "en" | "el";
  pillars: PillarCard[];
  categories: { key: string; label: string; description: string }[];
  heading: string;
  subheading: string;
  searchPlaceholder: string;
  allLabel: string;
  interactiveLabel: string;
  featuredLabel: string;
  emptyLabel: string;
  guidesCountLabelTemplate: string;
};

const SORT_LABELS: Record<SortKey, { en: string; el: string }> = {
  recommended: { en: "Recommended", el: "Προτεινόμενα" },
  newest: { en: "Newest", el: "Νεότερα" },
  shortest: { en: "Shortest", el: "Συντομότερα" },
  longest: { en: "In-depth", el: "Εκτενέστερα" },
  az: { en: "A–Z", el: "Α–Ω" },
};

const SANS: React.CSSProperties = {
  fontFamily: "var(--editorial-sans)",
  fontFeatureSettings: '"ss01", "ss02", "cv11"',
};

export default function LearnHubClient({
  locale,
  pillars,
  categories,
  heading,
  subheading,
  searchPlaceholder,
  allLabel,
  interactiveLabel,
  featuredLabel,
  emptyLabel,
  guidesCountLabelTemplate,
}: Props) {
  const [q, setQ] = useSessionState<string>("vuneli.learn.q", "");
  const [cat, setCat] = useSessionState<string>("vuneli.learn.cat", "all");
  const [sort, setSort] = useSessionState<SortKey>("vuneli.learn.sort", "recommended");
  const [interactiveOnly, setInteractiveOnly] = useSessionState<boolean>(
    "vuneli.learn.interactiveOnly",
    false
  );

  const filtered = useMemo(() => {
    const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matched = pillars.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (interactiveOnly && !p.hasWidget) return false;
      if (tokens.length === 0) return true;
      const hay = `${p.title} ${p.description} ${p.eyebrow} ${p.keywords} ${p.slug}`.toLowerCase();
      return tokens.every((tok) => hay.includes(tok));
    });

    const sorted = [...matched];
    if (sort === "newest") sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    else if (sort === "shortest") sorted.sort((a, b) => a.readingMinutes - b.readingMinutes);
    else if (sort === "longest") sorted.sort((a, b) => b.readingMinutes - a.readingMinutes);
    else if (sort === "az")
      sorted.sort((a, b) => a.title.localeCompare(b.title, locale === "el" ? "el-CY" : "en"));
    return sorted;
  }, [pillars, q, cat, sort, interactiveOnly, locale]);

  const featured = useMemo(
    () => [...pillars].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3),
    [pillars]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, PillarCard[]>();
    for (const p of filtered) {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    }
    return map;
  }, [filtered]);

  const showFeatured = q === "" && cat === "all" && !interactiveOnly && sort === "recommended";
  const hasActiveFilters = q !== "" || cat !== "all" || interactiveOnly || sort !== "recommended";
  const clearAll = () => {
    setQ("");
    setCat("all");
    setInteractiveOnly(false);
    setSort("recommended");
  };

  const withToolLabel = locale === "el" ? "Με εργαλείο" : "With tool";
  const clearLabel = locale === "el" ? "Καθαρισμός" : "Clear";
  const guideSingular = locale === "el" ? "οδηγός" : "guide";
  const guidePlural = locale === "el" ? "οδηγοί" : "guides";

  return (
    <div style={SANS}>
      <MarketingHeader />
      <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-8 sm:pt-16">

      {/* Header - editorial, no pill, no icon */}
      <header className="mx-auto mb-14 max-w-3xl sm:mb-20 sm:text-center">
        <p className="eyebrow text-primary sm:text-xs">
          Vuneli Learn
        </p>
        <h1
          className="mt-5 text-[44px] font-semibold leading-[0.98] tracking-[-0.03em] sm:mt-7 sm:text-[72px] md:text-[88px]"
          style={SANS}
        >
          {heading}
        </h1>
        <p className="mt-6 max-w-xl text-[17px] leading-[1.55] text-foreground/70 sm:mx-auto sm:text-[19px] sm:leading-[1.5]">
          {subheading}
        </p>
        <p className="mt-5 text-[13px] tabular-nums text-foreground/50">
          {guidesCountLabelTemplate.replace("{count}", String(pillars.length))}
        </p>
      </header>

      {/* Featured - mobile: single-column editorial stack; desktop: hero + two */}
      {showFeatured && (
        <section className="mb-16 sm:mb-20">
          <div className="mb-6 flex items-baseline justify-between border-b border-foreground/10 pb-3">
            <p className="eyebrow">
              {featuredLabel}
            </p>
            <p className="text-[11px] tabular-nums text-foreground/40">
              {String(featured.length).padStart(2, "0")}
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
            {featured.map((p, i) => (
              <Link
                key={p.slug}
                href={`/${locale}/learn/${p.slug}`}
                className={`group block ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
              >
                <div
                  className={`relative w-full overflow-hidden bg-muted ${
                    i === 0 ? "aspect-[4/3] md:aspect-[16/10]" : "aspect-[4/3]"
                  }`}
                >
                  <Image
                    src={p.heroImage}
                    alt={p.title}
                    fill
                    sizes={i === 0 ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    priority={i === 0}
                  />
                </div>
                <div className="mt-5">
                  <p className="eyebrow text-primary">
                    {p.eyebrow}
                    {p.hasWidget && (
                      <span className="ml-2 text-foreground/40">· {interactiveLabel}</span>
                    )}
                  </p>
                  <h2
                    className={`mt-2.5 font-semibold leading-[1.1] tracking-[-0.015em] text-foreground group-hover:text-primary ${
                      i === 0 ? "text-[28px] sm:text-[36px] md:text-[42px]" : "text-[22px] sm:text-[24px]"
                    }`}
                    style={SANS}
                  >
                    {p.title}
                  </h2>
                  {i === 0 && (
                    <p className="mt-3 max-w-xl text-[15px] leading-[1.55] text-foreground/65">
                      {p.description}
                    </p>
                  )}
                  <p className="mt-4 text-[12px] tabular-nums text-foreground/45">
                    {p.readingMinutes} min read
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Search bar - editorial, no pill buttons */}
      <div className="sticky top-0 z-20 -mx-5 mb-10 border-y border-foreground/10 bg-background/90 px-5 py-3 backdrop-blur sm:mx-0 sm:border sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full border-0 border-b border-foreground/15 bg-transparent px-0 text-[15px] outline-none transition placeholder:text-foreground/40 focus:border-primary sm:text-[16px]"
          />
          <div className="flex items-center gap-4 text-[13px] sm:shrink-0">
            <label className="flex items-center gap-2 text-foreground/60">
              <span className="hidden sm:inline">{locale === "el" ? "Ταξινόμηση" : "Sort"}</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="border-0 border-b border-transparent bg-transparent py-1 pr-4 text-[13px] font-medium text-foreground outline-none transition hover:border-foreground/30 focus:border-primary"
                aria-label={locale === "el" ? "Ταξινόμηση" : "Sort"}
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <option key={k} value={k}>
                    {SORT_LABELS[k][locale]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-foreground/60 hover:text-foreground">
              <input
                type="checkbox"
                checked={interactiveOnly}
                onChange={(e) => setInteractiveOnly(e.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              <span>{withToolLabel}</span>
            </label>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="text-foreground/50 underline underline-offset-4 hover:text-foreground"
              >
                {clearLabel}
              </button>
            )}
          </div>
        </div>

        {/* Category rail - horizontal scroll on mobile, no pills */}
        <div className="mt-3 -mx-1 flex gap-1 overflow-x-auto pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-4 sm:flex-wrap sm:overflow-visible">
          <CatButton active={cat === "all"} onClick={() => setCat("all")}>
            {allLabel}
          </CatButton>
          {categories.map((c) => (
            <CatButton key={c.key} active={cat === c.key} onClick={() => setCat(c.key)}>
              {c.label}
            </CatButton>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="border-y border-foreground/10 py-16 text-center text-[15px] text-foreground/50">
          {emptyLabel}
        </p>
      ) : (
        categories
          .filter((c) => cat === "all" || cat === c.key)
          .map((c) => {
            const items = grouped.get(c.key) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={c.key} className="mb-16 sm:mb-20">
                <div className="mb-6 flex items-baseline justify-between border-b border-foreground/10 pb-3">
                  <div>
                    <h2
                      className="text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[32px]"
                      style={SANS}
                    >
                      {c.label}
                    </h2>
                    <p className="mt-1 text-[13px] text-foreground/55 sm:text-[14px]">
                      {c.description}
                    </p>
                  </div>
                  <span className="text-[11px] tabular-nums text-foreground/40">
                    {String(items.length).padStart(2, "0")} {items.length === 1 ? guideSingular : guidePlural}
                  </span>
                </div>
                <ul className="divide-y divide-foreground/10">
                  {items.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/${locale}/learn/${p.slug}`}
                        className="group grid grid-cols-[minmax(0,1fr)_auto] items-start gap-5 py-6 transition sm:grid-cols-[128px_minmax(0,1fr)_auto] sm:items-center sm:gap-6"
                      >
                        <div className="relative hidden aspect-[4/3] w-32 shrink-0 overflow-hidden bg-muted sm:block">
                          <Image
                            src={p.heroImage}
                            alt=""
                            fill
                            sizes="128px"
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="eyebrow text-primary">
                            {p.eyebrow}
                            {p.hasWidget && (
                              <span className="ml-2 text-foreground/40">· {interactiveLabel}</span>
                            )}
                          </p>
                          <h3
                            className="mt-2 text-[20px] font-semibold leading-[1.2] tracking-[-0.015em] text-foreground group-hover:text-primary sm:text-[22px]"
                            style={SANS}
                          >
                            {p.title}
                          </h3>
                          <p className="mt-2 text-[14px] leading-[1.55] text-foreground/60 sm:text-[15px]">
                            {p.description}
                          </p>
                          <p className="mt-3 text-[11.5px] tabular-nums text-foreground/45 sm:hidden">
                            {p.readingMinutes} min read
                          </p>
                        </div>
                        <span className="hidden shrink-0 text-[12px] tabular-nums text-foreground/45 sm:inline">
                          {p.readingMinutes}m
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
      )}
    </main>
    </div>
  );
}


function CatButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-[13px] font-medium transition ${
        active
          ? "text-primary underline decoration-primary decoration-2 underline-offset-[6px]"
          : "text-foreground/55 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
