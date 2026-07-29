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

const CYPRUS_MARKS: Mark[] = [
  { name: "EAC", logo: eacLogo.url, logoClassName: "h-12 w-8" },
  { name: "JCC", logo: jccLogo.url, logoClassName: "h-8 w-20" },
  { name: "SoftOne", logo: softoneLogo.url, logoClassName: "h-7 w-28" },
  { name: "CY Login", logo: cyLoginCoat.url, logoClassName: "h-9 w-9" },
  { name: "Registrar", logo: registrarLogo.url, logoClassName: "h-9 w-40" },
  { name: "TAXISnet", logo: taxisnetLogo.url, logoClassName: "h-7 w-40" },
  { name: "Ariadni", logo: ariadniLogo.url, logoClassName: "h-8 w-28" },
  { name: "CyStat", logo: cystatLogo.url, logoClassName: "h-8 w-28" },
];

const GLOBAL_MARKS: Mark[] = [
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
    <div className="flex items-center" title={mark.name}>
      <span
        className={
          hasOfficialLogo
            ? "flex h-16 min-w-32 items-center justify-center rounded-md border border-border/50 bg-card/85 px-5 shadow-sm sm:min-w-40"
            : "flex h-16 min-w-28 items-center justify-center rounded-md border border-border/40 bg-card/60 px-5 shadow-sm sm:min-w-32"
        }
      >
        <LogoImage mark={mark} dark={dark} />
      </span>
      <span className="sr-only">{mark.name}</span>
    </div>
  );
}

function Row({ marks }: { marks: Mark[] }) {
  return (
    <>
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 dark:hidden">
        {marks.map((m) => (
          <Entry key={m.name} mark={m} dark={false} />
        ))}
      </div>
      <div className="hidden flex-wrap justify-center gap-3 sm:gap-4 dark:flex">
        {marks.map((m) => (
          <Entry key={`${m.name}-d`} mark={m} dark />
        ))}
      </div>
    </>
  );
}

export function IntegrationsMarquee() {
  return (
    <section
      aria-labelledby="integrations-heading"
      className="relative border-y border-border/60 bg-background/40 py-14 sm:py-20"
    >
      <div className="mx-auto mb-10 max-w-6xl px-4 sm:mb-14 sm:px-6">
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

      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:gap-5 sm:px-6">
        <Row marks={CYPRUS_MARKS} />
        <Row marks={GLOBAL_MARKS} />
      </div>
    </section>
  );
}
