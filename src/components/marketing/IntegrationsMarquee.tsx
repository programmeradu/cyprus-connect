"use client";

/**
 * Real integration logos, served by Logo.dev.
 * No card containers — logos sit directly on the section background.
 * Light and dark variants are served via Logo.dev's `theme` param and
 * swapped with Tailwind `dark:` visibility classes so each mode gets the
 * right colorway (dark logos on light, light logos on dark).
 */

const LOGO_TOKEN = import.meta.env.VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY as
  | string
  | undefined;

function logoUrl(domain: string, theme: "light" | "dark") {
  // `theme=light` returns dark marks (for light backgrounds); `theme=dark`
  // returns light marks (for dark backgrounds). retina=true for crispness.
  const params = new URLSearchParams({
    token: LOGO_TOKEN ?? "",
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

const CYPRUS_MARKS: Mark[] = [
  { name: "EAC", domain: "eac.com.cy", widthClass: "w-24" },
  { name: "JCC", domain: "jcc.com.cy", widthClass: "w-24" },
  { name: "SoftOne", domain: "softone.com.cy", widthClass: "w-28" },
  { name: "gov.cy", domain: "gov.cy", widthClass: "w-24" },
  { name: "Registrar of Companies", domain: "companies.gov.cy", widthClass: "w-32" },
  { name: "TAXISnet", domain: "mof.gov.cy", widthClass: "w-28" },
  { name: "Ariadni", domain: "ariadni.gov.cy", widthClass: "w-28" },
  { name: "CyStat", domain: "cystat.gov.cy", widthClass: "w-28" },
];

const GLOBAL_MARKS: Mark[] = [
  { name: "QuickBooks", domain: "quickbooks.intuit.com", widthClass: "w-28" },
  { name: "Xero", domain: "xero.com", widthClass: "w-20" },
  { name: "Google Gemini", domain: "gemini.google.com", widthClass: "w-24" },
  { name: "Google Cloud", domain: "cloud.google.com", widthClass: "w-28" },
  { name: "Climate TRACE", domain: "climatetrace.org", widthClass: "w-32" },
  { name: "Electricity Maps", domain: "electricitymaps.com", widthClass: "w-32" },
  { name: "OpenEI", domain: "openei.org", widthClass: "w-24" },
  { name: "WikiRate", domain: "wikirate.org", widthClass: "w-28" },
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
    <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 sm:gap-x-14">
      {marks.map((m) => (
        <Logo key={m.name} mark={m} />
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
