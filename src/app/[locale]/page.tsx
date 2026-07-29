"use client";


import { PremiumButton } from "@/components/ui/PremiumButton";
import { NewsTicker } from "@/components/news/NewsTicker";
import { ContextWidgets } from "@/components/landing/ContextWidgets";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { LearnLinksSection } from "@/components/learn/LearnLinksSection";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { WhyChooseGrid } from "@/components/landing/WhyChooseGrid";
import { IntegrationsMarquee } from "@/components/marketing/IntegrationsMarquee";
import { HeroCinematic } from "@/components/landing/HeroCinematic";
import { PowerChapters } from "@/components/landing/PowerChapters";
import sectionWhyImg from "@/assets/section-why-dashboard.jpg";
import sectionPlatformImg from "@/assets/section-platform-scopes.jpg";
import sectionHowImg from "@/assets/section-how-steps.jpg";
import sectionEcosystemImg from "@/assets/section-ecosystem.jpg";
import sectionCtaImg from "@/assets/section-cta-dawn.jpg";
import testimonialBranch from "@/assets/testimonial-impact-curve.png";
import accentJourneyPath from "@/assets/accent-journey-path.png";
import accentWindCurrents from "@/assets/accent-wind-currents.png";

/**
 * Home - editorial redesign.
 * Style guide: no decorative icons, no pill badges, no illustrative SVGs.
 * Mobile-first typography with serif display, numeric prefixes, slash separators.
 */
export default function Home() {
  useSession();
  const tL = useTranslations("landing");

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased">
      {/* Ambient background - subtle topographic pattern + radial glow, sits under all sections */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35] dark:opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% 20%, color-mix(in oklab, var(--foreground) 4%, transparent), transparent 60%),
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'><g fill='none' stroke='%23000' stroke-width='0.5' stroke-opacity='0.06'><path d='M0 120 Q150 60 300 120 T600 120'/><path d='M0 200 Q150 140 300 200 T600 200'/><path d='M0 280 Q150 220 300 280 T600 280'/><path d='M0 360 Q150 300 300 360 T600 360'/><path d='M0 440 Q150 380 300 440 T600 440'/><path d='M0 520 Q150 460 300 520 T600 520'/></g></svg>")
          `,
          backgroundSize: "auto, 600px 600px",
          backgroundRepeat: "no-repeat, repeat",
        }}
      />




      <MarketingHeader />

      <HeroCinematic />


      {/* BENEFITS - Why Vuneli */}
      <div className="relative">

      {/* News ticker - sits inside the hero photo's dissolve so the image
          oozes into this section instead of ending on a colour wash */}
      <section className="relative z-10 -mt-28 bg-transparent">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-28 sm:px-6 sm:pb-12 sm:pt-32">
          <NewsTicker />
        </div>
      </section>



      <SectionDivider />

      {/* BENEFITS - Why Vuneli (Direction B: editorial 4-tile grid) */}
      <WhyChooseGrid />

      </div>


      <SectionDivider />

      {/* POWER - Platform Capabilities (numbered editorial chapters) */}
      <div className="relative">
        <PowerChapters />
      </div>



      <SectionDivider />

      {/* ECOSYSTEM */}
      <div className="relative">
        <EditorialSection
          titleA={tL("beyondTitleA")}
          titleB={tL("beyondTitleB")}
          subtitle={tL("beyondSubtitle")}
          media={{ src: sectionEcosystemImg.src, alt: "ESG ecosystem: marketplace, leaderboard, and learning modules" }}
        >
          <NumberedList
            items={[
              { n: "01", title: tL("ecoLearningTitle"), body: tL("ecoLearningDesc") },
              { n: "02", title: tL("ecoMarketplaceTitle"), body: tL("ecoMarketplaceDesc") },
              { n: "03", title: tL("ecoStudioTitle"), body: tL("ecoStudioDesc") },
              { n: "04", title: tL("ecoLeaderboardTitle"), body: tL("ecoLeaderboardDesc") },
            ]}
          />
        </EditorialSection>
      </div>

      <SectionDivider />

      {/* CONTEXT WIDGETS - geo + time */}
      <div className="relative overflow-hidden">
        {/* Wind-currents accent - horizontal dotted airflow with a terracotta compass
            arrow, spans the wide blank band above the widgets and echoes the
            "where you are / what's blowing your way" story of this section. */}
        <img
          src={accentWindCurrents.src}
          alt=""
          aria-hidden
          loading="lazy"
          className="pointer-events-none absolute -top-6 right-0 z-0 hidden w-[720px] max-w-none select-none opacity-55 mix-blend-multiply dark:opacity-75 dark:mix-blend-screen md:block lg:-top-10 lg:-right-16 lg:w-[960px]"
        />
        <ContextWidgets />
      </div>

      <SectionDivider />

      {/* VISION & ROADMAP BANNER */}
      <section className="relative py-16 bg-muted/30 border-y border-border/40 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 rounded-3xl border border-border/80 bg-background/80 p-8 sm:p-10 backdrop-blur-xl shadow-sm">
            <div className="max-w-2xl">
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--accent-lime-foreground)] bg-[var(--accent-lime)]/20 px-3 py-1 rounded-full font-semibold">
                Strategic Roadmap 2026–2028
              </span>
              <h3 
                className="text-2xl sm:text-4xl font-semibold mt-3 mb-2 text-foreground"
                style={{ fontFamily: "var(--editorial-display)" }}
              >
                Discover the Autonomous ESG Vision
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Learn how Vuneli is building an always-on fleet of digital FTEs to automate CBAM reporting, EAC bill ingestion, and Scope 3 supplier data across Cyprus.
              </p>
            </div>
            <Link href="/vision" className="shrink-0">
              <PremiumButton size="lg">
                Explore Vision & Roadmap
              </PremiumButton>
            </Link>
          </div>
        </div>
      </section>

      <SectionDivider />



      {/* INTEGRATIONS */}
      <IntegrationsMarquee />



      <SectionDivider />

      {/* HOW IT WORKS */}
      <div className="relative">
        {/* Journey-path accent - dotted trail with waypoints and compass rose,
            sits top-right, spills upward past the integrations row above, echoing
            the "connect → analyze → act" three-step flow of this section */}
        <img
          src={accentJourneyPath.src}
          alt=""
          aria-hidden
          loading="lazy"
          className="pointer-events-none absolute -bottom-16 -left-10 z-10 hidden w-[320px] max-w-none rotate-[4deg] select-none opacity-55 mix-blend-multiply dark:opacity-75 dark:mix-blend-screen md:block lg:-bottom-24 lg:-left-20 lg:w-[440px]"
        />
        <EditorialSection
          titleA={tL("howTitleA")}
          titleB={tL("howTitleB")}
          subtitle={tL("howSubtitle")}
          media={{ src: sectionHowImg.src, alt: "Ingest, analyze, act - three-step data flow diagram" }}
        >
          <NumberedList
            items={[
              { n: "01", title: tL("stepConnectTitle"), body: tL("stepConnectDesc") },
              { n: "02", title: tL("stepAnalyzeTitle"), body: tL("stepAnalyzeDesc") },
              { n: "03", title: tL("stepActionTitle"), body: tL("stepActionDesc") },
            ]}
          />
        </EditorialSection>
      </div>

      <SectionDivider />

      {/* TESTIMONIAL */}
      <section className="relative z-20 mx-auto max-w-5xl overflow-hidden px-4 py-24 sm:px-6 sm:py-32">
        {/* Editorial impact-curve - transparent line art blending into the page,
            allowed to extend past the section into the CTA below */}
        <img
          src={testimonialBranch.src}
          alt=""
          aria-hidden
          loading="lazy"
          className="pointer-events-none absolute -top-6 right-2 z-20 hidden w-[320px] max-w-none select-none opacity-60 mix-blend-multiply dark:opacity-80 dark:mix-blend-screen sm:block sm:w-[520px] lg:w-[680px] lg:-top-16 lg:-right-12"
        />

        <div className="relative max-w-3xl">
          <blockquote className="font-[family-name:var(--editorial-serif)] text-[28px] italic leading-[1.18] tracking-[-0.015em] text-foreground sm:text-[46px] sm:leading-[1.1]">
            &ldquo;{tL("testimonialQuoteA")}{" "}
            <span className="not-italic">{tL("testimonialQuoteB")}</span>&rdquo;
          </blockquote>
          <div className="mt-10 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[15px]">
            <span className="font-semibold tracking-[-0.01em] text-foreground">{tL("testimonialAuthor")}</span>
            <span className="text-foreground/60">{tL("testimonialRole")}</span>
            <span className="hidden text-border sm:inline">/</span>
            <span className="text-foreground/60">{tL("testimonialImpact")}</span>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* CTA */}
      <section className="relative overflow-hidden">
        {/* Backdrop */}
        <div className="pointer-events-none absolute inset-0">
          <img
            src={sectionCtaImg.src}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Scrims: left wash for text readability, top/bottom fade into page */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30 dark:from-background dark:via-background/90 dark:to-background/40" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
          {/* Grain - SVG turbulence noise at ~4% opacity to kill banding on the scrim */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
              backgroundSize: "240px 240px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-24 sm:px-6 sm:py-36">
          <h2 className="font-[family-name:var(--editorial-serif)] text-[2.6rem] leading-[1.02] tracking-[-0.025em] sm:text-[4.2rem]">
            {tL("ctaTitleA")} <span className="italic text-muted-foreground">{tL("ctaTitleB")}</span>
          </h2>
          <p className="mt-7 max-w-xl font-[family-name:var(--editorial-serif)] text-[20px] italic leading-[1.45] text-foreground/75 sm:text-[24px]">
            {tL("ctaSubtitle")}
          </p>
          <div className="mt-12 flex flex-wrap items-baseline gap-x-7 gap-y-3">
            <Link href="/auth">
              <PremiumButton size="sm" className="text-[13.5px]">
                {tL("ctaStart")}
              </PremiumButton>
            </Link>
            <Link
              href="/pricing"
              className="text-[15px] font-medium text-foreground/75 underline decoration-foreground/30 underline-offset-[6px] transition-colors hover:text-foreground hover:decoration-foreground/70"
            >
              {tL("ctaPricing")}
            </Link>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* LEARN */}
      <LearnLinksSection />
    </div>
  );
}

/* ---------- Editorial primitives ---------- */

function SectionDivider() {
  return <div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="h-px w-full bg-border/60" /></div>;
}

function EditorialSection({
  titleA,
  titleMid,
  titleB,
  subtitle,
  media,
  children,
}: {
  titleA: string;
  titleMid?: string;
  titleB?: string;
  subtitle?: string;
  media?: { src: string; alt: string };
  children: React.ReactNode;
}) {

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="grid gap-10 sm:grid-cols-12 sm:gap-12">
        <div className="sm:col-span-5">
          <h2 className="mt-5 font-[family-name:var(--editorial-serif)] text-[2.4rem] leading-[1.02] tracking-[-0.025em] sm:text-[3.5rem]">
            {titleA}
            {titleMid && <> <span className="italic text-muted-foreground">{titleMid}</span></>}
            {titleB && <> <span className="italic text-muted-foreground">{titleB}</span></>}
          </h2>
          {subtitle && (
            <p className="mt-6 max-w-md font-[family-name:var(--editorial-serif)] text-[19px] italic leading-[1.45] text-foreground/70 sm:text-[22px]">
              {subtitle}
            </p>
          )}
        </div>
        <div className="sm:col-span-7">
          {media && (
            <div className="mb-8 overflow-hidden rounded-md border border-border/60 bg-muted/30">
              <img
                src={media.src}
                alt={media.alt}
                width={1600}
                height={1008}
                loading="lazy"
                className="h-auto w-full object-cover"
              />
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}

function NumberedList({ items }: { items: { n: string; title: string; body: string }[] }) {
  return (
    <ul className="divide-y divide-border/60 border-y border-border/60">
      {items.map((it) => (
        <li key={it.n} className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 py-7 sm:gap-x-10 sm:py-9">
          <span className="pt-2 text-[11px] font-medium tabular-nums tracking-[0.22em] text-foreground/50">
            {it.n}
          </span>
          <div className="min-w-0">
            <h3 className="font-[family-name:var(--editorial-serif)] text-[22px] leading-[1.15] tracking-[-0.015em] sm:text-[26px]">
              {it.title}
            </h3>
            <p className="mt-3 text-[16px] font-normal leading-[1.55] text-foreground/65 sm:text-[17.5px]">
              {it.body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
