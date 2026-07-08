import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getPillar, getRelatedPillars, PILLAR_SLUGS } from "@/data/learn/pillars";
import type { Metadata } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://verdeiq.stauniverse.tech").replace(/\/$/, "");

export function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = [];
  for (const locale of routing.locales) {
    for (const slug of PILLAR_SLUGS) {
      params.push({ locale, slug });
    }
  }
  return params;
}

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const pillar = getPillar(slug);
  if (!pillar) return {};

  const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? (locale as (typeof routing.locales)[number])
    : routing.defaultLocale;
  const c = pillar[safeLocale === "el" ? "el" : "en"];

  const url = `${SITE_URL}/${safeLocale}/learn/${slug}`;
  const ogImage = `${SITE_URL}${pillar.heroImage}`;

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l === "el" ? "el-CY" : l] = `${SITE_URL}/${l}/learn/${slug}`;
  }
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}/learn/${slug}`;

  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: url, languages },
    openGraph: {
      title: c.metaTitle,
      description: c.metaDescription,
      url,
      siteName: "VerdeIQ",
      locale: safeLocale === "el" ? "el_CY" : "en_US",
      alternateLocale: safeLocale === "el" ? ["en_US"] : ["el_CY"],
      type: "article",
      publishedTime: pillar.publishedAt,
      modifiedTime: pillar.updatedAt,
      images: [{ url: ogImage, width: 1600, height: 900, alt: c.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: c.metaTitle,
      description: c.metaDescription,
      images: [ogImage],
    },
  };
}

export default async function PillarPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const pillar = getPillar(slug);
  if (!pillar) notFound();

  const safeLocale = locale as "en" | "el";
  const c = pillar[safeLocale];
  const related = getRelatedPillars(slug);
  const url = `${SITE_URL}/${safeLocale}/learn/${slug}`;
  const heroUrl = `${SITE_URL}${pillar.heroImage}`;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.title,
    description: c.metaDescription,
    image: [heroUrl],
    datePublished: pillar.publishedAt,
    dateModified: pillar.updatedAt,
    inLanguage: safeLocale === "el" ? "el-CY" : "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: "VerdeIQ", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "VerdeIQ",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.png` },
    },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "VerdeIQ", item: `${SITE_URL}/${safeLocale}` },
      { "@type": "ListItem", position: 2, name: "Learn", item: `${SITE_URL}/${safeLocale}/learn` },
      { "@type": "ListItem", position: 3, name: c.title, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <article className="mx-auto w-full max-w-4xl px-6 pb-24 pt-16 sm:pt-24">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href={`/${safeLocale}`} className="hover:text-foreground">VerdeIQ</Link></li>
            <li aria-hidden>/</li>
            <li><Link href={`/${safeLocale}/learn`} className="hover:text-foreground">Learn</Link></li>
            <li aria-hidden>/</li>
            <li className="text-foreground truncate max-w-[60vw]" aria-current="page">{c.title}</li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="mb-10">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">{c.heroEyebrow}</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            {c.title}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">{c.heroSubtitle}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <time dateTime={pillar.updatedAt}>
              {new Date(pillar.updatedAt).toLocaleDateString(safeLocale === "el" ? "el-CY" : "en-GB", { year: "numeric", month: "long", day: "numeric" })}
            </time>
            <span aria-hidden>•</span>
            <span>{pillar.readingMinutes} min read</span>
          </div>
        </header>

        {/* Hero image */}
        <div className="relative mb-14 aspect-[16/9] w-full overflow-hidden rounded-3xl border bg-muted">
          <Image
            src={pillar.heroImage}
            alt={c.title}
            fill
            priority
            sizes="(min-width: 1024px) 896px, 100vw"
            className="object-cover"
          />
        </div>

        {/* Introduction */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {c.introduction.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Table of contents */}
        <nav aria-label={c.tocLabel} className="my-14 rounded-2xl border bg-card/50 p-6">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">{c.tocLabel}</p>
          <ol className="space-y-2 text-base">
            {c.sections.map((s, i) => (
              <li key={i}>
                <a href={`#section-${i}`} className="text-foreground hover:text-primary hover:underline">
                  {i + 1}. {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {c.sections.map((s, i) => (
            <section key={i} id={`section-${i}`} className="scroll-mt-24">
              <h2>{s.heading}</h2>
              {s.body.map((p, j) => <p key={j}>{p}</p>)}
            </section>
          ))}
        </div>

        {/* Key takeaways */}
        <section aria-labelledby="key-takeaways" className="my-16 rounded-3xl border bg-gradient-to-br from-primary/5 to-transparent p-8">
          <h2 id="key-takeaways" className="mt-0 text-2xl font-semibold">
            {safeLocale === "el" ? "Βασικά συμπεράσματα" : "Key takeaways"}
          </h2>
          <ul className="mt-4 space-y-3">
            {c.keyTakeaways.map((k, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden className="mt-2 inline-block h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                <span>{k}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="mt-16">
          <h2 id="faq-heading" className="text-3xl font-semibold tracking-tight">
            {safeLocale === "el" ? "Συχνές ερωτήσεις" : "Frequently asked questions"}
          </h2>
          <div className="mt-8 divide-y divide-border">
            {c.faq.map((f, i) => (
              <details key={i} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-lg font-medium">
                  <span>{f.q}</span>
                  <span aria-hidden className="mt-1 text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="my-16 overflow-hidden rounded-3xl border bg-gradient-to-br from-primary to-primary/70 p-10 text-primary-foreground">
          <h2 className="mt-0 text-3xl font-semibold tracking-tight">{c.ctaHeading}</h2>
          <p className="mt-4 max-w-2xl text-lg text-primary-foreground/90">{c.ctaBody}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/${safeLocale}/pricing`}
              className="inline-flex items-center rounded-full bg-background px-6 py-3 text-sm font-medium text-foreground shadow-sm hover:bg-background/90"
            >
              {safeLocale === "el" ? "Δείτε τα πλάνα" : "See pricing"}
            </Link>
            <Link
              href={`/${safeLocale}/auth/sign-up`}
              className="inline-flex items-center rounded-full border border-primary-foreground/40 px-6 py-3 text-sm font-medium hover:bg-primary-foreground/10"
            >
              {safeLocale === "el" ? "Δωρεάν δοκιμή" : "Start free trial"}
            </Link>
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section aria-labelledby="related" className="mt-16">
            <h2 id="related" className="text-2xl font-semibold tracking-tight">
              {safeLocale === "el" ? "Συνεχίστε την ανάγνωση" : "Continue reading"}
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {related.map((r) => {
                const rc = r[safeLocale];
                return (
                  <Link
                    key={r.slug}
                    href={`/${safeLocale}/learn/${r.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border transition hover:border-primary/50 hover:shadow-md"
                  >
                    <div className="relative aspect-[16/9] w-full bg-muted">
                      <Image src={r.heroImage} alt={rc.title} fill sizes="(min-width: 640px) 400px, 100vw" className="object-cover" />
                    </div>
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-widest text-primary">{rc.heroEyebrow}</p>
                      <h3 className="mt-2 text-lg font-semibold leading-snug group-hover:text-primary">{rc.title}</h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
