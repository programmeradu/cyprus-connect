"use client";

type Mark = {
  name: string;
  file: string;
  /** Per-logo optical size so wordmarks and monograms sit balanced without cards. */
  sizeClass: string;
};

const CYPRUS_MARKS: Mark[] = [
  { name: "Electricity Authority of Cyprus", file: "eac", sizeClass: "h-12 w-20 sm:h-14" },
  { name: "JCC Payment Systems", file: "jcc", sizeClass: "h-9 w-32 sm:h-10 sm:w-36" },
  { name: "SoftOne", file: "softone", sizeClass: "h-12 w-40 sm:h-14 sm:w-44" },
  { name: "gov.cy", file: "govcy", sizeClass: "h-14 w-24 sm:h-16" },
  { name: "Registrar of Companies", file: "companies", sizeClass: "h-9 w-44 sm:h-10 sm:w-52" },
  { name: "CyStat", file: "cystat", sizeClass: "h-10 w-36 sm:h-11 sm:w-40" },
];

const GLOBAL_MARKS: Mark[] = [
  { name: "QuickBooks", file: "quickbooks", sizeClass: "h-10 w-36 sm:h-11 sm:w-40" },
  { name: "Xero", file: "xero", sizeClass: "h-12 w-20 sm:h-14" },
  { name: "Stripe", file: "stripe", sizeClass: "h-11 w-36 sm:h-12 sm:w-40" },
  { name: "Climate TRACE", file: "climatetrace", sizeClass: "h-12 w-20 sm:h-14" },
  { name: "Electricity Maps", file: "electricitymaps", sizeClass: "h-12 w-20 sm:h-14" },
  { name: "WikiRate", file: "wikirate", sizeClass: "h-12 w-40 sm:h-14 sm:w-48" },
];

function Logo({ mark }: { mark: Mark }) {
  const lightSrc = `/integrations/${mark.file}-light.png`;
  const darkSrc = `/integrations/${mark.file}-dark.png`;

  return (
    <div
      className="flex h-16 w-full items-center justify-center sm:h-20"
      title={mark.name}
    >
      <img
        src={lightSrc}
        alt={`${mark.name} logo`}
        loading="lazy"
        className={`block ${mark.sizeClass} object-contain opacity-85 transition duration-300 hover:opacity-100 dark:hidden`}
      />
      <img
        src={darkSrc}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className={`hidden ${mark.sizeClass} object-contain opacity-85 transition duration-300 hover:opacity-100 dark:block`}
      />
    </div>
  );
}

function Row({ marks }: { marks: Mark[] }) {
  return (
    <div className="grid grid-cols-2 items-center justify-items-center gap-x-8 gap-y-9 sm:grid-cols-3 sm:gap-x-12 sm:gap-y-11 lg:grid-cols-6 lg:gap-x-7">
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
        <Row marks={CYPRUS_MARKS} />
        <Row marks={GLOBAL_MARKS} />
      </div>
    </section>
  );
}
