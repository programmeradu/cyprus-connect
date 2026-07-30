"use client";

/**
 * Console iconography. Single stroke, monochrome, functional only.
 * Agent glyphs are bespoke marks: each agent has a face you can learn.
 */

import type { ReactNode } from "react";

type IcoProps = { size?: number; className?: string; sw?: number };

const S = ({ size = 16, sw = 1.6, className, children }: IcoProps & { children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {children}
  </svg>
);

export const IcoGrid = (p: IcoProps) => (
  <S {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </S>
);

export const IcoPulse = (p: IcoProps) => (
  <S {...p}>
    <path d="M3 12.5h4l2.5-6 4 12 2.5-6h5" />
  </S>
);

export const IcoAgents = (p: IcoProps) => (
  <S {...p}>
    <circle cx="12" cy="8" r="3.2" />
    <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M12 4.8V2.6M18.6 8h2.2M3.2 8h2.2" />
  </S>
);

export const IcoShield = (p: IcoProps) => (
  <S {...p}>
    <path d="M12 2.8 19.5 6v6c0 4.4-3.2 7.7-7.5 9.2C7.7 19.7 4.5 16.4 4.5 12V6Z" />
    <path d="m9 12 2.2 2.2L15.4 10" />
  </S>
);

export const IcoLeaf = (p: IcoProps) => (
  <S {...p}>
    <path d="M20 4c0 9-5.4 13.2-11 13.2A5 5 0 0 1 4 12.2C4 6.8 9.6 4 20 4Z" />
    <path d="M4.5 20c3.4-5.6 7.4-9 12.4-11.4" />
  </S>
);

export const IcoPlug = (p: IcoProps) => (
  <S {...p}>
    <path d="M9 3v5M15 3v5" />
    <path d="M6.5 8h11v3.2A5.5 5.5 0 0 1 12 16.7 5.5 5.5 0 0 1 6.5 11.2Z" />
    <path d="M12 16.7V21" />
  </S>
);

export const IcoDoc = (p: IcoProps) => (
  <S {...p}>
    <path d="M6 2.8h7.5L19 8.4V21H6Z" />
    <path d="M13.2 3v5.6H19" />
    <path d="M9 13h7M9 16.6h5" />
  </S>
);

export const IcoSpark = (p: IcoProps) => (
  <S {...p}>
    <path d="M12 3.2 13.8 9l5.8 1.8-5.8 1.8L12 18.4 10.2 12.6 4.4 10.8 10.2 9Z" />
    <path d="M18.6 3.4v3M20.1 4.9h-3" />
  </S>
);

export const IcoGear = (p: IcoProps) => (
  <S {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.6v2.6M12 18.8v2.6M21.4 12h-2.6M5.2 12H2.6M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8M18.6 18.6l-1.8-1.8M7.2 7.2 5.4 5.4" />
  </S>
);

export const IcoBell = (p: IcoProps) => (
  <S {...p}>
    <path d="M18 9a6 6 0 1 0-12 0c0 5.4-2.2 6.8-2.2 6.8h16.4S18 14.4 18 9" />
    <path d="M13.6 19.2a2 2 0 0 1-3.2 0" />
  </S>
);

export const IcoSearch = (p: IcoProps) => (
  <S {...p}>
    <circle cx="11" cy="11" r="6.4" />
    <path d="m20 20-3.8-3.8" />
  </S>
);

export const IcoChevron = (p: IcoProps) => (
  <S {...p}>
    <path d="m9 5 7 7-7 7" />
  </S>
);

export const IcoArrowUpRight = (p: IcoProps) => (
  <S {...p}>
    <path d="M7 17 17 7M8.5 7H17v8.5" />
  </S>
);

export const IcoCheck = (p: IcoProps) => (
  <S {...p}>
    <path d="m5 12.6 4.6 4.6L19 6.6" />
  </S>
);

export const IcoClock = (p: IcoProps) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M12 7.4V12l3 1.9" />
  </S>
);

export const IcoAlert = (p: IcoProps) => (
  <S {...p}>
    <path d="M12 4.2 21 19.4H3Z" />
    <path d="M12 10v4M12 16.6v.4" />
  </S>
);

export const IcoMenu = (p: IcoProps) => (
  <S {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </S>
);

export const IcoClose = (p: IcoProps) => (
  <S {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </S>
);

/* ------------------------------------------------------------------ */
/* agent glyphs: one mark per agent, drawn on a 24 grid                 */
/* ------------------------------------------------------------------ */

const G = ({ size = 22, sw = 1.35, children }: IcoProps & { children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);

const GLYPHS: Record<string, (p: IcoProps) => ReactNode> = {
  /* Ledger: a data spine with tributaries */
  spine: (p) => (
    <G {...p}>
      <path d="M12 3v18" />
      <path d="M12 7.2 6.5 9.6M12 11.4l5.5 2.4M12 15.6l-5.5 2.4" />
      <circle cx="6.5" cy="9.6" r="1.5" />
      <circle cx="17.5" cy="13.8" r="1.5" />
      <circle cx="6.5" cy="18" r="1.5" />
    </G>
  ),
  /* Factor: a lattice of coefficients */
  lattice: (p) => (
    <G {...p}>
      <path d="M4 8h16M4 16h16M8 4v16M16 4v16" />
      <circle cx="8" cy="8" r="1.4" />
      <circle cx="16" cy="16" r="1.4" />
    </G>
  ),
  /* Border: a customs gate */
  gate: (p) => (
    <G {...p}>
      <path d="M3.5 20V6.5l8.5-3 8.5 3V20" />
      <path d="M3.5 20h17M9 20v-6.5h6V20" />
      <path d="M12 3.5v3" />
    </G>
  ),
  /* Scribe: a nib */
  quill: (p) => (
    <G {...p}>
      <path d="M5 19 19 5" />
      <path d="M14.5 5H19v4.5" />
      <path d="M5 19c3.5-.4 6-1.6 8-3.6" />
      <path d="M10.5 13.5 12 15" />
    </G>
  ),
  /* Compass: bearing on the cheapest tonne */
  compass: (p) => (
    <G {...p}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="m15.2 8.8-2 4.4-4.4 2 2-4.4Z" />
    </G>
  ),
  /* Warden: assurance seal */
  shield: (p) => (
    <G {...p}>
      <path d="M12 3.2 19 6v6.2c0 4.2-3 7.3-7 8.6-4-1.3-7-4.4-7-8.6V6Z" />
      <path d="m9.2 12 2 2 3.6-4" />
    </G>
  ),
  /* Forager: a funded seed */
  seed: (p) => (
    <G {...p}>
      <path d="M12 21v-6.4" />
      <path d="M12 14.6c0-3.6 2.4-6.2 6-6.6.4 3.8-2 6.6-6 6.6Z" />
      <path d="M12 14.6c0-2.9-1.9-5-4.8-5.3-.3 3 1.7 5.3 4.8 5.3Z" />
      <circle cx="12" cy="4.6" r="1.6" />
    </G>
  ),
  /* Weaver: supplier threads */
  weave: (p) => (
    <G {...p}>
      <path d="M4 7c4 0 4 10 8 10s4-10 8-10" />
      <path d="M4 13c4 0 4 6 8 6" />
      <circle cx="20" cy="7" r="1.4" />
      <circle cx="4" cy="7" r="1.4" />
    </G>
  ),
};

export const AgentGlyph = ({ glyph, size = 22 }: { glyph: string; size?: number }) => {
  const draw = GLYPHS[glyph] ?? GLYPHS.spine;
  return <>{draw({ size })}</>;
};
