"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "@/i18n/navigation";

import { useLocale, useTranslations } from "next-intl";
import hero01 from "@/assets/hero-01-turbines-dusk.jpg";
import hero02 from "@/assets/hero-02-troodos-dawn.jpg";
import hero03 from "@/assets/hero-03-limassol-blue.jpg";
import hero04 from "@/assets/hero-04-olive-grove.jpg";
import avatar1 from "@/assets/avatar-advisor-1.jpg";
import avatar2 from "@/assets/avatar-advisor-2.jpg";

/**
 * HeroCinematic — full-bleed Cyprus cinematic photography behind a bold
 * editorial hero. Rotates one of four photos per reload. No eyebrows,
 * premium display-weight Commissioner type, chartreuse lime CTA.
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
  const el = useLocale() === "el";

  // Rotate on every mount/reload. Start with index 0 on the server so
  // hydration matches, then swap to a random shot on the client so each
  // reload gets a fresh photo.
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setIdx(Math.floor(Math.random() * HERO_SET.length));
  }, []);
  const shot = HERO_SET[idx];

  return (
    <section data-dark-hero className="relative isolate z-20 flex min-h-[100svh] w-full flex-col">
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
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-16 pt-24 sm:justify-end sm:px-8 sm:pb-14 sm:pt-32 md:pb-20 md:pt-36">
        <div className="mx-auto max-w-[56rem] text-center sm:mx-0 sm:text-left [--hero-ink:theme(colors.white)]">
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
            className="mx-auto mt-7 max-w-[34rem] leading-[1.55] sm:mx-0 sm:mt-10"
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

          {/* Mobile-only CTA, stacked under the subtitle */}
          <div className="mt-9 flex justify-center sm:hidden">
            <Link
              href="/auth"
              className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-full bg-[var(--accent-lime)] px-7 text-[16px] font-semibold tracking-[-0.01em] text-[var(--accent-lime-foreground)] shadow-[0_14px_36px_-14px_color-mix(in_oklab,var(--accent-lime)_60%,transparent)]"
              style={{ fontFamily: "var(--editorial-display)" }}
            >
              {t("ctaPrimary")}
            </Link>
          </div>

        </div>

        {/* Advisor chip - absolute positioned so it never affects hero height,
            safely clear of the bottom scrim */}
        <div className="pointer-events-none absolute bottom-8 right-6 z-30 hidden md:block lg:bottom-12 lg:right-10">
          <div
            tabIndex={0}
            aria-describedby="advisor-soon-tip"
            className="group/advisor pointer-events-auto relative inline-flex cursor-default items-center gap-4 rounded-full border border-white/30 bg-white/15 py-2 pl-2 pr-6 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.06]"
          >
            <div
              id="advisor-soon-tip"
              role="tooltip"
              className="pointer-events-none absolute bottom-[calc(100%+12px)] right-0 w-[280px] translate-y-1 rounded-2xl border border-white/30 bg-background/90 p-4 text-left opacity-0 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition duration-200 group-hover/advisor:translate-y-0 group-hover/advisor:opacity-100 group-focus-visible/advisor:translate-y-0 group-focus-visible/advisor:opacity-100 dark:border-white/10"
            >
              <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-lime)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-lime-foreground)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-lime-foreground)]" aria-hidden="true" />
                {el ? "Σύντομα" : "Coming soon"}
              </span>
              <p className="text-[13.5px] font-semibold leading-snug text-foreground">
                {el ? "Αληθινοί άνθρωποι, πολύ σύντομα." : "Real humans, warming up their coffee."}
              </p>
              <p className="mt-1 text-[12.5px] leading-snug text-foreground/70" style={{ fontFamily: "var(--editorial-sans)" }}>
                {el
                  ? "Οι σύμβουλοί μας στην Κύπρο έρχονται σύντομα. Μέχρι τότε, η Verde είναι εδώ όλο το 24ωρο."
                  : "Our Cyprus advisors join very soon. Until then, Verde is on shift around the clock."}
              </p>
            </div>
            <div className="flex -space-x-3">
              <Image
                src={avatar1}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-white/70 object-cover"
              />
              <Image
                src={avatar2}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-white/70 object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-semibold leading-tight text-white">
                {el ? "Μιλήστε με σύμβουλο στην Κύπρο" : "Talk to a Cyprus advisor"}
              </span>
              <span
                className="text-[12.5px] leading-tight text-white/75"
                style={{ fontFamily: "var(--editorial-sans)" }}
              >
                {el ? "Δωρεάν συνάντηση 20 λεπτών" : "Free 20-minute consultation"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroCinematic;
