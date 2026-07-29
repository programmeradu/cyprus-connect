import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { GLOSSARY, GLOSSARY_SLUGS, getGlossaryEntry, type GlossaryEntry } from "@/data/learn/glossary";
import { getPillar } from "@/data/learn/pillars";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://vuneli.com").replace(/\/$/, "");

export function generateStaticParams() {
  const out: Array<{ locale: string; term: string }> = [];
  for (const locale of routing.locales) for (const term of GLOSSARY_SLUGS) out.push({ locale, term });
  return out;
}

type Params = Promise<{ locale: string; term: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, term } = await params;
  const entry = getGlossaryEntry(term);
  if (!entry) return {};
  const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? (locale as (typeof routing.locales)[number]) : routing.defaultLocale;
  const isEl = safeLocale === "el";
  const definition = isEl ? entry.el : entry.en;
  const title = isEl
    ? `${entry.term} - Ορισμός | Vuneli Γλωσσάρι`
    : `${entry.term} - Definition & Meaning | Vuneli Glossary`;
  const description = definition.length > 158 ? definition.slice(0, 155) + "..." : definition;
  const url = `${SITE_URL}/${safeLocale}/glossary/${term}`;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l === "el" ? "el-CY" : l] = `${SITE_URL}/${l}/glossary/${term}`;
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}/glossary/${term}`;
  return {
    title, description,
    alternates: { canonical: url, languages },
    openGraph: { title, description, url, siteName: "Vuneli", type: "article",
      locale: isEl ? "el_CY" : "en_US" },
    twitter: { card: "summary", title, description },
  };
}

export default async function GlossaryTermPage({ params }: { params: Params }) {
  const { locale, term } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);
  const entry = getGlossaryEntry(term);
  if (!entry) notFound();

  const safeLocale = locale as "en" | "el";
  const isEl = safeLocale === "el";
  const definition = isEl ? entry.el : entry.en;
  const longText = isEl ? entry.elLong : entry.enLong;
  const guide = entry.slug ? getPillar(entry.slug) : null;
  const url = `${SITE_URL}/${safeLocale}/glossary/${term}`;

  const related = GLOSSARY
    .filter((e) => e.termSlug !== entry.termSlug && (!!entry.category ? e.category === entry.category : true))
    .slice(0, 6);

  const definedTermLd = {
    "@context": "https://schema.org", "@type": "DefinedTerm",
    name: entry.term, description: definition, inDefinedTermSet: `${SITE_URL}/${safeLocale}/glossary`,
    url,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Vuneli", item: `${SITE_URL}/${safeLocale}` },
      { "@type": "ListItem", position: 2, name: isEl ? "Γλωσσάρι" : "Glossary", item: `${SITE_URL}/${safeLocale}/glossary` },
      { "@type": "ListItem", position: 3, name: entry.term, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32">
        <nav className="mb-8 text-xs uppercase tracking-[0.2em] text-foreground/50">
          <Link href={`/${safeLocale}/glossary`} className="hover:text-foreground">
            {isEl ? "Γλωσσάρι" : "Glossary"}
          </Link>
          <span className="mx-2">/</span>
          <span>{entry.term}</span>
        </nav>
        <h1 className="font-serif text-5xl leading-[1.05] tracking-tight md:text-6xl">{entry.term}</h1>
        <p className="mt-6 text-xl leading-relaxed text-foreground/85">{definition}</p>
        {longText && (
          <div className="mt-8 space-y-4 text-base leading-relaxed text-foreground/80">
            {longText.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        )}
        {entry.aliases && entry.aliases.length > 0 && (
          <div className="mt-10 border-t border-foreground/10 pt-6">
            <div className="text-xs uppercase tracking-[0.2em] text-foreground/50">
              {isEl ? "Επίσης γνωστό ως" : "Also known as"}
            </div>
            <div className="mt-2 text-sm text-foreground/80">{entry.aliases.join(", ")}</div>
          </div>
        )}
        {guide && (
          <div className="mt-10 border border-foreground/10 p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-foreground/50">
              {isEl ? "Σχετικός οδηγός" : "Related guide"}
            </div>
            <Link href={`/${safeLocale}/learn/${guide.slug}`}
              className="mt-2 block font-serif text-2xl leading-tight hover:underline">
              {guide[safeLocale].title}
            </Link>
            <p className="mt-2 text-sm text-foreground/70">{guide[safeLocale].heroSubtitle}</p>
          </div>
        )}
        {related.length > 0 && (
          <section className="mt-16 border-t border-foreground/10 pt-10">
            <h2 className="font-serif text-2xl">{isEl ? "Σχετικοί όροι" : "Related terms"}</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {related.map((r: GlossaryEntry) => (
                <li key={r.termSlug}>
                  <Link href={`/${safeLocale}/glossary/${r.termSlug}`}
                    className="block border border-foreground/10 p-4 transition hover:border-foreground/30">
                    <div className="font-medium">{r.term}</div>
                    <div className="mt-1 text-sm text-foreground/60 line-clamp-2">{isEl ? r.el : r.en}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
