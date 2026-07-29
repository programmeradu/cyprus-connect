"use client";

/**
 * Real integration logos, served by Logo.dev.
 * No card containers — logos sit directly on the section background.
 * Light and dark variants are served via Logo.dev's `theme` param and
 * swapped with Tailwind `dark:` visibility classes so each mode gets the
 * right colorway (dark logos on light, light logos on dark).
 */

const LOGO_TOKEN =
  (process.env.NEXT_PUBLIC_LOGO_DEV_KEY as string | undefined) ?? "";

function logoUrl(domain: string, theme: "light" | "dark") {
  // `theme=light` returns dark marks (for light backgrounds); `theme=dark`
  // returns light marks (for dark backgrounds). retina=true for crispness.
  const params = new URLSearchParams({
    token: LOGO_TOKEN,
    theme,
    retina: "true",
    format: "png",
  });
  return `https://img.logo.dev/${domain}?${params.toString()}`;
}

type Mark = {
  name: string;
  domain: string;
  /** Optional width class per logo so wordmarks and monograms sit balanced. */
  widthClass?: string;
};

// Six Cyprus marks, six global marks — even rows, no duplicates,
// each domain hand-verified against Logo.dev so nothing falls back
// to a generic favicon.
const CYPRUS_MARKS: Mark[] = [
  { name: "EAC", domain: "eac.com.cy", widthClass: "w-24" },
  { name: "JCC", domain: "jcc.com.cy", widthClass: "w-24" },
  { name: "SoftOne", domain: "softone.com.cy", widthClass: "w-28" },
  { name: "gov.cy", domain: "cyprus.gov.cy", widthClass: "w-24" },
  { name: "Registrar of Companies", domain: "companies.gov.cy", widthClass: "w-28" },
  { name: "CyStat", domain: "cystat.gov.cy", widthClass: "w-24" },
];

const GLOBAL_MARKS: Mark[] = [
  { name: "QuickBooks", domain: "quickbooks.intuit.com", widthClass: "w-28" },
  { name: "Xero", domain: "xero.com", widthClass: "w-20" },
  { name: "Stripe", domain: "stripe.com", widthClass: "w-20" },
  { name: "Climate TRACE", domain: "climatetrace.org", widthClass: "w-32" },
  { name: "Electricity Maps", domain: "electricitymaps.com", widthClass: "w-32" },
  { name: "WikiRate", domain: "wikirate.org", widthClass: "w-24" },
];

function Logo({ mark }: { mark: Mark }) {
  const width = mark.widthClass ?? "w-24";
  return (
    <div
      className="flex h-10 items-center justify-center"
      title={mark.name}
    >
      {/* Light mode: dark logos */}
      <img
        src={logoUrl(mark.domain, "light")}
        alt={`${mark.name} logo`}
        loading="lazy"
        className={`block h-full ${width} object-contain opacity-70 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 dark:hidden`}
      />
      {/* Dark mode: light logos */}
      <img
        src={logoUrl(mark.domain, "dark")}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className={`hidden h-full ${width} object-contain opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 dark:block`}
      />
    </div>
  );
}

function Row({ marks }: { marks: Mark[] }) {
  return (
    <div className="grid grid-cols-2 items-center gap-x-8 gap-y-10 sm:grid-cols-3 sm:gap-x-12 lg:grid-cols-6 lg:gap-x-10">
      {marks.map((m) => (
        <div key={m.name} className="flex items-center justify-center">
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
        <Row marks={CYPRUS_MARKS} />
        <Row marks={GLOBAL_MARKS} />
      </div>
    </section>
  );
}
