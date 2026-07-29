"use client";

/**
 * Continuous horizontal marquee of real integration logos.
 * Combines international brands (Simple Icons monochrome SVGs) with Cyprus
 * entities (official favicons via Google's public favicon service). Every
 * entry uses a real logo image — no typographic placeholders.
 */
type Mark = {
  name: string;
  /** Simple Icons slug for monochrome vector logos. */
  simpleIcon?: string;
  /** Domain for entities without a Simple Icons entry — real favicon is fetched. */
  domain?: string;
};

const MARKS: Mark[] = [
  // Cyprus institutions & partners
  { name: "EAC",       domain: "eac.com.cy" },
  { name: "JCC",       domain: "jcc.com.cy" },
  { name: "SoftOne",   domain: "softone.com.cy" },
  { name: "CY Login",  domain: "cge.cyprus.gov.cy" },
  { name: "Registrar", domain: "companies.gov.cy" },
  { name: "TAXISnet",  domain: "taxisnet.mof.gov.cy" },
  { name: "CyStat",    domain: "cystat.gov.cy" },
  // International integrations
  { name: "QuickBooks",     simpleIcon: "quickbooks" },
  { name: "Xero",           simpleIcon: "xero" },
  { name: "Gemini",         simpleIcon: "googlegemini" },
  { name: "Google Cloud",   simpleIcon: "googlecloud" },
  { name: "ClimateTRACE",   domain: "climatetrace.org" },
  { name: "Electricity Maps", domain: "electricitymaps.com" },
  { name: "OpenEI",         domain: "openei.org" },
  { name: "WikiRate",       domain: "wikirate.org" },
];

function LogoImage({ mark, dark }: { mark: Mark; dark?: boolean }) {
  if (mark.simpleIcon) {
    const color = dark ? "ffffff" : "000000";
    return (
      <img
        src={`https://cdn.simpleicons.org/${mark.simpleIcon}/${color}`}
        alt={`${mark.name} logo`}
        loading="lazy"
        className="h-7 w-auto object-contain opacity-80"
      />
    );
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${mark.domain}&sz=128`}
      alt={`${mark.name} logo`}
      loading="lazy"
      className="h-7 w-7 rounded object-contain"
    />
  );
}

function Entry({ mark, dark }: { mark: Mark; dark?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-3 px-8 sm:px-10">
      <LogoImage mark={mark} dark={dark} />
      <span className="whitespace-nowrap text-[17px] font-medium tracking-[-0.01em] text-foreground/80 sm:text-[18px]">
        {mark.name}
      </span>
    </div>
  );
}

export function IntegrationsMarquee() {
  const track = [...MARKS, ...MARKS];

  return (
    <section
      aria-labelledby="integrations-heading"
      className="relative border-y border-border/60 bg-background/40 py-14 sm:py-20"
    >
      <div className="mx-auto mb-10 max-w-6xl px-4 sm:mb-14 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span
              className="text-[11px] font-medium uppercase tracking-[0.24em] text-foreground/50"
              style={{ fontFamily: "var(--font-mono, ui-monospace)" }}
            >
              [ CYPRUS &amp; GLOBAL INTEGRATIONS ]
            </span>
            <h2
              id="integrations-heading"
              className="mt-4 max-w-2xl font-[family-name:var(--editorial-serif)] text-[2rem] leading-[1.05] tracking-[-0.02em] sm:text-[2.75rem]"
            >
              Connected to the systems Cyprus SMEs already run on.
            </h2>
          </div>
          <p className="max-w-sm text-[14px] leading-[1.5] text-foreground/60">
            National utilities, tax portals and accounting stacks — synced without CSV exports.
          </p>
        </div>
      </div>

      {/* Marquee track — light mode */}
      <div
        className="group relative overflow-hidden dark:hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)",
        }}
      >
        <div className="viq-marquee-track flex w-max items-center py-4">
          {track.map((m, i) => (
            <div key={`${m.name}-${i}`} className="flex items-center">
              <Entry mark={m} dark={false} />
              <span aria-hidden className="h-6 w-px shrink-0 bg-border/60" />
            </div>
          ))}
        </div>
      </div>

      {/* Marquee track — dark mode (white-tinted Simple Icons) */}
      <div
        className="group relative hidden overflow-hidden dark:block"
        style={{
          maskImage: "linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)",
        }}
      >
        <div className="viq-marquee-track flex w-max items-center py-4">
          {track.map((m, i) => (
            <div key={`${m.name}-${i}-d`} className="flex items-center">
              <Entry mark={m} dark />
              <span aria-hidden className="h-6 w-px shrink-0 bg-border/60" />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes viq-marquee {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        .viq-marquee-track {
          animation: viq-marquee 55s linear infinite;
          will-change: transform;
        }
        .group:hover .viq-marquee-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .viq-marquee-track { animation: none; }
        }
      `}</style>
    </section>
  );
}
