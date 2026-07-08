import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getPillar, getRelatedPillars, PILLAR_SLUGS } from "@/data/learn/pillars";
import PillarShell from "@/components/learn/PillarShell";
import CsrdVsmeChecker from "@/components/learn/widgets/CsrdVsmeChecker";
import ScopeCalculator from "@/components/learn/widgets/ScopeCalculator";
import CbamEstimator from "@/components/learn/widgets/CbamEstimator";
import type { Metadata } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://verdeiq.stauniverse.tech").replace(/\/$/, "");

export function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = [];
  for (const locale of routing.locales) {
    for (const slug of PILLAR_SLUGS) params.push({ locale, slug });
  }
  return params;
}

type Params = Promise<{ locale: string; slug: string }>;

/**
 * Map each pillar to an optional interactive widget, inserted after the Nth section.
 */
const WIDGET_MAP: Record<string, { widget: "csrd" | "scope" | "cbam"; afterSection: number }> = {
  "csrd-reporting-guide": { widget: "csrd", afterSection: 1 },
  "csrd-reporting-cyprus": { widget: "csrd", afterSection: 1 },
  "vsme-reporting-guide": { widget: "csrd", afterSection: 1 },
  "esrs-standards-explained": { widget: "csrd", afterSection: 1 },
  "eu-taxonomy-explained": { widget: "csrd", afterSection: 1 },
  "sustainability-reporting-eu": { widget: "csrd", afterSection: 1 },
  "double-materiality-assessment": { widget: "csrd", afterSection: 1 },
  "scope-1-2-3-emissions": { widget: "scope", afterSection: 1 },
  "scope-3-emissions-calculation": { widget: "scope", afterSection: 1 },
  "ghg-protocol-guide": { widget: "scope", afterSection: 1 },
  "carbon-accounting-for-smes": { widget: "scope", afterSection: 1 },
  "carbon-footprint-software-smes": { widget: "scope", afterSection: 1 },
  "net-zero-roadmap-smes": { widget: "scope", afterSection: 1 },
  "science-based-targets-sbti": { widget: "scope", afterSection: 1 },
  "cbam-explained": { widget: "cbam", afterSection: 1 },
  "cbam-cyprus": { widget: "cbam", afterSection: 1 },
};

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

  const toc = c.sections.map((s, i) => ({ id: `section-${i}`, heading: s.heading }));

  const widgetConfig = WIDGET_MAP[slug];
  const renderWidget = () => {
    if (!widgetConfig) return null;
    if (widgetConfig.widget === "csrd") return <CsrdVsmeChecker locale={safeLocale} />;
    if (widgetConfig.widget === "scope") return <ScopeCalculator locale={safeLocale} />;
    if (widgetConfig.widget === "cbam") return <CbamEstimator locale={safeLocale} />;
    return null;
  };

  const introduction = c.introduction.map((p, i) => <p key={i}>{p}</p>);

  const sectionsContent = (
    <>
      {c.sections.map((s, i) => (
        <section key={i} id={`section-${i}`} className="scroll-mt-28">
          <h2>{s.heading}</h2>
          {s.body.map((p, j) => (
            <p key={j}>{p}</p>
          ))}
          {widgetConfig && widgetConfig.afterSection === i && renderWidget()}
        </section>
      ))}
    </>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <PillarShell
        locale={safeLocale}
        slug={slug}
        eyebrow={c.heroEyebrow}
        title={c.title}
        subtitle={c.heroSubtitle}
        heroImage={pillar.heroImage}
        updatedAt={pillar.updatedAt}
        readingMinutes={pillar.readingMinutes}
        tocLabel={c.tocLabel}
        toc={toc}
        keyTakeaways={c.keyTakeaways}
        introduction={introduction}
        sectionsContent={sectionsContent}
        faq={c.faq}
        cta={{ heading: c.ctaHeading, body: c.ctaBody }}
        related={related.map((r) => ({
          slug: r.slug,
          heroImage: r.heroImage,
          eyebrow: r[safeLocale].heroEyebrow,
          title: r[safeLocale].title,
          readingMinutes: r.readingMinutes,
        }))}
      />
    </>
  );
}
