import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { loadVsmePassport } from "@/lib/reports/passport.server";
import { db } from "@/db";
import { vsmePassports } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { OFFICIAL_CYPRUS_GRID_FACTOR } from "@/lib/factors/registry";

export const dynamic = "force-dynamic";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://vuneli.com").replace(/\/$/, "");

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const isEl = locale === "el";

  const [passportRow] = await db
    .select({ workspaceId: vsmePassports.workspaceId, isPublic: vsmePassports.isPublic })
    .from(vsmePassports)
    .where(or(eq(vsmePassports.slug, slug), eq(vsmePassports.shareToken, slug)))
    .limit(1);

  if (!passportRow || !passportRow.isPublic) {
    return { title: isEl ? "Διαβατήριο Μη Διαθέσιμο | Vuneli" : "Passport Not Available | Vuneli" };
  }

  const data = await loadVsmePassport(passportRow.workspaceId, false);
  const companyName = data?.company.legalName || data?.company.name || "Cyprus SME";

  const title = isEl
    ? `${companyName} — Επαληθευμένο Ψηφιακό Διαβατήριο VSME | Vuneli`
    : `${companyName} — Verified VSME Sustainability Passport | Vuneli`;
  const description = isEl
    ? `Επίσημη αναφορά βιωσιμότητας κατά το πρότυπο EFRAG VSME για την ${companyName}, με στοιχεία από τους λογαριασμούς της επιχείρησης.`
    : `Official EFRAG VSME voluntary sustainability profile for ${companyName}. Figures come from the company’s own bills.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/passport/${slug}`,
      siteName: "Vuneli",
      type: "website",
    },
  };
}

export default async function PublicPassportPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  const isEl = locale === "el";

  const [passportRow] = await db
    .select({ workspaceId: vsmePassports.workspaceId, isPublic: vsmePassports.isPublic })
    .from(vsmePassports)
    .where(or(eq(vsmePassports.slug, slug), eq(vsmePassports.shareToken, slug)))
    .limit(1);

  if (!passportRow || !passportRow.isPublic) {
    notFound();
  }

  const data = await loadVsmePassport(passportRow.workspaceId, true);
  if (!data) notFound();

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
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[var(--accent-lime)]/20 px-3 py-1 text-xs font-semibold text-[var(--accent-lime)]">
              {isEl ? "Επίσημο Ψηφιακό Διαβατήριο VSME" : "Official EFRAG VSME Digital Passport"}
            </span>
            <span className="text-xs text-white/50">· {data.company.baselineYear}</span>
          </div>

          <h1
            className="mt-4 max-w-3xl text-[2.4rem] font-semibold leading-[1.03] tracking-[-0.025em] sm:text-[3.6rem]"
            style={{ fontFamily: "var(--editorial-display)", textWrap: "balance" }}
          >
            {data.company.legalName || data.company.name}
          </h1>

          <p className="mt-4 max-w-2xl text-[16.5px] font-medium leading-[1.62] text-white/80 sm:text-[18px]">
            {data.passport.headline || (isEl ? "Στοιχεία βιωσιμότητας κατά το πρότυπο EFRAG VSME, από τους λογαριασμούς της επιχείρησης." : "Sustainability figures under the EFRAG VSME standard, taken from the company’s bills.")}
          </p>

          <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-5 border-t border-white/20 pt-6 sm:grid-cols-4">
            <div>
              <dt className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white/55">
                {isEl ? "Δικαιοδοσία" : "Jurisdiction"}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-white">{data.company.country === "CY" ? (isEl ? "Κύπρος (ΕΕ)" : "Cyprus (EU)") : data.company.country}</dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white/55">
                {isEl ? "Κλάδος" : "Sector"}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-white">{data.company.sector}</dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white/55">
                {isEl ? "Προσωπικό" : "Headcount"}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-white">{data.company.employees} {isEl ? "άτομα" : "staff"}</dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white/55">
                {isEl ? "Πληρότητα VSME" : "Completeness"}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[var(--accent-lime)]">{data.metrics.overallCompletenessPct}%</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-20">
        {/* Core Environmental Highlights */}
        <section className="mb-14">
          <div className="grid gap-5 sm:grid-cols-4">
            <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-5">
              <span className="text-xs uppercase tracking-wider text-foreground/50">{isEl ? "Ηλεκτρισμός (Scope 2)" : "Electricity (Scope 2)"}</span>
              <div className="mt-2 text-2xl font-bold font-mono">{data.metrics.totalEnergyMwh} MWh</div>
              <div className="mt-1 text-xs text-foreground/60">{data.metrics.scope2Tonnes} t CO₂e (EAC 0.622)</div>
            </div>

            <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-5">
              <span className="text-xs uppercase tracking-wider text-foreground/50">{isEl ? "Καύσιμα (Scope 1)" : "Fuels (Scope 1)"}</span>
              <div className="mt-2 text-2xl font-bold font-mono">{data.metrics.scope1Tonnes} t</div>
              <div className="mt-1 text-xs text-foreground/60">{isEl ? "Άμεσες εκπομπές CO₂e" : "Direct combustion CO₂e"}</div>
            </div>

            <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-5">
              <span className="text-xs uppercase tracking-wider text-foreground/50">{isEl ? "Απορρόφηση Νερού" : "Mains Water"}</span>
              <div className="mt-2 text-2xl font-bold font-mono">{data.metrics.waterM3} m³</div>
              <div className="mt-1 text-xs text-foreground/60">{isEl ? "Δημόσια ύδρευση" : "Municipal consumption"}</div>
            </div>

            <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-5">
              <span className="text-xs uppercase tracking-wider text-foreground/50">{isEl ? "Στερεά Απόβλητα" : "Commercial Waste"}</span>
              <div className="mt-2 text-2xl font-bold font-mono">{data.metrics.wasteTonnes} t</div>
              <div className="mt-1 text-xs text-foreground/60">{isEl ? "Εμπορικά απόβλητα" : "Solid waste generated"}</div>
            </div>
          </div>
        </section>

        {/* EFRAG Disclosures */}
        <section className="mb-14 space-y-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--editorial-display)" }}>
              {isEl ? "Αποκαλύψεις Βασικής Ενότητας EFRAG VSME" : "EFRAG VSME Basic Module Disclosures"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/75">
              {isEl
                ? "Κάθε δήλωση καλύπτει τα επίσημα κριτήρια του προτύπου VSME (B1–B12) και συνδέεται με φυσικά παραστατικά."
                : "Every disclosure maps directly to the official EFRAG VSME criteria (disclosures B1–B12) and is anchored by verified records."}
            </p>
          </div>

          <div className="space-y-6">
            {data.disclosures.map((block) => (
              <div key={block.code} className="rounded-xl border border-foreground/10 bg-background overflow-hidden shadow-sm">
                <div className="border-b border-foreground/10 bg-foreground/[0.02] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold">
                      {block.code}: {isEl ? block.titleEl : block.titleEn}
                    </h3>
                    <p className="text-xs text-foreground/60 mt-0.5">{isEl ? block.summaryEl : block.summaryEn}</p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--accent-emerald)]">
                    {block.completenessPct}% {isEl ? "πλήρες" : "complete"}
                  </span>
                </div>

                <div className="divide-y divide-foreground/5 p-2">
                  {block.items.map((item) => (
                    <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-mono text-foreground/45">{item.code}</div>
                        <div className="text-sm font-medium">{isEl ? item.labelEl : item.labelEn}</div>
                        <div className="text-xs text-foreground/60">{item.source}</div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="font-semibold text-sm">
                          {item.value !== null && item.value !== undefined ? (
                            <span>
                              {item.value} {item.unit}
                            </span>
                          ) : (
                            <span className="text-foreground/40 italic">{isEl ? "Δεν καταχωρήθηκε" : "Not recorded"}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--accent-emerald)]">
                          {item.isVerified ? (isEl ? "Από παραστατικά" : "From records") : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Audit Provenance & Merkle Root */}
        <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-8 sm:p-12">
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl" style={{ fontFamily: "var(--editorial-display)" }}>
              {isEl ? "Αποτύπωμα έκδοσης" : "Version fingerprint"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground/75">
              {isEl
                ? "Αυτή η έκδοση έχει αποτύπωμα SHA-256. Αν αλλάξει κάποιος αριθμός, αλλάζει και το αποτύπωμα. Ένα PDF του διαβατηρίου ελέγχεται στο "
                : "This version has a SHA-256 fingerprint. If any figure changes, so does the fingerprint. A PDF of this passport can be checked at "}
              <Link href={`/${locale}/verify`} className="font-semibold underline underline-offset-4">
                vuneli.com/verify
              </Link>.
            </p>

            <div className="mt-6 rounded-lg border border-foreground/15 bg-background p-4 font-mono text-xs text-foreground/80 break-all">
              <span className="text-foreground/50">SHA-256: </span>
              <span className="text-[var(--accent-emerald)] font-bold">{data.merkleRootHash}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
