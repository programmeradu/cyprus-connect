import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getAllPillars } from "@/data/learn/pillars";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://verdeiq.stauniverse.tech").replace(/\/$/, "");

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? (locale as (typeof routing.locales)[number])
    : routing.defaultLocale;

  const title = safeLocale === "el"
    ? "Κόμβος Γνώσης VerdeIQ — CSRD, VSME, CBAM & Λογιστική Άνθρακα"
    : "VerdeIQ Learn — CSRD, VSME, CBAM & Carbon Accounting Guides";
  const description = safeLocale === "el"
    ? "Πρακτικοί οδηγοί για CSRD, VSME, CBAM, ESRS και βιωσιμότητα ΜμΕ — γραμμένοι για CFOs και υπεύθυνους βιωσιμότητας στην ΕΕ και την Κύπρο."
    : "Practical guides on CSRD, VSME, CBAM, ESRS, and SME sustainability — written for CFOs and sustainability leads across the EU and Cyprus.";

  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l === "el" ? "el-CY" : l] = `${SITE_URL}/${l}/learn`;
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}/learn`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/${safeLocale}/learn`, languages },
    openGraph: {
      title, description,
      url: `${SITE_URL}/${safeLocale}/learn`,
      siteName: "VerdeIQ",
      locale: safeLocale === "el" ? "el_CY" : "en_US",
      type: "website",
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`${SITE_URL}/og-image.png`] },
  };
}

const CATEGORY_LABELS: Record<string, { en: string; el: string }> = {
  csrd: { en: "CSRD & ESRS", el: "CSRD & ESRS" },
  cbam: { en: "CBAM", el: "CBAM" },
  carbon: { en: "Carbon Accounting", el: "Λογιστική Άνθρακα" },
  esg: { en: "ESG Reporting", el: "ESG Αναφορές" },
  sme: { en: "For SMEs", el: "Για ΜμΕ" },
  cyprus: { en: "Cyprus Focus", el: "Εστίαση Κύπρου" },
  standards: { en: "Standards", el: "Πρότυπα" },
};

export default async function LearnIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const safeLocale = locale as "en" | "el";
  const pillars = getAllPillars();

  const heading = safeLocale === "el" ? "Κόμβος Γνώσης" : "Learn";
  const subheading = safeLocale === "el"
    ? "Πρακτικοί οδηγοί για CSRD, VSME, CBAM, ESRS και βιωσιμότητα ΜμΕ."
    : "Practical guides on CSRD, VSME, CBAM, ESRS, and SME sustainability.";

  // Group by category
  const grouped = new Map<string, typeof pillars>();
  for (const p of pillars) {
    const arr = grouped.get(p.category) ?? [];
    arr.push(p);
    grouped.set(p.category, arr);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-16 sm:pt-24">
      <header className="mb-16 max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">VerdeIQ</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">{heading}</h1>
        <p className="mt-6 text-xl text-muted-foreground">{subheading}</p>
      </header>

      {Array.from(grouped.entries()).map(([cat, items]) => (
        <section key={cat} className="mb-16">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight">
            {CATEGORY_LABELS[cat]?.[safeLocale] ?? cat}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => {
              const c = p[safeLocale];
              return (
                <Link
                  key={p.slug}
                  href={`/${safeLocale}/learn/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border transition hover:border-primary/50 hover:shadow-lg"
                >
                  <div className="relative aspect-[16/9] w-full bg-muted">
                    <Image src={p.heroImage} alt={c.title} fill sizes="(min-width: 1024px) 380px, (min-width: 768px) 45vw, 100vw" className="object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs uppercase tracking-widest text-primary">{c.heroEyebrow}</p>
                    <h3 className="mt-2 text-lg font-semibold leading-snug group-hover:text-primary">{c.title}</h3>
                    <p className="mt-3 flex-1 text-sm text-muted-foreground line-clamp-3">{c.metaDescription}</p>
                    <p className="mt-4 text-xs text-muted-foreground">{p.readingMinutes} min read</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
