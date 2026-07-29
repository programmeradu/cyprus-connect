"use client";

/**
 * Integration marks.
 * Use real logo artwork. Do not replace real marks with text treatments.
 */

type ImageMark = {
  kind: "image";
  name: string;
  lightSrc: string;
  darkSrc: string;
  className: string;
};

type Mark = ImageMark;

const CYPRUS_MARKS: Mark[] = [
  {
    kind: "image",
    name: "Electricity Authority of Cyprus",
    lightSrc: "/integrations/eac-light.png",
    darkSrc: "/integrations/eac-dark.png",
    className: "h-[4.4rem] sm:h-[5rem]",
  },
  {
    kind: "image",
    name: "JCC Payment Systems",
    lightSrc: "/integrations/jcc-light.png",
    darkSrc: "/integrations/jcc-dark.png",
    className: "h-[2.6rem] sm:h-[3rem]",
  },
  {
    kind: "image",
    name: "Republic of Cyprus government services",
    lightSrc: "/integrations/govcy-light.png",
    darkSrc: "/integrations/govcy-dark.png",
    className: "h-[4.6rem] sm:h-[5.2rem]",
  },
  {
    kind: "image",
    name: "Registrar of Companies Cyprus",
    lightSrc: "/integrations/companies-light.png",
    darkSrc: "/integrations/companies-dark.png",
    className: "h-[2.3rem] sm:h-[2.7rem]",
  },
  {
    kind: "image",
    name: "CyStat Statistical Service",
    lightSrc: "/integrations/cystat-light.png",
    darkSrc: "/integrations/cystat-dark.png",
    className: "h-[2.4rem] sm:h-[2.8rem]",
  },
];

const GLOBAL_MARKS: Mark[] = [
  {
    kind: "image",
    name: "QuickBooks",
    lightSrc: "/integrations/quickbooks-official-light.svg",
    darkSrc: "/integrations/quickbooks-official-dark.svg",
    className: "h-[2.25rem] sm:h-[2.6rem]",
  },
  {
    kind: "image",
    name: "Xero",
    lightSrc: "/integrations/xero-official-light.svg",
    darkSrc: "/integrations/xero-official-dark.svg",
    className: "h-[2.25rem] sm:h-[2.6rem]",
  },
  {
    kind: "image",
    name: "Climate TRACE",
    lightSrc: "/integrations/climatetrace-light.png",
    darkSrc: "/integrations/climatetrace-dark.png",
    className: "h-[1.55rem] sm:h-[1.8rem]",
  },
  {
    kind: "image",
    name: "Electricity Maps",
    lightSrc: "/integrations/electricitymaps-light.png",
    darkSrc: "/integrations/electricitymaps-dark.png",
    className: "h-[2.4rem] sm:h-[2.85rem]",
  },
  {
    kind: "image",
    name: "OpenEI",
    lightSrc: "/integrations/openei-light.png",
    darkSrc: "/integrations/openei-dark.png",
    className: "h-[1.65rem] sm:h-[1.9rem]",
  },
  {
    kind: "image",
    name: "WikiRate",
    lightSrc: "/integrations/wikirate-light.png",
    darkSrc: "/integrations/wikirate-dark.png",
    className: "h-[1.75rem] sm:h-[2.05rem]",
  },
];

function Logo({ mark }: { mark: Mark }) {
  return (
    <div className="flex h-20 w-full items-center justify-center sm:h-24" title={mark.name}>
      <img
        src={mark.lightSrc}
        alt={`${mark.name} logo`}
        loading="lazy"
        className={`${mark.className} block max-w-[9.5rem] object-contain opacity-85 transition duration-300 hover:opacity-100 dark:hidden sm:max-w-[11rem]`}
      />
      <img
        src={mark.darkSrc}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className={`${mark.className} hidden max-w-[9.5rem] object-contain opacity-90 transition duration-300 hover:opacity-100 dark:block sm:max-w-[11rem]`}
      />
    </div>
  );
}

function Row({ marks, layoutClass }: { marks: Mark[]; layoutClass: string }) {
  return (
    <div className={`grid items-center justify-items-center gap-x-7 gap-y-8 sm:gap-x-10 sm:gap-y-10 lg:gap-x-8 ${layoutClass}`}>
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

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:gap-14 sm:px-6">
        <Row marks={CYPRUS_MARKS} layoutClass="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" />
        <Row marks={GLOBAL_MARKS} layoutClass="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" />
      </div>
    </section>
  );
}
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
