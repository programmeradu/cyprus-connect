"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
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
  { src: hero01, alt: "Oreites wind turbines at Cyprus golden hour", focus: "60% 55%" },
  { src: hero02, alt: "Troodos mountain ridges at dawn with morning mist", focus: "50% 55%" },
  { src: hero03, alt: "Limassol port cranes at blue hour", focus: "40% 50%" },
  { src: hero04, alt: "Ancient Cypriot olive grove at first light", focus: "55% 55%" },
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
    <section className="relative isolate flex min-h-[100svh] w-full flex-col overflow-hidden">
      {/* Photographic backdrop */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src={shot.src}
          alt={shot.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: shot.focus }}
        />
        {/* Top scrim keeps the floating header readable */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background/70 to-transparent" />
        {/* Left readability wash for the hero text on desktop */}
        <div className="absolute inset-0 hidden bg-gradient-to-r from-background/85 via-background/40 to-transparent md:block" />
        {/* Mobile: full darken to keep the giant type legible */}
        <div className="absolute inset-0 bg-background/60 md:hidden" />
        {/* Bottom fade into next section */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-background/70 to-background" />
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
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-10 pt-28 sm:px-8 sm:pb-14 sm:pt-32 md:pb-20 md:pt-36">
        <div className="max-w-[64rem]">
          <h1
            className="font-[family-name:var(--editorial-display)] text-foreground"
            style={{
              fontOpticalSizing: "auto",
              fontVariationSettings: "'opsz' 144",
              fontWeight: 420,
              fontSize: "clamp(2.75rem, 8.2vw, 7.25rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.038em",
              textWrap: "balance",
            }}
          >
            {t("titleLine1")}
            <br />
            <em
              className="not-italic"
              style={{
                fontStyle: "italic",
                fontWeight: 340,
                fontVariationSettings: "'opsz' 144, 'SOFT' 100",
                letterSpacing: "-0.028em",
                color: "color-mix(in oklab, var(--foreground) 82%, var(--accent-lime) 18%)",
              }}
            >
              {t("titleLine2")}
            </em>
            <br />
            <span style={{ fontWeight: 500 }}>{t("titleLine3")}</span>
            <span className="text-[var(--accent-lime)]">.</span>
          </h1>

          <p
            className="mt-8 max-w-[34rem] leading-[1.55] text-foreground/70 sm:mt-10"
            style={{
              fontFamily: "var(--editorial-sans)",
              fontWeight: 400,
              fontSize: "clamp(1rem, 1.25vw, 1.25rem)",
              letterSpacing: "-0.005em",
            }}
          >
            {t("subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 sm:mt-10">
            <Link
              href="/auth"
              className="group inline-flex items-center gap-4 rounded-md bg-[var(--accent-lime)] px-6 py-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-lime-foreground)] shadow-[0_20px_50px_-20px_color-mix(in_oklab,var(--accent-lime)_60%,transparent)] transition-all hover:translate-y-[-2px] sm:px-7 sm:py-5 sm:text-[14px]"
              style={{ fontFamily: "var(--editorial-sans)" }}
            >
              <span>{t("ctaPrimary")}</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 10h13M11 5l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="square"
                />
              </svg>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-3 text-[15px] font-medium text-foreground/75 underline decoration-foreground/25 decoration-1 underline-offset-[8px] transition-colors hover:text-foreground hover:decoration-foreground"
              style={{ fontFamily: "var(--editorial-sans)" }}
            >
              See pricing
            </Link>
          </div>
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
