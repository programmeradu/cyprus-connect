"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

import { useTranslations } from "next-intl";
import hero01 from "@/assets/hero-01-turbines-dusk.jpg";
import hero02 from "@/assets/hero-02-troodos-dawn.jpg";
import hero03 from "@/assets/hero-03-limassol-blue.jpg";
import hero04 from "@/assets/hero-04-olive-grove.jpg";
import avatar1 from "@/assets/avatar-advisor-1.jpg";
import avatar2 from "@/assets/avatar-advisor-2.jpg";

/**
 * HeroCinematic — full-bleed Cyprus cinematic photography behind a bold
 * editorial hero. Rotates one of four photos per reload. No eyebrows,
 * premium display-weight Fraunces type, chartreuse lime CTA.
 *
 * The photo carries through to the next section (no hard bottom edge) via
 * a long scrim fade rather than a hard cut.
 */
const HERO_SET: { src: StaticImageData; alt: string; focus: string }[] = [
  { src: hero01, alt: "Oreites wind turbines at Cyprus golden hour", focus: "60% 68%" },
  { src: hero02, alt: "Troodos mountain ridges at dawn with morning mist", focus: "50% 70%" },
  { src: hero03, alt: "Limassol port cranes at blue hour", focus: "40% 64%" },
  { src: hero04, alt: "Ancient Cypriot olive grove at first light", focus: "55% 68%" },
];

export function HeroCinematic() {
  const t = useTranslations("hero");

  // Rotate on every mount/reload. Start with index 0 on the server so
  // hydration matches, then swap to a random shot on the client so each
  // reload gets a fresh photo.
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setIdx(Math.floor(Math.random() * HERO_SET.length));
  }, []);
  const shot = HERO_SET[idx];

  return (
    <section className="relative isolate flex min-h-[86svh] w-full flex-col sm:min-h-[100svh]">
      {/* Photographic backdrop - extends past the hero and dissolves (alpha mask)
          into the next section, so no flat wash of background colour appears
          over the photo in light mode. */}
      <div
        className="absolute inset-x-0 top-0 -bottom-24 -z-10 overflow-hidden sm:-bottom-40"
        style={{
          // The dissolve happens ONLY in the 160px that hang below the hero
          // viewport, level with the news marquee. Inside the hero itself the
          // photo stays fully opaque, so no page background bleeds through it.
          WebkitMaskImage:
            "linear-gradient(to top, transparent 0px, rgba(0,0,0,0.25) 48px, rgba(0,0,0,0.75) 108px, #000 160px)",
          maskImage:
            "linear-gradient(to top, transparent 0px, rgba(0,0,0,0.25) 48px, rgba(0,0,0,0.75) 108px, #000 160px)",
        }}
      >

        {/* The container runs ~160px past the viewport so the photo can dissolve
            into the next section. Without compensation, object-cover centres the
            frame inside that taller box and the visible viewport only shows the
            top slice. Pushing objectPosition down pulls the subject back into
            the part of the photo people actually see on load. */}
        <Image
          src={shot.src}
          alt={shot.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover [object-position:50%_45%] md:[object-position:var(--hero-focus)]"
          style={{ "--hero-focus": shot.focus } as CSSProperties}
        />

        {/* Top scrim keeps the floating header readable — dark tint in both modes */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/45 to-transparent" />
        {/* Left readability wash for the hero text on desktop — dark tint, never white */}
        <div className="absolute inset-0 hidden bg-gradient-to-r from-black/65 via-black/25 to-transparent md:block" />
        {/* Mobile: full darken to keep the giant type legible */}
        <div className="absolute inset-0 bg-black/45 md:hidden" />


        {/* Grain */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
            backgroundSize: "240px 240px",
          }}
        />
      </div>

      {/* Content: flex column that fills the viewport height */}
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-10 pt-24 sm:justify-end sm:px-8 sm:pb-14 sm:pt-32 md:pb-20 md:pt-36">
        <div className="max-w-[56rem] [--hero-ink:theme(colors.white)]">
          <h1
            style={{
              fontFamily: "var(--editorial-sans)",
              fontWeight: 600,
              fontSize: "clamp(2.25rem, 5.8vw, 5.25rem)",
              lineHeight: 0.98,
              letterSpacing: "-0.03em",
              textWrap: "balance",
              color: "var(--hero-ink)",
            }}
          >
            {t("titleLine1")}
            <br />
            {t("titleLine2")}
            <br />
            <em
              className="not-italic"
              style={{
                fontFamily: "var(--editorial-display)",
                fontStyle: "italic",
                fontWeight: 300,
                fontOpticalSizing: "auto",
                fontVariationSettings: "'opsz' 144",
                letterSpacing: "-0.02em",
                color: "color-mix(in oklab, var(--hero-ink) 82%, var(--accent-lime) 18%)",
              }}
            >
              {t("titleLine3")}
            </em>
            <span className="text-[var(--accent-lime)]">.</span>
          </h1>

          <p
            className="mt-8 max-w-[34rem] leading-[1.55] sm:mt-10"
            style={{
              fontFamily: "var(--editorial-sans)",
              fontWeight: 400,
              fontSize: "clamp(1rem, 1.25vw, 1.25rem)",
              letterSpacing: "-0.005em",
              color: "color-mix(in oklab, var(--hero-ink) 78%, transparent)",
            }}
          >
            {t("subtitle")}
          </p>

        </div>

        {/* Advisor chip - absolute positioned so it never affects hero height,
            safely clear of the bottom scrim */}
        <div className="pointer-events-none absolute bottom-8 right-6 hidden md:block lg:bottom-12 lg:right-10">
          <div
            className="pointer-events-auto inline-flex items-center gap-4 rounded-full border border-white/30 bg-white/15 py-2 pl-2 pr-6 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.06]"
          >
            <div className="flex -space-x-3">
              <Image
                src={avatar1}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-background object-cover"
              />
              <Image
                src={avatar2}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-background object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-semibold leading-tight text-foreground">
                Talk to a Cyprus advisor
              </span>
              <span
                className="text-[12.5px] leading-tight text-foreground/65"
                style={{ fontFamily: "var(--editorial-sans)" }}
              >
                Free 20-minute consultation
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroCinematic;
