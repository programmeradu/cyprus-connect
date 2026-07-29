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
    <section className="relative isolate">
      {/* Photographic backdrop — bleeds under the floating header AND
          extends past the hero into the next section via the long
          bottom scrim fade below. */}
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
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background/60 to-transparent" />
        {/* Left readability wash for the hero text on desktop */}
        <div className="absolute inset-0 hidden bg-gradient-to-r from-background/85 via-background/40 to-transparent md:block" />
        {/* Mobile: full darken to keep the giant type legible */}
        <div className="absolute inset-0 bg-background/55 md:hidden" />
        {/* Long bottom fade — carries the image into the next section
            instead of cutting hard at the fold */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent via-background/70 to-background" />
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

      <div className="mx-auto max-w-6xl px-5 pb-40 pt-36 sm:px-8 sm:pb-56 sm:pt-48 md:pt-64 lg:pb-72">
        <div className="grid gap-12 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-8 lg:col-span-9">
            {/* Bold editorial headline — no eyebrow, no pill.
                Fraunces display weight, tight tracking, mixed roman/italic. */}
            <h1
              className="font-[family-name:var(--editorial-display)] text-[3.4rem] font-medium leading-[0.95] tracking-[-0.03em] text-foreground sm:text-[5.2rem] md:text-[6.4rem] lg:text-[7.4rem]"
              style={{ fontOpticalSizing: "auto" }}
            >
              {t("titleLine1")}
              <br />
              <span className="italic font-normal text-foreground/60">
                {t("titleLine2")}
              </span>
              <br />
              {t("titleLine3")}
              <span className="text-[var(--accent-lime)]">.</span>
            </h1>

            <p
              className="mt-10 max-w-xl text-lg leading-[1.55] text-foreground/80 sm:text-[22px] sm:leading-[1.5]"
              style={{ fontFamily: "var(--editorial-sans)", fontWeight: 400 }}
            >
              {t("subtitle")}
            </p>

            {/* CTAs — chunky chartreuse primary + underline secondary */}
            <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-5">
              <Link
                href="/auth"
                className="group inline-flex items-center gap-4 rounded-md bg-[var(--accent-lime)] px-7 py-5 text-[14px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-lime-foreground)] shadow-[0_20px_50px_-20px_color-mix(in_oklab,var(--accent-lime)_60%,transparent)] transition-all hover:translate-y-[-2px]"
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

          {/* Advisor trust cluster — pinned bottom-right on desktop
              (Lifecycle steal, done properly this time) */}
          <div className="md:col-span-4 lg:col-span-3 md:flex md:items-end md:justify-end">
            <div
              className="inline-flex items-center gap-4 rounded-full border border-white/30 bg-white/15 py-2 pl-2 pr-6 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.06]"
            >
              <div className="flex -space-x-3">
                <Image
                  src={avatar1}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full border-2 border-background object-cover"
                />
                <Image
                  src={avatar2}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full border-2 border-background object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold leading-tight text-foreground">
                  Talk to a Cyprus advisor
                </span>
                <span
                  className="text-[13px] leading-tight text-foreground/65"
                  style={{ fontFamily: "var(--editorial-sans)" }}
                >
                  Free 20-minute consultation
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroCinematic;
