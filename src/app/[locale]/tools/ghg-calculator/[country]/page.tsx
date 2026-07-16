import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getTool } from "@/data/tools";
import { COUNTRIES, COUNTRY_NEIGHBOURS, COUNTRY_SLUGS, getCountry } from "@/data/tools/countries";
import ToolShell, { type FaqItem, type MethodologyItem } from "@/components/tools/ToolShell";
import GhgCalculator from "@/components/tools/widgets/GhgCalculator";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://verdeiq.stauniverse.tech").replace(/\/$/, "");
const SLUG = "ghg-calculator";

export function generateStaticParams() {
  const params: Array<{ locale: string; country: string }> = [];
  for (const locale of routing.locales) {
    for (const country of COUNTRY_SLUGS) params.push({ locale, country });
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? (locale as (typeof routing.locales)[number])
    : routing.defaultLocale;
  const entry = getCountry(country);
  if (!entry) return {};
  const c = entry[safeLocale === "el" ? "el" : "en"];
  const tool = getTool(SLUG)!;
  const url = `${SITE_URL}/${safeLocale}/tools/${SLUG}/${country}`;
  const ogImage = `${SITE_URL}${tool.heroImage}`;

  const languages: Record<string, string> = {};
  for (const l of routing.locales)
    languages[l === "el" ? "el-CY" : l] = `${SITE_URL}/${l}/tools/${SLUG}/${country}`;
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}/tools/${SLUG}/${country}`;

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
      type: "website",
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

const SHARED_FAQ = {
  en: [
    {
      q: "Are the calculations audit-grade?",
      a: "No. The tool is an indicative screening estimate using published 2024 factors. For CSRD, VSME or SBTi disclosure you still need metered activity data, a defined organisational boundary and - for Scope 2 - dual location-based and market-based reporting.",
    },
    {
      q: "Is my data saved anywhere?",
      a: "No. Every value stays in your browser's local storage. Nothing is uploaded, shared or read by us.",
    },
    {
      q: "Can I export the report for my auditor?",
      a: 'Yes. "Save as PDF" produces a print-formatted report. "Download CSV" gives you the raw data for Excel or a reporting platform.',
    },
  ] as FaqItem[],
  el: [
    {
      q: "Είναι οι υπολογισμοί έτοιμοι για έλεγχο;",
      a: "Όχι. Το εργαλείο δίνει ενδεικτική εκτίμηση με δημοσιευμένους συντελεστές 2024. Για CSRD/VSME/SBTi χρειάζεστε μετρημένα δεδομένα, ορισμένα οργανωσιακά όρια και - για Scope 2 - location-based + market-based αναφορά.",
    },
    {
      q: "Αποθηκεύονται τα δεδομένα μου;",
      a: "Όχι. Όλα παραμένουν στο πρόγραμμα περιήγησής σας.",
    },
    {
      q: "Μπορώ να εξάγω αναφορά για ελεγκτή;",
      a: 'Ναι. "Αποθήκευση PDF" παράγει αναφορά έτοιμη για εκτύπωση. "Λήψη CSV" δίνει τα δεδομένα σε μορφή Excel.',
    },
  ] as FaqItem[],
};

const COPY = {
  en: {
    methodologyHeading: "How this country's factor is derived",
    factorRow: "2023 electricity emission factor",
    driversLabel: "Grid mix drivers",
    workedExampleHeading: "Worked example",
    faqHeading: "Frequently asked questions",
    relatedHeading: "Related guides",
    localizedHeading: "Other country versions",
    localizedIntro:
      "Same calculator, pre-loaded with each country's grid factor and a domestic worked example. Handy when a multi-country group needs consistent per-site numbers.",
    ctaHeading: "Ready to go beyond a country calculator?",
    ctaBody:
      "VerdeIQ centralises your GHG inventory, CBAM filings and CSRD disclosures across every site - with supplier data collection, evidence trails and role-based permissions.",
    ctaAction: "Try VerdeIQ",
  },
  el: {
    methodologyHeading: "Πώς προκύπτει ο συντελεστής της χώρας",
    factorRow: "Συντελεστής εκπομπών ρεύματος 2023",
    driversLabel: "Παράγοντες ενεργειακού μείγματος",
    workedExampleHeading: "Παράδειγμα",
    faqHeading: "Συχνές ερωτήσεις",
    relatedHeading: "Σχετικοί οδηγοί",
    localizedHeading: "Άλλες εκδόσεις ανά χώρα",
    localizedIntro:
      "Ο ίδιος υπολογιστής, με προεπιλεγμένο τον συντελεστή δικτύου κάθε χώρας και τοπικό παράδειγμα. Χρήσιμο όταν πολυεθνικός όμιλος χρειάζεται συνεπείς μετρήσεις ανά εγκατάσταση.",
    ctaHeading: "Έτοιμοι για κάτι περισσότερο από έναν υπολογιστή χώρας;",
    ctaBody:
      "Η VerdeIQ ενοποιεί απογραφή GHG, αναφορές CBAM και αποκαλύψεις CSRD σε όλες τις εγκαταστάσεις - με συλλογή δεδομένων προμηθευτών και δικαιώματα ρόλων.",
    ctaAction: "Δοκιμάστε το VerdeIQ",
  },
} as const;

export default async function GhgCalculatorCountryPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const entry = getCountry(country);
  if (!entry) notFound();

  const safeLocale = locale as "en" | "el";
  const tool = getTool(SLUG)!;
  const c = entry[safeLocale];
  const copy = COPY[safeLocale];
  const url = `${SITE_URL}/${safeLocale}/tools/${SLUG}/${country}`;
  const heroUrl = `${SITE_URL}${tool.heroImage}`;

  const methodology: MethodologyItem[] = [
    { label: copy.factorRow, value: `${entry.gridFactor} kg CO₂e / kWh · ${entry.factorSource} (${entry.factorYear}).` },
    { label: copy.driversLabel, value: c.drivers.join(" · ") },
    {
      label: safeLocale === "el" ? "Scope 1 · Φυσικό αέριο" : "Scope 1 · Natural gas",
      value: "0.184 kg CO₂e / kWh · DEFRA 2024.",
    },
    {
      label: safeLocale === "el" ? "Scope 1 · Πετρέλαιο & βενζίνη" : "Scope 1 · Diesel & petrol",
      value: "2.51 kg / L diesel, 2.31 kg / L petrol · DEFRA 2024.",
    },
    {
      label: safeLocale === "el" ? "Scope 3 · Αγορές (spend-based)" : "Scope 3 · Purchased goods (spend-based)",
      value: "0.35 kg CO₂e / EUR · EEIO screening factor. Replace with supplier-specific before disclosure.",
    },
  ];

  const faq: FaqItem[] = [...c.faq, ...SHARED_FAQ[safeLocale]];

  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: c.title,
    description: c.metaDescription,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any (web)",
    url,
    inLanguage: safeLocale === "el" ? "el-CY" : "en",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    publisher: { "@type": "Organization", name: "VerdeIQ", url: SITE_URL },
    image: heroUrl,
    countryOfOrigin: { "@type": "Country", name: c.name },
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
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
      { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE_URL}/${safeLocale}/tools` },
      { "@type": "ListItem", position: 3, name: tool[safeLocale].title, item: `${SITE_URL}/${safeLocale}/tools/${SLUG}` },
      { "@type": "ListItem", position: 4, name: c.name, item: url },
    ],
  };

  const neighbours = COUNTRY_NEIGHBOURS[entry.slug] ?? [];
  const otherCountries = COUNTRIES.filter((k) => k.slug !== entry.slug);

  // "Localized versions" block - rendered inside worked-example slot so it
  // sits directly after the domestic story and drives the internal-link mesh.
  const workedExampleBody = (
    <>
      <p>{c.workedExample}</p>
      <div className="mt-10 border-t border-foreground/15 pt-8">
        <p className="eyebrow">
          {copy.localizedHeading}
        </p>
        <p className="mt-3 max-w-2xl text-[14.5px] leading-[1.6] text-foreground/60">
          {copy.localizedIntro}
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {neighbours.map((n) => {
            const nc = getCountry(n);
            if (!nc) return null;
            return (
              <li key={n}>
                <Link
                  href={`/${safeLocale}/tools/${SLUG}/${n}`}
                  className="group flex items-baseline justify-between gap-4 border-t border-foreground/10 py-3 text-[14px] transition hover:border-foreground/40"
                >
                  <span className="font-medium text-foreground/90 group-hover:text-foreground">
                    {nc[safeLocale].name}
                  </span>
                  <span className="tabular-nums text-[12px] text-foreground/50">
                    {nc.gridFactor} kg/kWh
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <details className="mt-6 text-[13px] text-foreground/60">
          <summary className="cursor-pointer text-foreground/70 underline-offset-4 hover:underline">
            {safeLocale === "el" ? "Όλες οι χώρες" : "All countries"} ({otherCountries.length})
          </summary>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {otherCountries.map((k) => (
              <li key={k.slug}>
                <Link
                  href={`/${safeLocale}/tools/${SLUG}/${k.slug}`}
                  className="flex items-baseline justify-between border-b border-foreground/5 py-1.5 hover:text-foreground"
                >
                  <span>{k[safeLocale].name}</span>
                  <span className="tabular-nums text-[11.5px] text-foreground/45">
                    {k.gridFactor}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <ToolShell
        locale={safeLocale}
        slug={SLUG}
        eyebrow={c.eyebrow}
        title={c.title}
        subtitle={c.subtitle}
        heroImage={tool.heroImage}
        updatedAt={tool.updatedAt}
        methodologyHeading={copy.methodologyHeading}
        methodologyIntro={c.methodologyNote}
        methodology={methodology}
        workedExampleHeading={copy.workedExampleHeading}
        workedExampleBody={workedExampleBody}
        faqHeading={copy.faqHeading}
        faq={faq}
        relatedHeading={copy.relatedHeading}
        relatedPillarSlugs={tool.relatedPillars}
        ctaHeading={copy.ctaHeading}
        ctaBody={copy.ctaBody}
        ctaAction={copy.ctaAction}
      >
        <GhgCalculator
          locale={safeLocale}
          initialRegion={entry.region}
          lockRegion
          storageKey={`verdeiq.tool.ghg.${entry.slug}`}
        />
      </ToolShell>
    </>
  );
}
