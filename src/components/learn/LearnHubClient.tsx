"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, BookOpen, Sparkles, Clock, ArrowDownWideNarrow, X } from "lucide-react";
import { useSessionState } from "@/hooks/usePersistedState";

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
  keywords: string; // pre-joined searchable string
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
  guidesCountLabel: (n: number) => string;
};

const SORT_LABELS: Record<SortKey, { en: string; el: string }> = {
  recommended: { en: "Recommended", el: "Προτεινόμενα" },
  newest: { en: "Newest first", el: "Νεότερα πρώτα" },
  shortest: { en: "Shortest read", el: "Συντομότερα" },
  longest: { en: "In-depth first", el: "Εκτενέστερα" },
  az: { en: "A–Z", el: "Α–Ω" },
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
  guidesCountLabel,
}: Props) {
  const [q, setQ] = useSessionState<string>("verdeiq.learn.q", "");
  const [cat, setCat] = useSessionState<string>("verdeiq.learn.cat", "all");
  const [sort, setSort] = useSessionState<SortKey>("verdeiq.learn.sort", "recommended");
  const [interactiveOnly, setInteractiveOnly] = useSessionState<boolean>(
    "verdeiq.learn.interactiveOnly",
    false
  );

  const filtered = useMemo(() => {
    const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matched = pillars.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (interactiveOnly && !p.hasWidget) return false;
      if (tokens.length === 0) return true;
      const hay = `${p.title} ${p.description} ${p.eyebrow} ${p.keywords} ${p.slug}`.toLowerCase();
      // full-text: every token must appear (AND semantics)
      return tokens.every((tok) => hay.includes(tok));
    });

    const sorted = [...matched];
    if (sort === "newest") sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    else if (sort === "shortest") sorted.sort((a, b) => a.readingMinutes - b.readingMinutes);
    else if (sort === "longest") sorted.sort((a, b) => b.readingMinutes - a.readingMinutes);
    else if (sort === "az") sorted.sort((a, b) => a.title.localeCompare(b.title, locale === "el" ? "el-CY" : "en"));
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



  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-14 sm:px-6 sm:pt-20">
      {/* Header */}
      <header className="mx-auto mb-14 max-w-3xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
          <BookOpen className="h-3.5 w-3.5" />
          VerdeIQ Learn
        </p>
        <h1
          className="mt-6 font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
          style={{
            fontFamily: "var(--editorial-serif, ui-serif, Georgia, 'Times New Roman', serif)",
          }}
        >
          {heading}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground sm:text-xl">{subheading}</p>
        <p className="mt-4 text-sm text-muted-foreground">{guidesCountLabel(pillars.length)}</p>
      </header>

      {/* Featured trio */}
      {showFeatured && (
        <section className="mb-16">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {featuredLabel}
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {featured.map((p, i) => (
              <Link
                key={p.slug}
                href={`/${locale}/learn/${p.slug}`}
                className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-card transition hover:border-primary/50 hover:shadow-lg ${
                  i === 0 ? "md:col-span-2 md:row-span-2" : ""
                }`}
              >
                <div className={`relative w-full bg-muted ${i === 0 ? "aspect-[16/10]" : "aspect-[16/9]"}`}>
                  <Image
                    src={p.heroImage}
                    alt={p.title}
                    fill
                    sizes={i === 0 ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    priority={i === 0}
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">{p.eyebrow}</p>
                    {p.hasWidget && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-primary">
                        <Sparkles className="h-2.5 w-2.5" />
                        {interactiveLabel}
                      </span>
                    )}
                  </div>
                  <h2
                    className={`mt-2 font-medium leading-snug group-hover:text-primary ${i === 0 ? "text-2xl sm:text-3xl" : "text-lg"}`}
                  >
                    {p.title}
                  </h2>
                  {i === 0 && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {p.description}
                    </p>
                  )}
                  <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {p.readingMinutes} min read
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Search + category chips */}
      <div className="sticky top-0 z-20 -mx-4 mb-10 border-b bg-background/85 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:bg-card/60 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 w-full rounded-full border bg-background pl-10 pr-4 text-sm outline-none transition focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center gap-2">
              <ArrowDownWideNarrow className="h-4 w-4 text-muted-foreground" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-9 rounded-full border bg-background px-3 pr-8 text-xs font-medium outline-none transition focus:border-primary"
                aria-label={locale === "el" ? "Ταξινόμηση" : "Sort"}
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <option key={k} value={k}>
                    {SORT_LABELS[k][locale]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setInteractiveOnly(!interactiveOnly)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                interactiveOnly
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:border-primary/50"
              }`}
              aria-pressed={interactiveOnly}
            >
              <Sparkles className="h-3 w-3" />
              {locale === "el" ? "Με εργαλείο" : "With tool"}
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-3 w-3" />
                {locale === "el" ? "Καθαρισμός" : "Clear"}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCat("all")}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                cat === "all" ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50"
              }`}
            >
              {allLabel}
            </button>
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setCat(c.key)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  cat === c.key ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grouped results */}
      {filtered.length === 0 ? (
        <p className="rounded-2xl border bg-card/60 p-10 text-center text-muted-foreground">{emptyLabel}</p>
      ) : (
        categories
          .filter((c) => cat === "all" || cat === c.key)
          .map((c) => {
            const items = grouped.get(c.key) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={c.key} className="mb-16">
                <div className="mb-6 flex items-end justify-between gap-4 border-b pb-3">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">{c.label}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {items.length} {items.length === 1 ? "guide" : "guides"}
                  </span>
                </div>
                <ul className="divide-y divide-border rounded-2xl border bg-card/40">
                  {items.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/${locale}/learn/${p.slug}`}
                        className="group flex items-center gap-5 p-5 transition hover:bg-primary/5"
                      >
                        <div className="relative hidden h-20 w-32 flex-none overflow-hidden rounded-xl bg-muted sm:block">
                          <Image
                            src={p.heroImage}
                            alt=""
                            fill
                            sizes="128px"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-primary">
                              {p.eyebrow}
                            </p>
                            {p.hasWidget && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-primary">
                                <Sparkles className="h-2.5 w-2.5" />
                                {interactiveLabel}
                              </span>
                            )}
                          </div>
                          <h3 className="mt-1 text-lg font-medium leading-snug group-hover:text-primary">
                            {p.title}
                          </h3>
                          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                            {p.description}
                          </p>
                        </div>
                        <span className="hidden flex-none items-center gap-1 text-xs tabular-nums text-muted-foreground sm:inline-flex">
                          <Clock className="h-3 w-3" />
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
  );
}
