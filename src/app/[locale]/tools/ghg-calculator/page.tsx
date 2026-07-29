import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getTool } from "@/data/tools";
import { COUNTRIES } from "@/data/tools/countries";
import ToolShell, { type FaqItem, type MethodologyItem } from "@/components/tools/ToolShell";
import GhgCalculator from "@/components/tools/widgets/GhgCalculator";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://vuneli.com").replace(/\/$/, "");
const SLUG = "ghg-calculator";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? (locale as (typeof routing.locales)[number])
    : routing.defaultLocale;
  const tool = getTool(SLUG)!;
  const c = tool[safeLocale === "el" ? "el" : "en"];
  const url = `${SITE_URL}/${safeLocale}/tools/${SLUG}`;
  const ogImage = `${SITE_URL}${tool.heroImage}`;

  const languages: Record<string, string> = {};
  for (const l of routing.locales)
    languages[l === "el" ? "el-CY" : l] = `${SITE_URL}/${l}/tools/${SLUG}`;
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}/tools/${SLUG}`;

  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: url, languages },
    openGraph: {
      title: c.metaTitle,
      description: c.metaDescription,
      url,
      siteName: "Vuneli",
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

const COPY = {
  en: {
    methodologyHeading: "How the numbers are calculated",
    methodologyIntro:
      "Every activity is multiplied by a peer-reviewed 2024 emission factor and expressed in tonnes of CO₂-equivalent. Scope 2 uses the location-based method - pick your country and the electricity factor updates instantly. Nothing is stored on our servers; the calculation runs entirely in your browser.",
    methodology: [
      { label: "Natural gas (Scope 1)", value: "0.184 kg CO₂e / kWh gross CV · DEFRA 2024 combustion factor." },
      { label: "Diesel & petrol (Scope 1)", value: "2.51 kg / L diesel, 2.31 kg / L petrol · DEFRA 2024 mobile combustion, well-to-wheel." },
      { label: "Grid electricity (Scope 2)", value: "Country-specific 2023 residual mix factors (EEA / national inventories). Range from 0.008 (SE) to 0.657 (PL) kg CO₂e / kWh." },
      { label: "Business travel by car (Scope 3.6)", value: "0.170 kg / km · DEFRA 2024 average passenger vehicle." },
      { label: "Flights (Scope 3.6)", value: "Short-haul 0.246 kg / passenger-km, long-haul 0.195 kg / passenger-km · DEFRA 2024 economy class, radiative forcing included." },
      { label: "Purchased goods & services (Scope 3.1)", value: "0.35 kg CO₂e / EUR - spend-based EEIO screening factor. Replace with supplier-specific data before disclosure." },
      { label: "Waste to landfill (Scope 3.5)", value: "0.467 kg / kg · DEFRA 2024 mixed municipal solid waste." },
      { label: "Water supply (Scope 3.4)", value: "0.344 kg / m³ · DEFRA 2024 water supply + treatment combined." },
    ] as MethodologyItem[],
    workedExampleHeading: "A 45-person consultancy in Nicosia",
    workedExampleBody:
      "Consider a professional services firm in Nicosia: 120,000 kWh of grid electricity in Cyprus (0.622 factor), 25,000 km of pool-car travel, 15,000 km of short-haul flights across the EU, and €400,000 of purchased services. Scope 1 is near zero - no combustion on site. Scope 2 hits 74.6 tCO₂e - the Cyprus grid does the damage. Scope 3 adds 4.3 t travel + 3.7 t flights + 140 t spend-based = around 148 t. Total: ~223 tCO₂e / year. Two levers dominate: switching electricity supply to a Guarantee-of-Origin renewable tariff (Scope 2 → ~7 t) and asking the largest three suppliers for verified activity data (Scope 3.1 drops sharply once EEIO is replaced).",
    faqHeading: "GHG accounting, answered",
    faq: [
      {
        q: "Is this calculator compliant with the GHG Protocol Corporate Standard?",
        a: "It uses the same three-scope structure and location-based Scope 2 method that the GHG Protocol prescribes. For a formal disclosure under CSRD, VSME or SBTi you still need metered activity data, a defined organisational boundary and - for Scope 2 - a dual reporting of market-based factors. Treat the output as directional planning, not audit evidence.",
      },
      {
        q: "Which grid factors should I choose - location-based or market-based?",
        a: "This tool shows location-based factors (the grid average where the electricity was consumed). If you have Guarantees of Origin, PPAs or a green tariff, calculate the market-based number separately using the supplier's residual mix - the GHG Protocol requires both to be reported.",
      },
      {
        q: "Why is my Scope 3 spend-based number so large?",
        a: "The 0.35 kg / EUR factor is an EEIO screening average across all sectors. It over-estimates low-carbon services and under-estimates heavy industry. Use it to spot which spend categories dominate, then replace those categories with supplier-specific or product-specific factors before publishing.",
      },
      {
        q: "Can I include refrigerants, fugitive emissions or company-owned vehicles?",
        a: "Refrigerant leakage (Scope 1) and company-owned vehicles are on the roadmap for the next iteration. For now, estimate refrigerants separately using GWP × kg refrigerant charged and add to Scope 1.",
      },
      {
        q: "Is my data saved anywhere?",
        a: "No. Every value stays in your browser's local storage. Nothing is uploaded, shared or read by us.",
      },
      {
        q: "Which reporting frameworks map to which scopes?",
        a: "CSRD / ESRS E1 requires all three scopes disclosed separately. VSME Basic Module requires Scope 1 and Scope 2 (location-based). SBTi near-term targets require Scope 1+2 always, and Scope 3 if it is more than 40% of total. CBAM is a separate embedded-emissions regime - use our CBAM tool for that.",
      },
      {
        q: "How often are the emission factors updated?",
        a: "DEFRA publishes annually (typically June). EEA grid factors publish annually. This tool is updated within 30 days of a new release - the methodology block shows the version in use.",
      },
      {
        q: "Can I export the report for my auditor?",
        a: 'Yes. "Save as PDF" produces a print-formatted report showing every activity, factor and result. "Download CSV" gives you the raw data for further processing in Excel or a reporting platform.',
      },
    ] as FaqItem[],
    relatedHeading: "Related guides",
    ctaHeading: "Ready to move beyond a calculator?",
    ctaBody:
      "Vuneli centralises your GHG inventory, CBAM filings and CSRD disclosures in one audit-ready platform - with supplier data collection, evidence trails and role-based permissions.",
    ctaAction: "Try Vuneli",
  },
  el: {
    methodologyHeading: "Πώς υπολογίζονται οι αριθμοί",
    methodologyIntro:
      "Κάθε δραστηριότητα πολλαπλασιάζεται με έναν επιστημονικά τεκμηριωμένο συντελεστή 2024 και εκφράζεται σε τόνους ισοδύναμου CO₂. Το Scope 2 χρησιμοποιεί τη μέθοδο βάσει τοποθεσίας - επιλέξτε τη χώρα σας και ο συντελεστής ενημερώνεται άμεσα. Ο υπολογισμός γίνεται εξ ολοκλήρου στο πρόγραμμα περιήγησής σας - τίποτα δεν αποθηκεύεται στους διακομιστές μας.",
    methodology: [
      { label: "Φυσικό αέριο (Scope 1)", value: "0,184 kg CO₂e / kWh · DEFRA 2024." },
      { label: "Πετρέλαιο & βενζίνη (Scope 1)", value: "2,51 kg / L πετρέλαιο, 2,31 kg / L βενζίνη · DEFRA 2024." },
      { label: "Ηλεκτρισμός δικτύου (Scope 2)", value: "Συντελεστές 2023 ανά χώρα (EEA / εθνικά μητρώα). Από 0,008 (SE) έως 0,657 (PL) kg CO₂e / kWh." },
      { label: "Επαγγελματικά ταξίδια - αυτοκίνητο (Scope 3.6)", value: "0,170 kg / km · DEFRA 2024." },
      { label: "Πτήσεις (Scope 3.6)", value: "Μικρή απόσταση 0,246 kg/πκμ, μεγάλη 0,195 kg/πκμ · DEFRA 2024 economy, με RF." },
      { label: "Αγορές αγαθών & υπηρεσιών (Scope 3.1)", value: "0,35 kg CO₂e / € - EEIO για προκαταρκτικό έλεγχο. Αντικαταστήστε με δεδομένα προμηθευτή." },
      { label: "Απόβλητα σε ΧΥΤΑ (Scope 3.5)", value: "0,467 kg / kg · DEFRA 2024." },
      { label: "Παροχή νερού (Scope 3.4)", value: "0,344 kg / m³ · DEFRA 2024 (παροχή + επεξεργασία)." },
    ] as MethodologyItem[],
    workedExampleHeading: "Συμβουλευτική εταιρεία 45 ατόμων στη Λευκωσία",
    workedExampleBody:
      "Μια εταιρεία επαγγελματικών υπηρεσιών: 120.000 kWh ηλεκτρισμού στην Κύπρο (συντελεστής 0,622), 25.000 km με εταιρικά αυτοκίνητα, 15.000 km πτήσεων μικρής απόστασης στην ΕΕ, €400.000 αγορές υπηρεσιών. Scope 1 σχεδόν μηδέν. Scope 2 φτάνει τους 74,6 tCO₂e - το κυπριακό δίκτυο έχει την ευθύνη. Scope 3: 4,3 t αυτοκίνητο + 3,7 t πτήσεις + 140 t δαπάνες = ~148 t. Σύνολο ~223 tCO₂e / έτος. Δύο μοχλοί κυριαρχούν: αλλαγή σε τιμολόγιο GO (Scope 2 → ~7 t) και συλλογή πραγματικών δεδομένων από τους 3 μεγαλύτερους προμηθευτές.",
    faqHeading: "Συχνές ερωτήσεις",
    faq: [
      {
        q: "Είναι ο υπολογιστής συμβατός με το GHG Protocol Corporate Standard;",
        a: "Χρησιμοποιεί την ίδια δομή τριών scopes και τη μέθοδο βάσει τοποθεσίας για το Scope 2. Για επίσημη αναφορά υπό CSRD, VSME ή SBTi χρειάζεστε μετρημένα δεδομένα και σαφή οργανωσιακά όρια - θεωρήστε το αποτέλεσμα ενδεικτικό σχεδιασμού.",
      },
      {
        q: "Location-based ή market-based συντελεστές;",
        a: "Το εργαλείο δείχνει location-based. Αν έχετε GO ή PPA, υπολογίστε ξεχωριστά το market-based - το GHG Protocol απαιτεί και τα δύο.",
      },
      {
        q: "Γιατί είναι τόσο μεγάλο το Scope 3 βάσει δαπάνης;",
        a: "Ο συντελεστής 0,35 kg / € είναι μέσος όρος EEIO. Υπερεκτιμά τις υπηρεσίες χαμηλού άνθρακα. Χρησιμοποιήστε τον για να εντοπίσετε τις κατηγορίες που κυριαρχούν, μετά αντικαταστήστε τις.",
      },
      {
        q: "Αποθηκεύονται τα δεδομένα μου;",
        a: "Όχι. Όλα παραμένουν στο πρόγραμμα περιήγησής σας.",
      },
      {
        q: "Ποιο πλαίσιο απαιτεί ποια scopes;",
        a: "CSRD/ESRS E1: και τα τρία. VSME Basic: 1+2. SBTi: 1+2 πάντα, 3 αν >40% του συνόλου. CBAM: ξεχωριστό καθεστώς - χρησιμοποιήστε το αντίστοιχο εργαλείο.",
      },
      {
        q: "Πόσο συχνά ενημερώνονται οι συντελεστές;",
        a: "Η DEFRA ενημερώνει ετησίως. Το εργαλείο ενημερώνεται εντός 30 ημερών από κάθε νέα έκδοση.",
      },
      {
        q: "Μπορώ να εξάγω αναφορά για τον ελεγκτή μου;",
        a: 'Ναι. "Αποθήκευση PDF" παράγει αναφορά έτοιμη για εκτύπωση. "Λήψη CSV" δίνει τα δεδομένα σε μορφή Excel.',
      },
    ] as FaqItem[],
    relatedHeading: "Σχετικοί οδηγοί",
    ctaHeading: "Έτοιμοι για κάτι περισσότερο από έναν υπολογιστή;",
    ctaBody:
      "Η Vuneli ενοποιεί απογραφή GHG, αναφορές CBAM και αποκαλύψεις CSRD σε μία πλατφόρμα έτοιμη για έλεγχο - με συλλογή δεδομένων προμηθευτών, αποδεικτικά και δικαιώματα ρόλων.",
    ctaAction: "Δοκιμάστε το Vuneli",
  },
} as const;

export default async function GhgCalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const safeLocale = locale as "en" | "el";
  const tool = getTool(SLUG)!;
  const c = tool[safeLocale];
  const copy = COPY[safeLocale];
  const url = `${SITE_URL}/${safeLocale}/tools/${SLUG}`;
  const heroUrl = `${SITE_URL}${tool.heroImage}`;

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
    publisher: { "@type": "Organization", name: "Vuneli", url: SITE_URL },
    image: heroUrl,
  };
  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: safeLocale === "el" ? "Πώς να υπολογίσετε τις εκπομπές GHG" : "How to calculate your GHG emissions",
    step: [
      { "@type": "HowToStep", name: safeLocale === "el" ? "Επιλέξτε έτος και χώρα" : "Pick your year and country" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Εισαγάγετε Scope 1" : "Enter Scope 1 activity" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Εισαγάγετε Scope 2" : "Enter Scope 2 activity" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Εισαγάγετε Scope 3" : "Enter Scope 3 activity" },
      { "@type": "HowToStep", name: safeLocale === "el" ? "Εξάγετε PDF ή CSV" : "Export as PDF or CSV" },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Vuneli", item: `${SITE_URL}/${safeLocale}` },
      { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE_URL}/${safeLocale}/tools` },
      { "@type": "ListItem", position: 3, name: c.title, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />
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
        methodologyIntro={copy.methodologyIntro}
        methodology={copy.methodology}
        workedExampleHeading={copy.workedExampleHeading}
        workedExampleBody={
          <>
            <p>{copy.workedExampleBody}</p>
            <div className="mt-10 border-t border-foreground/15 pt-8">
              <p className="eyebrow">
                {safeLocale === "el" ? "Εκδόσεις ανά χώρα" : "Country-specific versions"}
              </p>
              <p className="mt-3 max-w-2xl text-[14.5px] leading-[1.6] text-foreground/60">
                {safeLocale === "el"
                  ? "Ο ίδιος υπολογιστής, με προεπιλεγμένο τον συντελεστή δικτύου κάθε χώρας και ένα τοπικό παράδειγμα."
                  : "Same calculator, pre-loaded with each country's grid factor and a domestic worked example."}
              </p>
              <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {COUNTRIES.map((k) => (
                  <li key={k.slug}>
                    <Link
                      href={`/${safeLocale}/tools/${SLUG}/${k.slug}`}
                      className="group flex items-baseline justify-between gap-4 border-b border-foreground/10 py-2 text-[14px] transition hover:border-foreground/40"
                    >
                      <span className="font-medium text-foreground/85 group-hover:text-foreground">
                        {k[safeLocale].name}
                      </span>
                      <span className="tabular-nums text-[11.5px] text-foreground/45">
                        {k.gridFactor} kg/kWh
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </>
        }
        faqHeading={copy.faqHeading}
        faq={copy.faq}
        relatedHeading={copy.relatedHeading}
        relatedPillarSlugs={tool.relatedPillars}
        ctaHeading={copy.ctaHeading}
        ctaBody={copy.ctaBody}
        ctaAction={copy.ctaAction}
      >
        <GhgCalculator locale={safeLocale} />
      </ToolShell>
    </>
  );
}
