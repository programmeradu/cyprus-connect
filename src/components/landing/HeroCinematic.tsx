"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import heroPort from "@/assets/hero-limassol-port.jpg";
import heroDashboard from "@/assets/hero-dashboard-mockup.png";
import avatar1 from "@/assets/avatar-advisor-1.jpg";
import avatar2 from "@/assets/avatar-advisor-2.jpg";

/**
 * HeroCinematic — full-bleed Limassol port photograph with a frosted glass
 * hero card, bracketed mono eyebrow, mixed-weight headline, chartreuse CTA,
 * and a human trust cluster. Below: a tilted dashboard mockup that anchors
 * "this is a real product".
 *
 * Composition steals (audit ref):
 *  - Lifecycle: full-bleed photo + glass card + bracketed eyebrow + lime CTA
 *  - Solaric:   split layout + trust cluster with avatars
 *  - GreenX:    mixed serif-italic headline weight
 *  - Emitra:    tilted product screenshot below the fold
 */
export function HeroCinematic() {
  const t = useTranslations("hero");

  return (
    <section className="relative isolate overflow-hidden">
      {/* Photographic backdrop — bleeds under the floating header */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={heroPort}
          alt="Limassol port at golden hour"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_50%]"
        />
        {/* Vertical scrim so the wordmark + card stay readable across themes */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
        {/* Desktop: fade image to the right so the glass card reads clearly on the left */}
        <div className="absolute inset-0 hidden bg-gradient-to-r from-background/70 via-background/20 to-transparent md:block" />
        {/* Grain — kills banding on the scrim */}
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

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-40 sm:px-6 sm:pb-24 sm:pt-52 md:pt-64">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          {/* Frosted glass hero card */}
          <div className="md:col-span-7 lg:col-span-6">
            <div
              className="relative rounded-2xl border border-white/25 bg-white/10 p-7 backdrop-blur-2xl backdrop-saturate-150 sm:p-9 dark:border-white/10 dark:bg-white/[0.04]"
              style={{
                boxShadow:
                  "0 24px 60px -24px rgba(0,0,0,0.35), inset 0 1px 0 0 rgba(255,255,255,0.25)",
              }}
            >
              {/* Bracketed mono eyebrow — Lifecycle steal */}
              <p
                className="mb-6 text-[11px] uppercase tracking-[0.22em] text-foreground/70"
                style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}
              >
                [ CYPRUS SUSTAINABILITY OS ]
              </p>

              {/* Mixed-weight headline — GreenX steal */}
              <h1 className="font-[family-name:var(--editorial-serif)] text-[2.4rem] leading-[1.02] tracking-[-0.025em] text-foreground sm:text-[3.4rem] sm:leading-[0.98]">
                {t("titleLine1")}
                <br />
                <span className="italic font-normal text-foreground/70">
                  {t("titleLine2")}
                </span>
                <br />
                {t("titleLine3")}
                <span className="text-[oklch(0.55_0.15_155)]">.</span>
              </h1>

              <p className="mt-6 max-w-md text-[15px] leading-[1.6] text-foreground/75 sm:text-base">
                {t("subtitle")}
              </p>

              {/* CTA — Lifecycle-style sharp chartreuse rectangle */}
              <div className="mt-8">
                <Link
                  href="/auth"
                  className="group inline-flex w-full items-center justify-between gap-4 rounded-md bg-[var(--accent-lime)] px-5 py-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-lime-foreground)] transition-all hover:translate-y-[-1px] sm:w-auto"
                >
                  <span>{t("ctaPrimary")}</span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    className="transition-transform group-hover:translate-x-1"
                  >
                    <path
                      d="M3 9h11M10 5l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="square"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Trust cluster — Solaric + Lifecycle steal, sits to the right of the card on desktop */}
          <div className="md:col-span-5 lg:col-span-6 md:flex md:items-end md:justify-end">
            <div className="inline-flex items-center gap-4 rounded-full border border-white/25 bg-white/10 py-2 pl-2 pr-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex -space-x-2">
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
                <span
                  className="text-[10.5px] uppercase tracking-[0.16em] text-foreground/60"
                  style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}
                >
                  Talk to a Cyprus advisor
                </span>
                <span className="text-[13.5px] font-medium text-foreground">
                  Free 20-minute consultation
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tilted dashboard mockup — Emitra steal, product proof */}
        <div className="relative mt-20 sm:mt-28">
          <div
            className="pointer-events-none absolute inset-x-0 -bottom-8 -top-8 -z-10 rounded-[2rem] bg-gradient-to-b from-[oklch(0.55_0.15_155)]/10 via-transparent to-transparent blur-2xl"
            aria-hidden
          />
          <Image
            src={heroDashboard}
            alt="VerdeIQ dashboard: Scope 1+2+3 emissions trending down, CBAM import value, Cyprus grid intensity"
            width={1600}
            height={1104}
            priority
            className="mx-auto h-auto w-full max-w-5xl drop-shadow-[0_40px_80px_rgba(0,0,0,0.35)]"
          />
        </div>
      </div>
    </section>
  );
}

export default HeroCinematic;
