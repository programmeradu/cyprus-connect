import Link from "next/link";
import Image from "next/image";

import { getAllPillars, getPillar } from "@/data/learn/pillars";

type Props = {
  currentSlug: string;
  locale: "en" | "el";
  /** Heuristic bucket — used to pick topically-adjacent guides. */
  context: "widget" | "faq";
  /** Optional keyword hint used to rank suggestions. */
  keyword?: string;
  label?: string;
};

/**
 * "AI-style" contextual suggestions. No inference call — we rank pillars by:
 *   1. Explicit `relatedSlugs`
 *   2. Same `category`
 *   3. Keyword hits against title + eyebrow
 * Then pick the top 2 for compact display under widgets and FAQ.
 */
export default function RelatedSuggestions({ currentSlug, locale, context, keyword, label }: Props) {
  const current = getPillar(currentSlug);
  if (!current) return null;

  const all = getAllPillars().filter((p) => p.slug !== currentSlug);
  const kw = (keyword ?? "").toLowerCase();

  const scored = all
    .map((p) => {
      let score = 0;
      if (current.relatedSlugs.includes(p.slug)) score += 5;
      if (p.category === current.category) score += 2;
      if (kw) {
        const hay = `${p[locale].title} ${p[locale].heroEyebrow} ${p.slug}`.toLowerCase();
        if (hay.includes(kw)) score += 3;
      }
      // FAQ context nudges toward practical/how-to slugs
      if (context === "faq" && (p.slug.includes("guide") || p.slug.includes("roadmap") || p.slug.includes("kpi"))) {
        score += 1;
      }
      // Widget context nudges toward standards/regulations
      if (context === "widget" && (p.category === "standards" || p.category === "csrd" || p.category === "cbam")) {
        score += 1;
      }
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  if (scored.length === 0) return null;

  const heading =
    label ??
    (locale === "el" ? "Επίσης χρήσιμα" : "You might also find useful");

  return (
    <aside
      aria-label={heading}
      className="not-prose my-8 rounded-2xl border border-dashed bg-gradient-to-br from-primary/5 to-transparent p-5"
    >
      <p className="mb-3 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
        <Sparkles className="h-3 w-3" />
        {heading}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {scored.map(({ p }) => {
          const c = p[locale];
          return (
            <Link
              key={p.slug}
              href={`/${locale}/learn/${p.slug}`}
              className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition hover:border-primary/50 hover:shadow-sm"
            >
              <div className="relative h-12 w-16 flex-none overflow-hidden rounded-lg bg-muted">
                <Image src={p.heroImage} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.18em] text-primary">{c.heroEyebrow}</p>
                <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
                  {c.title}
                </p>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 flex-none text-muted-foreground transition group-hover:text-primary" />
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
