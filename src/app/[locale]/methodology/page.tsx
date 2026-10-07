import Link from "next/link";
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
    : "Calculation Methodology & Emission Factors | Vuneli";
  const description = isEl
    ? "Επίσημη μεθοδολογία υπολογισμού εκπομπών GHG, πηγές συντελεστών (ΑΗΚ, ΤΑΥ, DEFRA, EEA) και αρχές επαλήθευσης αποτυπώματος για κυπριακές ΜμΕ."
    : "Authoritative carbon accounting methodology, statutory emission factors (EAC, WDD, DEFRA, EEA), and verification standards for Cyprus SMEs.";
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
      images: [{ url: `${SITE_URL}/opengraph-image.png`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const T = {
  en: {
    eyebrow: "Scientific & Statutory Governance",
    title: "Emission Accounting Methodology",
    subtitle:
      "Every number issued by Vuneli is mathematically deterministic, traceable to its source bill or meter, and governed by authoritative statutory standards.",
    lastUpdated: "October 2026",
    frameworksTitle: "Statutory Standards & Frameworks",
    frameworksDesc:
      "Vuneli implements international greenhouse gas accounting frameworks tailored to the legal and electrical realities of the Republic of Cyprus.",
    factorsTitle: "Canonical Emission Factor Registry",
    factorsDesc:
      "All platform features—including automated bill intake, reports, the Verde copilot, and public calculators—read from an immutable, single-source registry.",
    factorsHeaders: {
      category: "Category / Activity",
      factor: "Conversion Factor",
      scope: "GHG Scope",
      authority: "Statutory Authority",
      vintage: "Vintage",
    },
    provenanceTitle: "Audit Provenance & Merkle Fingerprinting",
    provenanceText1:
      "Figures in Vuneli are never naked estimates. When an EAC electricity bill or Petrolina fuel invoice is ingested, the system extracts the physical activity data (kWh or Litres) and creates a deterministic cryptographic audit trail.",
    provenanceText2:
      "Every issued document receives a 64-character SHA-256 Merkle root hash. This hash covers the precise inputs, factor IDs, calculation methodology, and timestamp. Anyone holding a printed or digital copy can verify its integrity instantly at",
    verifiedActionsTitle: "Action Plan Verification Standards",
    verifiedActionsText:
      "Unlike generic task trackers, decarbonisation actions in Vuneli (such as rooftop solar PV or HVAC retrofits) cannot be manually ticked 'complete'. A project reaches 'Confirmed' status only when verified against two immutable anchors:",
    verifiedAnchor1Title: "Proof of Execution",
    verifiedAnchor1Desc: "A valid supplier invoice PDF showing the exact VAT number, billing date, and installed capacity, or an reconciled open-banking debit payment.",
    verifiedAnchor2Title: "Empirical Bill Drop",
    verifiedAnchor2Desc: "Subsequent utility bills demonstrate an empirical drop in consumption exceeding the project's engineering threshold against the prior-year seasonal baseline.",
    ctaTitle: "Independent Assurance & Inquiries",
    ctaDesc: "Auditors, banking credit officers, and corporate sustainability teams with questions regarding our factor registry or calculation models can reach our verification desk.",
    ctaButton: "Contact Verification Desk",
  },
  el: {
    eyebrow: "Επιστημονική & Κανονιστική Διακυβέρνηση",
    title: "Μεθοδολογία Υπολογισμού Εκπομπών",
    subtitle:
      "Κάθε αριθμός που εκδίδει η Vuneli είναι μαθηματικά ντετερμινιστικός, πλήρως ανιχνεύσιμος στον πρωτότυπο λογαριασμό ή μετρητή, και βασίζεται σε επίσημα κανονιστικά πρότυπα.",
    lastUpdated: "Οκτώβριος 2026",
    frameworksTitle: "Κανονιστικά Πρότυπα & Πλαίσια",
    frameworksDesc:
      "Η Vuneli εφαρμόζει διεθνή πρότυπα υπολογισμού αερίων θερμοκηπίου, προσαρμοσμένα στις νομικές και ηλεκτρικές ιδιαιτερότητες της Κυπριακής Δημοκρατίας.",
    factorsTitle: "Κανονιστικό Μητρώο Συντελεστών Εκπομπών",
    factorsDesc:
      "Όλες οι λειτουργίες της πλατφόρμας—η αυτόματη ανάγνωση λογαριασμών, οι εκθέσεις, ο βοηθός Verde και οι δημόσιοι υπολογιστές—αντλούν δεδομένα από ένα ενιαίο, αμετάβλητο μητρώο.",
    factorsHeaders: {
      category: "Κατηγορία / Δραστηριότητα",
      factor: "Συντελεστής Μετατροπής",
      scope: "Πεδίο GHG",
      authority: "Επίσημη Αρχή",
      vintage: "Έκδοση",
    },
    provenanceTitle: "Ιχνηλασιμότητα Ελέγχου & Ψηφιακό Αποτύπωμα Merkle",
    provenanceText1:
      "Τα στοιχεία στη Vuneli δεν αποτελούν ποτέ γενικές εκτιμήσεις. Κατά την εισαγωγή ενός λογαριασμού ΑΗΚ ή τιμολογίου καυσίμων, το σύστημα εξάγει τα φυσικά δεδομένα κατανάλωσης (kWh ή Λίτρα) και δημιουργεί ένα αδιάσειστο κρυπτογραφικό μονοπάτι ελέγχου.",
    provenanceText2:
      "Κάθε εκδιδόμενο έγγραφο λαμβάνει έναν μοναδικό κατακερματισμό SHA-256 64 χαρακτήρων (Merkle root). Ο κωδικός αυτός καλύπτει τα ακριβή δεδομένα εισόδου, τους συντελεστές και τη μεθοδολογία. Οποιοσδήποτε κρατά ένα έντυπο ή ψηφιακό αντίγραφο μπορεί να ελέγξει άμεσα τη γνησιότητά του στο",
    verifiedActionsTitle: "Πρότυπα Επαλήθευσης Πλάνου Δράσης",
    verifiedActionsText:
      "Σε αντίθεση με απλές λίστες εργασιών, τα έργα απαλλαγής από τον άνθρακα στη Vuneli (όπως φωτοβολταϊκά ή αντικατάσταση κλιματισμού) δεν μπορούν να σημειωθούν χειροκίνητα ως 'ολοκληρωμένα'. Ένα έργο επιβεβαιώνεται ('Confirmed') μόνο μέσω δύο αποδείξεων:",
    verifiedAnchor1Title: "Απόδειξη Εκτέλεσης",
    verifiedAnchor1Desc: "Έγκυρο τιμολόγιο προμηθευτή σε PDF με ΑΦΜ, ημερομηνία και εγκατεστημένη ισχύ, ή ταυτοποιημένη πληρωμή μέσω τραπεζικού λογαριασμού.",
    verifiedAnchor2Title: "Εμπειρική Μείωση Κατανάλωσης",
    verifiedAnchor2Desc: "Μεταγενέστεροι λογαριασμοί κοινής ωφέλειας αποδεικνύουν πραγματική πτώση στην κατανάλωση που υπερβαίνει το τεχνικό όριο του έργου σε σχέση με την εποχική βάση του προηγούμενου έτους.",
    ctaTitle: "Ανεξάρτητος Έλεγχος & Ερωτήσεις",
    ctaDesc: "Ορκωτοί ελεγκτές, τραπεζικοί αναλυτές πιστωτικού κινδύνου και ομάδες βιωσιμότητας με απορίες σχετικά με τους συντελεστές ή τα υπολογιστικά μοντέλα μπορούν να επικοινωνήσουν απευθείας μαζί μας.",
    ctaButton: "Επικοινωνία με το Τμήμα Επαλήθευσης",
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
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-40">
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
              <dd className="mt-1.5 text-[15.5px] font-semibold text-white">Republic of Cyprus (EU)</dd>
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
              <div className="text-foreground/50">// Merkle Document Root Digest Structure</div>
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
