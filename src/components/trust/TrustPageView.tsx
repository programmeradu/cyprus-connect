import Link from "next/link";
import { routing, type Locale } from "@/i18n/routing";
import { getTrustContent, type TrustPageKey } from "@/content/trust";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://verdeiq.stauniverse.tech").replace(/\/$/, "");

const NAV_LABELS: Record<Locale, { privacy: string; terms: string; security: string; dpa: string; back: string; updated: string }> = {
  en: { privacy: "Privacy", terms: "Terms", security: "Security", dpa: "DPA", back: "Back to home", updated: "Last updated" },
  el: { privacy: "Απόρρητο", terms: "Όροι", security: "Ασφάλεια", dpa: "DPA", back: "Πίσω στην αρχική", updated: "Τελευταία ενημέρωση" },
};

export function TrustPageView({ locale, page }: { locale: Locale; page: TrustPageKey }) {
  const c = getTrustContent(locale, page);
  const labels = NAV_LABELS[locale];
  const otherPages: TrustPageKey[] = ["privacy", "terms", "security", "dpa"];

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href={`/${locale}`} className="text-sm font-semibold tracking-tight" style={{ fontFamily: "var(--editorial-serif)" }}>
            VerdeIQ
          </Link>
          <Link
            href={`/${locale}`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← {labels.back}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">
            {c.eyebrow}
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">{c.title}</h1>
          <p className="text-sm text-muted-foreground">
            {labels.updated}: {c.lastUpdated}
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 mb-8 text-xs text-muted-foreground leading-relaxed">
          {c.ownerNote}
        </div>

        <p className="text-base leading-relaxed text-foreground/90 mb-10">{c.intro}</p>

        <div className="space-y-8">
          {c.sections.map((s, i) => (
            <section key={i} className="scroll-mt-20">
              <h2 className="text-lg md:text-xl font-semibold tracking-tight mb-3">
                {i + 1}. {s.heading}
              </h2>
              <div className="space-y-3 text-sm md:text-[15px] leading-relaxed text-foreground/85">
                {s.body.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
                {s.list && (
                  <ul className="list-disc pl-5 space-y-1.5 marker:text-muted-foreground/60">
                    {s.list.map((item, k) => (
                      <li key={k}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Cross-links to other trust pages */}
        <nav
          aria-label="Trust pages"
          className="mt-14 pt-8 border-t border-border/60 flex flex-wrap gap-2"
        >
          {otherPages
            .filter((p) => p !== page)
            .map((p) => (
              <Link
                key={p}
                href={`/${locale}/${p}`}
                className="text-xs px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
              >
                {labels[p]}
              </Link>
            ))}
        </nav>
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
  const title = `${c.title} - VerdeIQ`;
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
      siteName: "VerdeIQ",
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
