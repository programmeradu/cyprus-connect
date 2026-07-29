"use client";

import ariadniLogo from "@/assets/integrations/ariadni-logo.png.asset.json";
import climateTraceLogo from "@/assets/integrations/climatetrace-logo.png.asset.json";
import cyLoginCoat from "@/assets/integrations/cylogin-coat.png.asset.json";
import cystatLogo from "@/assets/integrations/cystat-logo.png.asset.json";
import eacLogo from "@/assets/integrations/eac-logo.png.asset.json";
import electricityMapsLogo from "@/assets/integrations/electricitymaps-logo.svg.asset.json";
import jccLogo from "@/assets/integrations/jcc-logo.svg.asset.json";
import openeiLogo from "@/assets/integrations/openei-logo.svg.asset.json";
import registrarLogo from "@/assets/integrations/registrar-logo.svg.asset.json";
import softoneLogo from "@/assets/integrations/softone-logo.png.asset.json";
import taxisnetLogo from "@/assets/integrations/taxisnet-title.gif.asset.json";
import wikiRateLogo from "@/assets/integrations/wikirate-logo.svg.asset.json";

/**
 * Continuous horizontal marquee of real integration logos.
 * Cyprus marks use official logo assets. No favicon service or text fallback.
 */
type Mark = {
  name: string;
  /** Simple Icons slug for monochrome vector logos. */
  simpleIcon?: string;
  logo?: string;
  logoClassName?: string;
};

const MARKS: Mark[] = [
  // Cyprus institutions and partners
  { name: "EAC", logo: eacLogo.url, logoClassName: "h-12 w-8" },
  { name: "JCC", logo: jccLogo.url, logoClassName: "h-8 w-20" },
  { name: "SoftOne", logo: softoneLogo.url, logoClassName: "h-7 w-28" },
  { name: "CY Login", logo: cyLoginCoat.url, logoClassName: "h-9 w-9" },
  { name: "Registrar", logo: registrarLogo.url, logoClassName: "h-9 w-40" },
  { name: "TAXISnet", logo: taxisnetLogo.url, logoClassName: "h-7 w-40" },
  { name: "Ariadni", logo: ariadniLogo.url, logoClassName: "h-8 w-28" },
  { name: "CyStat", logo: cystatLogo.url, logoClassName: "h-8 w-28" },
  // International integrations
  { name: "QuickBooks",     simpleIcon: "quickbooks" },
  { name: "Xero",           simpleIcon: "xero" },
  { name: "Gemini",         simpleIcon: "googlegemini" },
  { name: "Google Cloud",   simpleIcon: "googlecloud" },
  { name: "Climate TRACE", logo: climateTraceLogo.url, logoClassName: "h-8 w-28" },
  { name: "Electricity Maps", logo: electricityMapsLogo.url, logoClassName: "h-7 w-36" },
  { name: "OpenEI", logo: openeiLogo.url, logoClassName: "h-8 w-28" },
  { name: "WikiRate", logo: wikiRateLogo.url, logoClassName: "h-8 w-28" },
];

function LogoImage({ mark, dark }: { mark: Mark; dark?: boolean }) {
  if (mark.logo) {
    return (
      <img
        src={mark.logo}
        alt={`${mark.name} logo`}
        loading="eager"
        fetchPriority="low"
        className={`object-contain ${mark.logoClassName ?? "h-8 w-28"}`}
      />
    );
  }

  if (mark.simpleIcon) {
    const color = dark ? "ffffff" : "000000";
    return (
      <img
        src={`https://cdn.simpleicons.org/${mark.simpleIcon}/${color}`}
        alt={`${mark.name} logo`}
        loading="eager"
        fetchPriority="low"
        className="h-8 w-20 object-contain opacity-80"
      />
    );
  }

  return null;
}

function Entry({ mark, dark }: { mark: Mark; dark?: boolean }) {
  const hasOfficialLogo = Boolean(mark.logo);

  return (
    <div className="flex shrink-0 items-center px-4 sm:px-5" title={mark.name}>
      <span
        className={
          hasOfficialLogo
            ? "flex h-16 min-w-28 items-center justify-center rounded-md border border-border/50 bg-card/85 px-4 shadow-sm sm:min-w-36"
            : "flex h-16 min-w-24 items-center justify-center rounded-md border border-border/40 bg-card/60 px-4 shadow-sm sm:min-w-28"
        }
      >
        <LogoImage mark={mark} dark={dark} />
      </span>
      <span className="sr-only">{mark.name}</span>
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
            National utilities, tax portals and accounting stacks, synced without CSV exports.
          </p>

        </div>
      </div>

      {/* Marquee track, light mode */}
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

      {/* Marquee track, dark mode with white-tinted Simple Icons */}
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
