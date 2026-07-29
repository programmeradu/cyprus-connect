import Link from "next/link";
import { routing, type Locale } from "@/i18n/routing";
import { getTrustContent, type TrustPageKey } from "@/content/trust";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://vuneli.com").replace(/\/$/, "");

const NAV_LABELS: Record<
  Locale,
  {
    privacy: string;
    terms: string;
    security: string;
    dpa: string;
    updated: string;
    contents: string;
    related: string;
    contact: string;
    contactBody: string;
    contactAction: string;
  }
> = {
  en: {
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    security: "Security",
    dpa: "Data Processing Addendum",
    updated: "Last updated",
    contents: "Contents",
    related: "Related documents",
    contact: "A question this page does not answer?",
    contactBody:
      "Write to the team in Strovolos. We answer security, privacy and procurement questions within two working days.",
    contactAction: "samuel@stauniverse.tech",
  },
  el: {
    privacy: "Πολιτική Απορρήτου",
    terms: "Όροι Χρήσης",
    security: "Ασφάλεια",
    dpa: "Προσάρτημα Επεξεργασίας Δεδομένων",
    updated: "Τελευταία ενημέρωση",
    contents: "Περιεχόμενα",
    related: "Σχετικά έγγραφα",
    contact: "Ερώτηση που δεν απαντά η σελίδα;",
    contactBody:
      "Γράψτε στην ομάδα στον Στρόβολο. Απαντάμε σε ερωτήσεις ασφάλειας, απορρήτου και προμηθειών σε δύο εργάσιμες ημέρες.",
    contactAction: "samuel@stauniverse.tech",
  },
};

/** Stable, locale-independent anchor ids so deep links survive translation. */
const anchorId = (index: number) => `section-${index + 1}`;

export function TrustPageView({ locale, page }: { locale: Locale; page: TrustPageKey }) {
  const c = getTrustContent(locale, page);
  const labels = NAV_LABELS[locale];
  const otherPages: TrustPageKey[] = (["privacy", "terms", "security", "dpa"] as TrustPageKey[]).filter(
    (p) => p !== page,
  );

  return (
    <div
      className="relative min-h-screen bg-background text-foreground antialiased"
      style={{ fontFamily: "var(--editorial-sans)" }}
    >
      <MarketingHeader />

      {/* ------------------------------------------------------------ Masthead */}
      <section className="relative isolate overflow-hidden bg-[oklch(0.19_0.02_150)] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(180deg, rgba(255,255,255,0.9) 0px, rgba(255,255,255,0.9) 1px, transparent 1px, transparent 34px)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-28 sm:px-8 sm:pb-16 sm:pt-36">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-white/65">{c.eyebrow}</p>
          <h1
            className="mt-4 max-w-3xl text-[2.4rem] font-semibold leading-[1.03] tracking-[-0.025em] sm:text-[3.4rem]"
            style={{ fontFamily: "var(--editorial-display)", textWrap: "balance" }}
          >
            {c.title}
          </h1>
          <p className="mt-6 max-w-2xl text-[16.5px] font-medium leading-[1.62] text-white/80 sm:text-[17.5px]">
            {c.intro}
          </p>

          <dl className="mt-10 grid max-w-3xl grid-cols-1 gap-x-10 gap-y-5 border-t border-white/20 pt-6 sm:grid-cols-3">
            <div>
              <dt className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-white/55">
                {labels.updated}
              </dt>
              <dd className="mt-1.5 text-[16px] font-semibold text-white">{c.lastUpdated}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-white/55">
                {locale === "el" ? "Δικαιοδοσία" : "Jurisdiction"}
              </dt>
              <dd className="mt-1.5 text-[16px] font-semibold text-white">
                {locale === "el" ? "Κύπρος · ΕΕ (GDPR)" : "Cyprus · EU (GDPR)"}
              </dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-white/55">
                {locale === "el" ? "Ενότητες" : "Sections"}
              </dt>
              <dd className="mt-1.5 text-[16px] font-semibold text-white">{c.sections.length}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------------- Body */}
      <main className="mx-auto max-w-6xl px-5 pb-8 pt-12 sm:px-8 sm:pt-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Contents */}
          <nav aria-label={labels.contents} className="lg:col-span-4 xl:col-span-3">
            <div className="lg:sticky lg:top-28">
              <p className="border-b border-border/60 pb-3 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-foreground/60">
                {labels.contents}
              </p>
              <ol className="mt-3">
                {c.sections.map((s, i) => (
                  <li key={i} className="border-b border-border/40 last:border-b-0">
                    <a
                      href={`#${anchorId(i)}`}
                      className="group flex gap-3 py-2.5 text-[14.5px] font-medium leading-[1.45] text-foreground/70 transition-colors hover:text-foreground"
                    >
                      <span className="w-6 shrink-0 tabular-nums text-foreground/45 group-hover:text-foreground/70">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0">{s.heading}</span>
                    </a>
                  </li>
                ))}
              </ol>

              <p className="mt-6 border-t border-border/60 pt-5 text-[13.5px] leading-[1.6] text-foreground/60">
                {c.ownerNote}
              </p>
            </div>
          </nav>

          {/* Sections */}
          <div className="lg:col-span-8 xl:col-span-9">
            {c.sections.map((s, i) => (
              <section
                key={i}
                id={anchorId(i)}
                className="scroll-mt-28 border-t border-border/60 py-9 first:border-t-0 first:pt-0 sm:py-11"
              >
                <div className="grid gap-3 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-6">
                  <p
                    aria-hidden
                    className="text-[15px] font-semibold tabular-nums text-foreground/40 sm:pt-1.5"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <div className="min-w-0">
                    <h2
                      className="text-[1.5rem] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[1.85rem]"
                      style={{ fontFamily: "var(--editorial-display)" }}
                    >
                      {s.heading}
                    </h2>
                    <div className="mt-4 space-y-4 text-[16px] leading-[1.68] text-foreground/80 sm:text-[16.5px]">
                      {s.body.map((p, j) => (
                        <p key={j}>{p}</p>
                      ))}
                    </div>
                    {s.list && (
                      <ul className="mt-5 border-t border-border/50">
                        {s.list.map((item, k) => (
                          <li
                            key={k}
                            className="grid grid-cols-[1.6rem_minmax(0,1fr)] gap-2 border-b border-border/50 py-3 text-[15.5px] leading-[1.6] text-foreground/80"
                          >
                            <span aria-hidden className="tabular-nums font-semibold text-foreground/40">
                              {String(k + 1).padStart(2, "0")}
                            </span>
                            <span className="min-w-0">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            ))}

            {/* Contact block */}
            <section className="mt-4 border border-border/60 px-6 py-8 sm:px-8 sm:py-9">
              <h2
                className="text-[1.35rem] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[1.6rem]"
                style={{ fontFamily: "var(--editorial-display)" }}
              >
                {labels.contact}
              </h2>
              <p className="mt-3 max-w-xl text-[15.5px] leading-[1.62] text-foreground/70">
                {labels.contactBody}
              </p>
              <a
                href={`mailto:${labels.contactAction}`}
                className="mt-5 inline-flex h-11 items-center whitespace-nowrap rounded-full bg-[var(--accent-lime)] px-6 text-[15px] font-semibold tracking-[-0.01em] text-[var(--accent-lime-foreground)] transition-transform hover:scale-[1.02]"
                style={{ fontFamily: "var(--editorial-display)" }}
              >
                {labels.contactAction}
              </a>
            </section>

            {/* Related documents */}
            <nav aria-label={labels.related} className="mt-12">
              <p className="border-b border-border/60 pb-3 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-foreground/60">
                {labels.related}
              </p>
              <ul>
                {otherPages.map((p) => (
                  <li key={p} className="border-b border-border/60">
                    <Link
                      href={`/${locale}/${p}`}
                      className="group flex items-center justify-between gap-6 py-4 transition-colors"
                    >
                      <span
                        className="text-[1.05rem] font-semibold leading-[1.2] tracking-[-0.015em] transition-colors group-hover:text-primary sm:text-[1.15rem]"
                        style={{ fontFamily: "var(--editorial-display)" }}
                      >
                        {labels[p]}
                      </span>
                      <span
                        aria-hidden
                        className="text-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-foreground"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </main>
    </div>

  );
}

export function trustMetadataFor(locale: Locale, page: TrustPageKey) {
  const c = getTrustContent(locale, page);
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l === "el" ? "el-CY" : l] = `${SITE_URL}/${l}/${page}`;
  }
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}/${page}`;
  const title = `${c.title} - Vuneli`;
  return {
    title,
    description: c.intro.slice(0, 155),
    alternates: {
      canonical: `${SITE_URL}/${locale}/${page}`,
      languages,
    },
    openGraph: {
      title,
      description: c.intro.slice(0, 155),
      url: `${SITE_URL}/${locale}/${page}`,
      siteName: "Vuneli",
      locale: locale === "el" ? "el_CY" : "en_US",
      alternateLocale: locale === "el" ? ["en_US"] : ["el_CY"],
      type: "article" as const,
    },
    twitter: {
      card: "summary" as const,
      title,
      description: c.intro.slice(0, 155),
    },
  };
}
