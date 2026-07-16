import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PILLARS } from "@/data/learn/pillars";

const TOP_PILLAR_SLUGS = [
  "csrd-reporting-guide",
  "vsme-reporting-guide",
  "cbam-explained",
  "scope-3-emissions-calculation",
  "carbon-accounting-for-smes",
  "esg-reporting-software",
  "csrd-reporting-cyprus",
  "cbam-cyprus",
] as const;

const HEADINGS: Record<
  string,
  { eyebrow: string; title: string; subtitle: string; viewAll: string }
> = {
  en: {
    eyebrow: "Knowledge Hub",
    title: "Learn sustainability reporting",
    subtitle:
      "In-depth guides on CSRD, VSME, CBAM, and carbon accounting — written for European SMEs, updated as the regulations evolve.",
    viewAll: "Browse all guides →",
  },
  el: {
    eyebrow: "Κόμβος Γνώσης",
    title: "Μάθετε αναφορά βιωσιμότητας",
    subtitle:
      "Αναλυτικοί οδηγοί για CSRD, VSME, CBAM και ανθρακική λογιστική — γραμμένοι για ευρωπαϊκές ΜμΕ, ενημερώνονται με τους κανονισμούς.",
    viewAll: "Δείτε όλους τους οδηγούς →",
  },
};

export function LearnLinksSection({ locale }: { locale: "en" | "el" }) {
  const { i18n } = useTranslation();
  const active = (locale ?? (i18n.language === "el" ? "el" : "en")) as "en" | "el";
  const copy = HEADINGS[active] ?? HEADINGS.en;

  const pillars = TOP_PILLAR_SLUGS.map((slug) => {
    const p = PILLARS[slug];
    if (!p) return null;
    const content = p[active];
    return {
      slug: p.slug,
      title: content.title,
      eyebrow: content.heroEyebrow,
      minutes: p.readingMinutes,
      heroImage: p.heroImage,
    };
  }).filter((x): x is NonNullable<typeof x> => Boolean(x));

  const minutesLabel = active === "el" ? "λεπτά ανάγνωσης" : "min read";
  // The learn pages live on the production Next.js site.
  const base = "https://verdeiq.stauniverse.tech";

  return (
    <section className="relative py-16 px-4 border-t border-border/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="eyebrow">{copy.eyebrow}</span>
          <h2 className="text-2xl md:text-3xl font-bold mt-3 mb-3 tracking-tight">
            {copy.title}
          </h2>
          <p className="text-sm text-foreground/70 dark:text-muted-foreground font-light max-w-2xl mx-auto">
            {copy.subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars.map((p) => (
            <a
              key={p.slug}
              href={`${base}/${active}/learn/${p.slug}`}
              className="group block h-full overflow-hidden rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm hover:border-primary/40 hover:bg-card/70 transition-all"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                <img
                  src={p.heroImage}
                  alt={p.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
              </div>
              <div className="p-4">
                <div className="eyebrow text-primary mb-2">{p.eyebrow}</div>
                <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                  {p.title}
                </h3>
                <div className="mt-3 text-[11px] text-muted-foreground font-light">
                  {p.minutes} {minutesLabel}
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href={`${base}/${active}/learn`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {copy.viewAll}
          </a>
        </div>
      </div>
    </section>
  );
}
