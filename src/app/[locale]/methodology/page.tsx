import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import {
  FACTOR_REGISTRY,
  OFFICIAL_CYPRUS_GRID_FACTOR,
  OFFICIAL_CYPRUS_WATER_FACTOR,
  LOCATION_BASED_GRID_FACTORS,
} from "@/lib/factors/registry";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://vuneli.com").replace(/\/$/, "");

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const isEl = locale === "el";
  const title = isEl
    ? "Μεθοδολογία Υπολογισμού & Συντελεστές Εκπομπών | Vuneli"
    : "Methodology and emission factors | Vuneli";
  const description = isEl
    ? "Επίσημη μεθοδολογία υπολογισμού εκπομπών GHG, πηγές συντελεστών (ΑΗΚ, ΤΑΥ, DEFRA, EEA) και αρχές επαλήθευσης αποτυπώματος για κυπριακές ΜμΕ."
    : "How Vuneli works out a Cyprus business footprint from its bills: the emission factors we use, where they come from, and how figures are checked.";
  const url = `${SITE_URL}/${locale}/methodology`;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l === "el" ? "el-CY" : l] = `${SITE_URL}/${l}/methodology`;
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}/methodology`;

  return {
    title,
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      title,
      description,
      url,
      siteName: "Vuneli",
      type: "website",
      locale: isEl ? "el_CY" : "en_US",
      images: [{ url: `${SITE_URL}/assets/methodology/hero.jpg`, width: 1600, height: 1200, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/assets/methodology/hero.jpg`],
    },
  };
}

const T = {
  en: {
    eyebrow: "Methodology",
    title: "How Vuneli works out your footprint",
    subtitle:
      "We start from your bills, multiply by published emission factors, and show which source each figure came from. When something is missing, we leave it blank instead of guessing.",
    lastUpdated: "October 2026",
    frameworksTitle: "Standards we follow",
    frameworksDesc:
      "We use the GHG Protocol and the EFRAG VSME standard, with factors chosen for how electricity is made in Cyprus.",
    factorsTitle: "Emission factors",
    factorsDesc:
      "The app, reports, Verde and the free calculators all read these factors from the same list, so a figure is the same wherever you see it.",
    factorsHeaders: {
      category: "Activity",
      factor: "Factor",
      scope: "Scope",
      authority: "Source",
      vintage: "Year",
    },
    provenanceTitle: "Tracing a figure back to its bill",
    provenanceText1:
      "When you add an EAC electricity bill or a fuel receipt, we read the amount used (kWh or litres) and keep the bill with the figure. You can open the bill behind any number.",
    provenanceText2:
      "Each PDF we issue carries a SHA-256 fingerprint of its contents. If anything in the document is changed, the fingerprint no longer matches. Anyone with a copy can check it at",
    verifiedActionsTitle: "When a project counts as done",
    verifiedActionsText:
      "Projects in the Action plan, such as rooftop solar or a new heat pump, can't be ticked off by hand. A project is confirmed only when every check for its type passes:",
    verifiedAnchor1Title: "Proof of purchase",
    verifiedAnchor1Desc: "A supplier invoice we can read, showing the supplier, the date and what was installed, or a bank payment you link to the project.",
    verifiedAnchor2Title: "Lower bills afterwards",
    verifiedAnchor2Desc: "Where the project should cut use, later bills must be clearly lower than the same months a year before.",
    ctaTitle: "Questions about our numbers",
    ctaDesc: "Auditors, banks and customers can ask us how any figure was worked out.",
    ctaButton: "Contact us",
  },
  el: {
    eyebrow: "Μεθοδολογία",
    title: "Πώς η Vuneli υπολογίζει το αποτύπωμά σας",
    subtitle:
      "Ξεκινάμε από τους λογαριασμούς σας, πολλαπλασιάζουμε με δημοσιευμένους συντελεστές και δείχνουμε από πού προέρχεται κάθε αριθμός. Όταν κάτι λείπει, το αφήνουμε κενό αντί να μαντέψουμε.",
    lastUpdated: "Οκτώβριος 2026",
    frameworksTitle: "Πρότυπα που ακολουθούμε",
    frameworksDesc:
      "Χρησιμοποιούμε το GHG Protocol και το πρότυπο EFRAG VSME, με συντελεστές για τον τρόπο παραγωγής ρεύματος στην Κύπρο.",
    factorsTitle: "Συντελεστές εκπομπών",
    factorsDesc:
      "Η εφαρμογή, οι εκθέσεις, ο Verde και οι δωρεάν υπολογιστές διαβάζουν τους ίδιους συντελεστές, οπότε ένας αριθμός είναι ίδιος παντού.",
    factorsHeaders: {
      category: "Δραστηριότητα",
      factor: "Συντελεστής",
      scope: "Πεδίο",
      authority: "Πηγή",
      vintage: "Έτος",
    },
    provenanceTitle: "Από τον αριθμό στον λογαριασμό",
    provenanceText1:
      "Όταν προσθέτετε λογαριασμό ΑΗΚ ή απόδειξη καυσίμων, διαβάζουμε την κατανάλωση (kWh ή λίτρα) και κρατάμε τον λογαριασμό μαζί με τον αριθμό. Μπορείτε να ανοίξετε τον λογαριασμό πίσω από κάθε αριθμό.",
    provenanceText2:
      "Κάθε PDF που εκδίδουμε έχει αποτύπωμα SHA-256 του περιεχομένου του. Αν αλλάξει κάτι στο έγγραφο, το αποτύπωμα δεν ταιριάζει πια. Όποιος έχει αντίγραφο μπορεί να το ελέγξει στο",
    verifiedActionsTitle: "Πότε ένα έργο θεωρείται ολοκληρωμένο",
    verifiedActionsText:
      "Τα έργα στο Σχέδιο δράσης, όπως φωτοβολταϊκά ή αντλία θερμότητας, δεν σημειώνονται με το χέρι. Ένα έργο επιβεβαιώνεται μόνο όταν περάσουν όλοι οι έλεγχοι του τύπου του:",
    verifiedAnchor1Title: "Απόδειξη αγοράς",
    verifiedAnchor1Desc: "Τιμολόγιο προμηθευτή που μπορούμε να διαβάσουμε, με προμηθευτή, ημερομηνία και τι εγκαταστάθηκε, ή τραπεζική πληρωμή που συνδέετε με το έργο.",
    verifiedAnchor2Title: "Χαμηλότεροι λογαριασμοί μετά",
    verifiedAnchor2Desc: "Όπου το έργο πρέπει να μειώσει την κατανάλωση, οι επόμενοι λογαριασμοί πρέπει να είναι σαφώς χαμηλότεροι από τους ίδιους μήνες του προηγούμενου έτους.",
    ctaTitle: "Ερωτήσεις για τους αριθμούς μας",
    ctaDesc: "Ελεγκτές, τράπεζες και πελάτες μπορούν να μας ρωτήσουν πώς υπολογίστηκε κάθε αριθμός.",
    ctaButton: "Επικοινωνία",
  },
} as const;

export default async function MethodologyPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  const isEl = locale === "el";
  const t = T[isEl ? "el" : "en"];

  const factorsList = Object.values(FACTOR_REGISTRY);

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased" style={{ fontFamily: "var(--editorial-sans)" }}>
      <MarketingHeader />

      {/* Hero Section */}
      <section data-dark-hero className="relative isolate overflow-hidden bg-[oklch(0.19_0.02_150)] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(180deg, rgba(255,255,255,0.9) 0px, rgba(255,255,255,0.9) 1px, transparent 1px, transparent 34px)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-40 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
          <div className="min-w-0">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-white/65">{t.eyebrow}</p>
          <h1
            className="mt-4 max-w-3xl text-[2.4rem] font-semibold leading-[1.03] tracking-[-0.025em] sm:text-[3.6rem]"
            style={{ fontFamily: "var(--editorial-display)", textWrap: "balance" }}
          >
            {t.title}
          </h1>
          <p className="mt-6 max-w-2xl text-[16.5px] font-medium leading-[1.62] text-white/80 sm:text-[18px]">
            {t.subtitle}
          </p>

          <dl className="mt-10 grid max-w-3xl grid-cols-1 gap-x-10 gap-y-5 border-t border-white/20 pt-6 sm:grid-cols-3">
            <div>
              <dt className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-white/55">
                {isEl ? "Τελευταία Ενημέρωση" : "Last Reviewed"}
              </dt>
              <dd className="mt-1.5 text-[15.5px] font-semibold text-white">{t.lastUpdated}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-white/55">
                {isEl ? "Δικαιοδοσία" : "Primary Jurisdiction"}
              </dt>
              <dd className="mt-1.5 text-[15.5px] font-semibold text-white">{isEl ? "Κυπριακή Δημοκρατία (ΕΕ)" : "Republic of Cyprus (EU)"}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-white/55">
                {isEl ? "Συντελεστής Δικτύου ΑΗΚ" : "Cyprus Grid Intensity"}
              </dt>
              <dd className="mt-1.5 text-[15.5px] font-semibold text-[var(--accent-lime)]">
                {OFFICIAL_CYPRUS_GRID_FACTOR} kg CO₂e / kWh
              </dd>
            </div>
          </dl>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-white/10">
            <Image
              src="/assets/methodology/hero.jpg"
              alt={isEl ? "Λογαριασμός ΑΗΚ δίπλα σε πίνακα συντελεστών εκπομπών" : "An EAC electricity bill next to a table of emission factors"}
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        {/* Statutory Frameworks */}
        <section className="mb-20">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--editorial-display)" }}>
              {t.frameworksTitle}
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-foreground/75">
              {t.frameworksDesc}
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-emerald)]">Accounting Standard</span>
              <h3 className="mt-2 text-lg font-semibold">GHG Protocol Corporate Standard</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                Full Scope 1, Scope 2 (location-based & market-based dual reporting), and relevant Scope 3 categories (upstream transport, waste, business travel, water).
              </p>
            </div>

            <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-emerald)]">EU SME Standard</span>
              <h3 className="mt-2 text-lg font-semibold">EFRAG VSME (Voluntary SME)</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                Alignd with the European Commission Omnibus I ceiling. Pre-configures Basic, Narrative-PAT, and Business Partner disclosure modules for SME supply chains.
              </p>
            </div>

            <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-emerald)]">Import Carbon Border</span>
              <h3 className="mt-2 text-lg font-semibold">EU CBAM (Reg. 2023/956 & 2025/2083)</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                Direct embedded specific emissions calculations for iron, steel, aluminium, cement, and fertilisers, tracking the 50-tonne de-minimis threshold.
              </p>
            </div>
          </div>
        </section>

        {/* Canonical Factor Registry Table */}
        <section className="mb-20">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--editorial-display)" }}>
              {t.factorsTitle}
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-foreground/75">
              {t.factorsDesc}
            </p>
          </div>

          <div className="mt-8 overflow-x-auto rounded-xl border border-foreground/10 bg-background shadow-sm">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-foreground/10 bg-foreground/[0.03] text-xs font-semibold uppercase tracking-wider text-foreground/60">
                <tr>
                  <th className="px-5 py-4">{t.factorsHeaders.category}</th>
                  <th className="px-5 py-4">{t.factorsHeaders.factor}</th>
                  <th className="px-5 py-4">{t.factorsHeaders.scope}</th>
                  <th className="px-5 py-4">{t.factorsHeaders.authority}</th>
                  <th className="px-5 py-4">{t.factorsHeaders.vintage}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {factorsList.map((f) => (
                  <tr key={f.id} className="transition-colors hover:bg-foreground/[0.02]">
                    <td className="px-5 py-4 font-medium text-foreground">
                      <div>{isEl ? f.nameEl : f.nameEn}</div>
                      <div className="text-xs font-mono text-foreground/45">{f.id}</div>
                    </td>
                    <td className="px-5 py-4 font-mono font-medium">
                      <span className="text-foreground">{f.kgCo2ePerUnit}</span>{" "}
                      <span className="text-xs text-foreground/60">kg CO₂e / {f.unit}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-foreground/10 px-2.5 py-0.5 text-xs font-semibold text-foreground/80">
                        Scope {f.scope}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-foreground/75">
                      <a
                        href={f.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-foreground/30 underline-offset-2 hover:text-foreground"
                      >
                        {f.sourceAuthority}
                      </a>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-foreground/60">{f.vintage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Provenance & Cryptographic Verification */}
        <section className="mb-20 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-8 sm:p-12">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--editorial-display)" }}>
              {t.provenanceTitle}
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-foreground/80">
              {t.provenanceText1}
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-foreground/80">
              {t.provenanceText2}{" "}
              <Link href={`/${locale}/verify`} className="font-semibold text-foreground underline underline-offset-4 hover:opacity-80">
                vuneli.com/verify
              </Link>.
            </p>

            <div className="mt-8 rounded-lg border border-foreground/15 bg-background p-5 font-mono text-xs text-foreground/80">
              <div className="text-foreground/50">// Document fingerprint (SHA-256)</div>
              <div className="mt-2 text-[var(--accent-emerald)]">
                SHA256( raw_bill_sha256 + activity_kwh + factor_id + timestamp + tenant_id )
              </div>
              <div className="mt-1 text-foreground/60">
                Result: 64-character tamper-proof hex digest printed in PDF footer and QR code.
              </div>
            </div>
          </div>
        </section>

        {/* Action Plan Empirical Standards */}
        <section className="mb-20">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--editorial-display)" }}>
              {t.verifiedActionsTitle}
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-foreground/75">
              {t.verifiedActionsText}
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-foreground/10 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-lime)]/20 text-foreground font-bold">
                1
              </div>
              <h3 className="mt-4 text-lg font-semibold">{t.verifiedAnchor1Title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                {t.verifiedAnchor1Desc}
              </p>
            </div>

            <div className="rounded-xl border border-foreground/10 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-lime)]/20 text-foreground font-bold">
                2
              </div>
              <h3 className="mt-4 text-lg font-semibold">{t.verifiedAnchor2Title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                {t.verifiedAnchor2Desc}
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="rounded-2xl bg-[oklch(0.19_0.02_150)] p-8 text-white sm:p-12">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold sm:text-3xl" style={{ fontFamily: "var(--editorial-display)" }}>
              {t.ctaTitle}
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-white/80">
              {t.ctaDesc}
            </p>
            <div className="mt-8">
              <a
                href="mailto:hello@vuneli.com?subject=Methodology%20Inquiry"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--accent-lime)] px-8 text-sm font-semibold text-[var(--accent-lime-foreground)] transition hover:opacity-95"
              >
                {t.ctaButton}
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
