"use client";

type Mark = {
  name: string;
  file: string;
  /** Per-logo width so wordmarks and monograms sit balanced without cards. */
  widthClass?: string;
};

const CYPRUS_MARKS: Mark[] = [
  { name: "Electricity Authority of Cyprus", file: "eac", widthClass: "w-20" },
  { name: "JCC Payment Systems", file: "jcc", widthClass: "w-32" },
  { name: "SoftOne", file: "softone", widthClass: "w-36" },
  { name: "gov.cy", file: "govcy", widthClass: "w-24" },
  { name: "Registrar of Companies", file: "companies", widthClass: "w-44" },
  { name: "CyStat", file: "cystat", widthClass: "w-36" },
];

const GLOBAL_MARKS: Mark[] = [
  { name: "QuickBooks", file: "quickbooks", widthClass: "w-36" },
  { name: "Xero", file: "xero", widthClass: "w-20" },
  { name: "Stripe", file: "stripe", widthClass: "w-32" },
  { name: "Climate TRACE", file: "climatetrace", widthClass: "w-20" },
  { name: "Electricity Maps", file: "electricitymaps", widthClass: "w-20" },
  { name: "WikiRate", file: "wikirate", widthClass: "w-36" },
];

function Logo({ mark }: { mark: Mark }) {
  const width = mark.widthClass ?? "w-28";
  const lightSrc = `/integrations/${mark.file}-light.png`;
  const darkSrc = `/integrations/${mark.file}-dark.png`;

  return (
    <div
      className="flex h-14 items-center justify-center sm:h-16"
      title={mark.name}
    >
      <img
        src={lightSrc}
        alt={`${mark.name} logo`}
        loading="lazy"
        className={`block h-full ${width} object-contain opacity-75 transition duration-300 hover:opacity-100 dark:hidden`}
      />
      <img
        src={darkSrc}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className={`hidden h-full ${width} object-contain opacity-70 transition duration-300 hover:opacity-100 dark:block`}
      />
    </div>
  );
}

function Row({ marks }: { marks: Mark[] }) {
  return (
    <div className="grid grid-cols-2 items-center gap-x-7 gap-y-10 sm:grid-cols-3 sm:gap-x-12 lg:grid-cols-6 lg:gap-x-8">
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
