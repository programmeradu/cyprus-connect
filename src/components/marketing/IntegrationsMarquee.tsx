"use client";

import { useTranslations } from "next-intl";

/**
 * Continuous horizontal marquee of Cyprus integration wordmarks.
 * Monochrome, editorial, dark/light adaptive. Pure CSS keyframe scroll,
 * duplicated track for seamless loop, pauses on hover, respects
 * prefers-reduced-motion.
 */
type Mark = {
  name: string;
  /** Typography family key from our stack. */
  family: "sans" | "serif" | "mono";
  /** Weight tier. */
  weight: 400 | 500 | 600 | 700;
  /** Optional letter-spacing tweak. */
  tracking?: string;
  /** Optional case override. */
  caps?: boolean;
  /** Small caption below the wordmark (what the partner is). */
  caption: string;
};

const MARKS: Mark[] = [
  { name: "EAC",       family: "sans",  weight: 700, tracking: "-0.02em", caption: "Electricity Authority" },
  { name: "JCC",       family: "sans",  weight: 600, tracking: "0.02em",  caption: "Payments" },
  { name: "SoftOne",   family: "serif", weight: 500, tracking: "-0.02em", caption: "ERP" },
  { name: "CY Login",  family: "sans",  weight: 500, tracking: "-0.01em", caption: "Government ID" },
  { name: "Registrar", family: "serif", weight: 400, tracking: "0",       caption: "Companies House" },
  { name: "TAXISnet",  family: "mono",  weight: 500, tracking: "-0.02em", caps: true, caption: "Tax filings" },
  { name: "Ariadni",   family: "serif", weight: 400, tracking: "0",       caption: "Digital services" },
  { name: "Cystat",    family: "sans",  weight: 600, tracking: "-0.01em", caption: "Statistical service" },
];

const FAMILY_VAR: Record<Mark["family"], string> = {
  sans:  "var(--font-instrument-sans, ui-sans-serif)",
  serif: "var(--editorial-serif, ui-serif)",
  mono:  "var(--font-mono, ui-monospace)",
};

function Wordmark({ mark }: { mark: Mark }) {
  return (
    <div className="flex shrink-0 flex-col items-start gap-1.5 px-8 sm:px-12">
      <span
        className={`text-[26px] leading-none text-foreground/85 sm:text-[30px] ${mark.caps ? "uppercase" : ""}`}
        style={{
          fontFamily: FAMILY_VAR[mark.family],
          fontWeight: mark.weight,
          letterSpacing: mark.tracking ?? "0",
          fontStyle: mark.family === "serif" ? "italic" : "normal",
        }}
      >
        {mark.name}
      </span>
      <span
        className="text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/40"
        style={{ fontFamily: FAMILY_VAR.mono }}
      >
        {mark.caption}
      </span>
    </div>
  );
}

export function IntegrationsMarquee() {
  const tL = useTranslations("landing");

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
              style={{ fontFamily: FAMILY_VAR.mono }}
            >
              [ CYPRUS INTEGRATIONS ]
            </span>
            <h2
              id="integrations-heading"
              className="mt-4 max-w-2xl font-[family-name:var(--editorial-serif)] text-[2rem] leading-[1.05] tracking-[-0.02em] sm:text-[2.75rem]"
            >
              {tL.has?.("integrationsTitle")
                ? tL("integrationsTitle")
                : "Connected to the systems Cyprus SMEs already run on."}
            </h2>
          </div>
          <p className="max-w-sm text-[14px] leading-[1.5] text-foreground/60">
            {tL.has?.("integrationsSubtitle")
              ? tL("integrationsSubtitle")
              : "One-click sync with the national utilities, tax portals and accounting stacks your team touches every day."}
          </p>
        </div>
      </div>

      {/* Marquee track */}
      <div
        className="group relative overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)",
        }}
      >
        <div className="viq-marquee-track flex w-max items-center py-4">
          {track.map((m, i) => (
            <div key={`${m.name}-${i}`} className="flex items-center">
              <Wordmark mark={m} />
              <span aria-hidden className="h-8 w-px shrink-0 bg-border/60" />
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
          animation: viq-marquee 48s linear infinite;
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
