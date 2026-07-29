import Link from "next/link";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { GLOSSARY, type GlossaryEntry } from "@/data/learn/glossary";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://vuneli.com").replace(/\/$/, "");

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const isEl = locale === "el";
  const title = isEl
    ? "Γλωσσάρι Βιωσιμότητας & ESG | Vuneli"
    : "Sustainability & ESG Glossary | Vuneli";
  const description = isEl
    ? "Ορισμοί όρων για CSRD, CBAM, Scope 1/2/3, EU Taxonomy και άλλα - γραμμένοι για ΜμΕ."
    : "Plain-English definitions for CSRD, CBAM, Scope 1/2/3, EU Taxonomy and more - written for SMEs.";
  const url = `${SITE_URL}/${locale}/glossary`;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l === "el" ? "el-CY" : l] = `${SITE_URL}/${l}/glossary`;
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}/glossary`;
  return {
    title, description,
    alternates: { canonical: url, languages },
    openGraph: { title, description, url, siteName: "Vuneli", type: "website",
      locale: isEl ? "el_CY" : "en_US" },
  };
}

const CATEGORY_LABELS: Record<string, { en: string; el: string }> = {
  reporting: { en: "Reporting", el: "Αναφορά" },
  carbon: { en: "Carbon & GHG", el: "Άνθρακας & GHG" },
  policy: { en: "EU Policy", el: "Πολιτική ΕΕ" },
  standards: { en: "Standards", el: "Πρότυπα" },
  finance: { en: "Finance", el: "Χρηματοδότηση" },
  general: { en: "General", el: "Γενικά" },
};

export default async function GlossaryIndex({ params }: { params: Params }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);
  const isEl = locale === "el";

  const grouped = new Map<string, GlossaryEntry[]>();
  for (const e of GLOSSARY) {
    const k = e.category ?? "general";
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(e);
  }
  const order = ["reporting", "carbon", "policy", "standards", "finance", "general"];

  return (
    <>
      <MarketingHeader />
      <main className="mx-auto max-w-5xl px-6 pb-24 pt-32">
        <div className="text-xs uppercase tracking-[0.2em] text-foreground/50">
          {isEl ? "Πόροι" : "Resources"}
        </div>
        <h1 className="mt-3 font-serif text-5xl leading-[1.05] tracking-tight md:text-6xl">
          {isEl ? "Γλωσσάρι βιωσιμότητας" : "Sustainability glossary"}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/80">
          {isEl
            ? "Ορισμοί όρων ESG, κλίματος και συμμόρφωσης της ΕΕ, γραμμένοι για ΜμΕ - χωρίς εταιρικό jargon."
            : "Plain-language definitions for ESG, climate, and EU-compliance terms - written for SMEs, without the corporate jargon."}
        </p>

        <div className="mt-16 space-y-16">
          {order.filter((k) => grouped.has(k)).map((k) => (
            <section key={k}>
              <div className="mb-6 flex items-baseline justify-between border-b border-foreground/10 pb-3">
                <h2 className="font-serif text-2xl">{CATEGORY_LABELS[k][isEl ? "el" : "en"]}</h2>
                <span className="text-xs uppercase tracking-[0.2em] text-foreground/40">
                  {grouped.get(k)!.length} {isEl ? "όροι" : "terms"}
                </span>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2">
                {grouped.get(k)!
                  .sort((a, b) => a.term.localeCompare(b.term))
                  .map((e) => (
                    <li key={e.termSlug}>
                      <Link href={`/${locale}/glossary/${e.termSlug}`}
                        className="block border border-foreground/10 p-4 transition hover:border-foreground/40">
                        <div className="font-medium">{e.term}</div>
                        <div className="mt-1 text-sm leading-relaxed text-foreground/65 line-clamp-2">
                          {isEl ? e.el : e.en}
                        </div>
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
