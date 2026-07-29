"use client";

/**
 * Integrations row.
 *
 * Two source types, no fabricated logos:
 *  - `simpleicons` marks pull the official SVG glyph from cdn.simpleicons.org
 *    (colored per mode via the URL path).
 *  - `wordmark` marks render the brand name in the editorial serif — used for
 *    orgs whose visual identity is primarily typographic (Cyprus utilities,
 *    open-data climate projects) and where scraping their site logo would
 *    look worse than a clean wordmark.
 */

type SimpleIconMark = {
  kind: "simpleicon";
  name: string;
  slug: string;
  sizeClass: string;
};

type WordmarkMark = {
  kind: "wordmark";
  name: string;
  /** Optional smaller subtitle rendered under the wordmark. */
  sub?: string;
  sizeClass: string;
};

type Mark = SimpleIconMark | WordmarkMark;

const CYPRUS_MARKS: Mark[] = [
  { kind: "wordmark", name: "EAC", sub: "Electricity Authority", sizeClass: "text-[22px] sm:text-[26px]" },
  { kind: "wordmark", name: "JCC", sub: "Payment Systems", sizeClass: "text-[22px] sm:text-[26px]" },
  { kind: "wordmark", name: "gov.cy", sizeClass: "text-[24px] sm:text-[28px]" },
  { kind: "wordmark", name: "Companies.cy", sizeClass: "text-[22px] sm:text-[26px]" },
  { kind: "wordmark", name: "CyStat", sizeClass: "text-[22px] sm:text-[26px]" },
];

const GLOBAL_MARKS: Mark[] = [
  { kind: "simpleicon", name: "QuickBooks", slug: "quickbooks", sizeClass: "h-9 w-9 sm:h-10 sm:w-10" },
  { kind: "simpleicon", name: "Xero", slug: "xero", sizeClass: "h-9 w-9 sm:h-10 sm:w-10" },
  { kind: "wordmark", name: "ClimateTRACE", sizeClass: "text-[22px] sm:text-[26px]" },
  { kind: "wordmark", name: "ElectricityMaps", sizeClass: "text-[22px] sm:text-[26px]" },
  { kind: "wordmark", name: "OpenEI", sizeClass: "text-[22px] sm:text-[26px]" },
  { kind: "wordmark", name: "WikiRate", sizeClass: "text-[22px] sm:text-[26px]" },
];

function Logo({ mark }: { mark: Mark }) {
  if (mark.kind === "simpleicon") {
    // Simple Icons serves the official brand glyph. Two <img> tags let us
    // recolor per mode without a client-side theme hook.
    return (
      <div className="flex h-16 w-full items-center justify-center sm:h-20" title={mark.name}>
        <img
          src={`https://cdn.simpleicons.org/${mark.slug}/1a1a1a`}
          alt={`${mark.name} logo`}
          loading="lazy"
          className={`block ${mark.sizeClass} object-contain opacity-80 transition duration-300 hover:opacity-100 dark:hidden`}
        />
        <img
          src={`https://cdn.simpleicons.org/${mark.slug}/ffffff`}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className={`hidden ${mark.sizeClass} object-contain opacity-80 transition duration-300 hover:opacity-100 dark:block`}
        />
      </div>
    );
  }

  return (
    <div className="flex h-16 w-full flex-col items-center justify-center gap-0.5 sm:h-20" title={mark.name}>
      <span
        className={`font-[family-name:var(--editorial-serif)] ${mark.sizeClass} leading-none tracking-[-0.01em] text-foreground/80 transition duration-300 hover:text-foreground`}
      >
        {mark.name}
      </span>
      {mark.sub ? (
        <span className="text-[10px] uppercase tracking-[0.14em] text-foreground/45">
          {mark.sub}
        </span>
      ) : null}
    </div>
  );
}

function Row({ marks, layoutClass }: { marks: Mark[]; layoutClass: string }) {
  return (
    <div className={`grid items-center justify-items-center gap-x-8 gap-y-9 sm:gap-x-12 sm:gap-y-11 lg:gap-x-7 ${layoutClass}`}>
      {marks.map((m) => (
        <div key={m.name} className="flex min-w-0 items-center justify-center">
          <Logo mark={m} />
        </div>
      ))}
    </div>
  );
}

export function IntegrationsMarquee() {
  return (
    <section
      aria-labelledby="integrations-heading"
      className="relative py-20 sm:py-28"
    >
      <div className="mx-auto mb-14 max-w-6xl px-4 sm:mb-20 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2
            id="integrations-heading"
            className="max-w-2xl font-[family-name:var(--editorial-serif)] text-[2rem] leading-[1.05] tracking-[-0.02em] sm:text-[2.75rem]"
          >
            Connected to the systems Cyprus SMEs already run on.
          </h2>
          <p className="max-w-sm text-[14px] leading-[1.5] text-foreground/60">
            National utilities, tax portals and accounting stacks, synced without CSV exports.
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:gap-16 sm:px-6">
        <Row marks={CYPRUS_MARKS} layoutClass="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" />
        <Row marks={GLOBAL_MARKS} layoutClass="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" />
      </div>
    </section>
  );
}
