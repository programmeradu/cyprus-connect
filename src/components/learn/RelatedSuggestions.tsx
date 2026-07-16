import Link from "next/link";
import Image from "next/image";

import { getAllPillars, getPillar } from "@/data/learn/pillars";

type Props = {
  currentSlug: string;
  locale: "en" | "el";
  /** Heuristic bucket - used to pick topically-adjacent guides. */
  context: "widget" | "faq";
  /** Optional keyword hint used to rank suggestions. */
  keyword?: string;
  label?: string;
};

/**
 * "AI-style" contextual suggestions. No inference call - we rank pillars by:
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
      className="not-prose my-10 border-t border-foreground/15 pt-6"
    >
      <p className="mb-5 eyebrow">
        {heading}
      </p>
      <div className="grid gap-0 divide-y divide-foreground/10 border-b border-foreground/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {scored.map(({ p }, i) => {
          const c = p[locale];
          return (
            <Link
              key={p.slug}
              href={`/${locale}/learn/${p.slug}`}
              className={`group flex items-start gap-4 py-4 transition hover:bg-foreground/[0.02] ${i === 0 ? "sm:pr-6" : "sm:pl-6"}`}
            >
              <span className="mt-1 tabular-nums text-[11px] font-semibold text-foreground/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="relative h-14 w-20 flex-none overflow-hidden bg-muted">
                <Image src={p.heroImage} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="eyebrow text-foreground/60">
                  {c.heroEyebrow}
                </p>
                <p className="mt-1.5 text-[14.5px] font-semibold leading-[1.35] tracking-[-0.01em] text-foreground group-hover:underline group-hover:underline-offset-4">
                  {c.title}
                </p>
              </div>
              <span
                aria-hidden
                className="mt-1 shrink-0 text-[18px] leading-none text-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-foreground"
              >
                →
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
