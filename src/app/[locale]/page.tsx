"use client";

import { motion } from "framer-motion";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NewsTicker } from "@/components/news/NewsTicker";
import { ContextWidgets } from "@/components/landing/ContextWidgets";
import { SubscriptionBadge } from "@/components/billing/SubscriptionBadge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { LearnLinksSection } from "@/components/learn/LearnLinksSection";
import sectionWhyImg from "@/assets/section-why-dashboard.jpg";
import sectionPlatformImg from "@/assets/section-platform-scopes.jpg";
import sectionHowImg from "@/assets/section-how-steps.jpg";
import sectionEcosystemImg from "@/assets/section-ecosystem.jpg";
import sectionCtaImg from "@/assets/section-cta-dawn.jpg";
import testimonialBranch from "@/assets/testimonial-impact-curve.png";
import accentGrowthSpark from "@/assets/accent-growth-spark.png";
import accentJourneyPath from "@/assets/accent-journey-path.png";
import accentNetwork from "@/assets/accent-network-constellation.png";

/**
 * Home — editorial redesign.
 * Style guide: no decorative icons, no pill badges, no illustrative SVGs.
 * Mobile-first typography with serif display, numeric prefixes, slash separators.
 */
export default function Home() {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  const tNav = useTranslations("nav");
  const tHero = useTranslations("hero");
  const tL = useTranslations("landing");

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();
    if (error?.code) {
      toast.error(tNav("signOutError"));
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      toast.success(tNav("signOutSuccess"));
      router.push("/");
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased">
      {/* Ambient background — subtle topographic pattern + radial glow, sits under all sections */}
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




      {/* Nav */}
      <header className="sticky top-0 z-50 bg-transparent">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="gradient-text text-lg font-bold tracking-tight font-[family-name:var(--font-geist-sans)]"
          >
            VerdeIQ
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/tools" className="text-sm text-foreground/80 hover:text-foreground">
              {tNav("tools")}
            </Link>
            <Link href="/learn" className="text-sm text-foreground/80 hover:text-foreground">
              {tNav("learn")}
            </Link>
            <Link href="/news" className="text-sm text-foreground/80 hover:text-foreground">
              {tNav("news")}
            </Link>
          </nav>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />
            <ThemeToggle />
            {!isPending && (
              session?.user ? (
                <>
                  <SubscriptionBadge />
                  <Link href="/app" className="hidden sm:inline">
                    <PremiumButton variant="outline" size="sm" className="text-xs">
                      {tNav("dashboard")}
                    </PremiumButton>
                  </Link>
                  <PremiumButton
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={handleSignOut}
                  >
                    {tNav("signOut")}
                  </PremiumButton>
                </>
              ) : (
                <>
                  <Link href="/pricing" className="hidden sm:inline">
                    <PremiumButton variant="outline" size="sm" className="text-xs">
                      {tNav("pricing")}
                    </PremiumButton>
                  </Link>
                  <Link href="/auth">
                    <PremiumButton size="sm" className="text-xs">
                      {tNav("signIn")}
                    </PremiumButton>
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </header>

      {/* HERO — pulled up beneath the transparent header so the image sits under it */}
      <section className="relative -mt-16 overflow-hidden">
        {/* Premium 4K Background Image — visible on all viewports; scrim adapts */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 bg-no-repeat bg-cover"
            style={{
              backgroundImage:
                'url(https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/941d64ce-418c-43a8-8d2f-da8a089432ee/generated_images/premium-4k-photorealistic-image-of-a-mod-7e888bf4-20251114215917.jpg)',
              backgroundPosition: '65% 50%',
            }}
          />
          {/* Mobile scrim: subtle top wash so text is readable while photo stays clearly visible */}
          <div className="absolute inset-0 sm:hidden bg-gradient-to-b from-background/85 via-background/40 to-background/70 dark:from-background/80 dark:via-background/40 dark:to-background/85" />
          {/* Desktop scrim: fade image to the right so left column stays readable */}
          <div className="absolute inset-0 hidden sm:block bg-gradient-to-r from-background via-background/70 to-background/10 dark:from-background dark:via-background/80 dark:to-background/30" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pt-28 pb-16 sm:px-6 sm:pt-40 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-3xl"
        >

          <h1
            className="font-[family-name:var(--editorial-serif)] text-[2.6rem] leading-[1.02] tracking-[-0.02em] sm:text-[4.2rem] sm:leading-[0.98]"
          >
            {tHero("titleLine1")}
            <br />
            <span className="italic text-muted-foreground">{tHero("titleLine2")}</span>
            <br />
            {tHero("titleLine3")}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:mt-8 sm:text-lg">
            {tHero("subtitle")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/auth">
              <PremiumButton size="sm" className="w-full text-sm sm:w-auto">
                {tHero("ctaPrimary")}
              </PremiumButton>
            </Link>
            <Link href="/pricing">
              <PremiumButton variant="outline" size="sm" className="w-full text-sm sm:w-auto">
                {tHero("ctaSecondary")}
              </PremiumButton>
            </Link>
          </div>
        </motion.div>
        </div>
      </section>

      {/* News ticker — replaces the old live dashboard preview */}
      <section className="relative bg-background">
        <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 sm:pb-12">
          <NewsTicker />
        </div>
      </section>

      <SectionDivider />

      {/* BENEFITS — Why VerdeIQ */}
      <div className="relative">
        {/* Growth-spark accent — rising data line sprouting olives; sits top-right,
            spills above the section into the divider, signaling growth from measurement */}
        <img
          src={accentGrowthSpark.src}
          alt=""
          aria-hidden
          loading="lazy"
          className="pointer-events-none absolute -top-16 right-0 z-10 hidden w-[280px] max-w-none -translate-y-2 rotate-[6deg] select-none opacity-55 mix-blend-multiply dark:opacity-75 dark:mix-blend-screen md:block lg:-top-24 lg:right-2 lg:w-[360px]"
        />
        <EditorialSection
          eyebrow="01 / Why VerdeIQ"
          titleA={tL("whyTitleA")}
          subtitle={tL("whySubtitle")}
          media={{ src: sectionWhyImg.src, alt: "VerdeIQ emissions overview dashboard" }}
        >
          <NumberedList
            items={[
              { n: "01", title: tL("benefitAiTitle"), body: tL("benefitAiDesc") },
              { n: "02", title: tL("benefitReportTitle"), body: tL("benefitReportDesc") },
              { n: "03", title: tL("benefitMonitorTitle"), body: tL("benefitMonitorDesc") },
            ]}
          />
        </EditorialSection>
      </div>

      <SectionDivider />

      {/* POWER — Platform Capabilities */}
      <EditorialSection
        eyebrow="02 / The Platform"
        titleA={tL("powerTitleA")}
        titleMid={tL("powerTitleMid")}
        titleB={tL("powerTitleB")}
        subtitle={tL("powerSubtitle")}
        media={{ src: sectionPlatformImg.src, alt: "Scope 1, 2, and 3 emissions breakdown and year-over-year trend" }}
      >
        <NumberedList
          items={[
            { n: "01", title: tL("powerEnergyTitle"), body: tL("powerEnergyDesc") },
            { n: "02", title: tL("powerBenchmarkTitle"), body: tL("powerBenchmarkDesc") },
            { n: "03", title: tL("powerComplianceTitle"), body: tL("powerComplianceDesc") },
            { n: "04", title: tL("powerIntegrationsTitle"), body: tL("powerIntegrationsDesc") },
          ]}
        />
      </EditorialSection>

      <SectionDivider />

      {/* ECOSYSTEM */}
      <div className="relative">
        {/* Network-constellation accent — nine hand-drawn nodes with one terracotta anchor,
            sits bottom-left, spills into the Context Widgets below, evoking the ecosystem web */}
        <img
          src={accentNetwork.src}
          alt=""
          aria-hidden
          loading="lazy"
          className="pointer-events-none absolute -bottom-24 -left-6 z-10 hidden w-[300px] max-w-none rotate-[-8deg] select-none opacity-50 mix-blend-multiply dark:opacity-70 dark:mix-blend-screen md:block lg:-bottom-32 lg:left-2 lg:w-[400px]"
        />
        <EditorialSection
          eyebrow="03 / Ecosystem"
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

      {/* CONTEXT WIDGETS — geo + time */}
      <ContextWidgets />

      <SectionDivider />



      {/* INTEGRATIONS */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-8 text-center eyebrow">
          {tL("integratedWith")}
        </div>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14 md:gap-x-16">
          {[
            { name: "QuickBooks", slug: "quickbooks" },
            { name: "Xero", slug: "xero" },
            { name: "ClimateTRACE", slug: null },
            { name: "ElectricityMaps", slug: null },
            { name: "Gemini", slug: "googlegemini" },
            { name: "OpenEI", slug: null },
            { name: "WikiRate", slug: null },
            { name: "Google Cloud", slug: "googlecloud" },
          ].map(({ name, slug }) => (
            <li
              key={name}
              className="flex h-10 shrink-0 items-center justify-center"
            >
              {slug ? (
                <>
                  <img
                    src={`https://cdn.simpleicons.org/${slug}/000000`}
                    alt={name}
                    className="h-7 w-auto opacity-70 transition-opacity hover:opacity-100 dark:hidden"
                    loading="lazy"
                  />
                  <img
                    src={`https://cdn.simpleicons.org/${slug}/ffffff`}
                    alt={name}
                    className="hidden h-7 w-auto opacity-70 transition-opacity hover:opacity-100 dark:block"
                    loading="lazy"
                  />
                </>
              ) : (
                <span className="text-xl font-semibold tracking-tight text-foreground/80 sm:text-2xl">
                  {name}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <SectionDivider />

      {/* HOW IT WORKS */}
      <div className="relative">
        {/* Journey-path accent — dotted trail with waypoints and compass rose,
            sits top-right, spills upward past the integrations row above, echoing
            the "connect → analyze → act" three-step flow of this section */}
        <img
          src={accentJourneyPath.src}
          alt=""
          aria-hidden
          loading="lazy"
          className="pointer-events-none absolute -top-20 right-0 z-10 hidden w-[380px] max-w-none select-none opacity-55 mix-blend-multiply dark:opacity-75 dark:mix-blend-screen md:block lg:-top-28 lg:-right-4 lg:w-[520px]"
        />
        <EditorialSection
          eyebrow="04 / How it works"
          titleA={tL("howTitleA")}
          titleB={tL("howTitleB")}
          subtitle={tL("howSubtitle")}
          media={{ src: sectionHowImg.src, alt: "Ingest, analyze, act — three-step data flow diagram" }}
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
      <section className="relative z-20 mx-auto max-w-5xl px-4 py-24 sm:px-6 sm:py-32">
        {/* Editorial impact-curve — transparent line art blending into the page,
            allowed to extend past the section into the CTA below */}
        <img
          src={testimonialBranch.src}
          alt=""
          aria-hidden
          loading="lazy"
          className="pointer-events-none absolute -top-6 right-2 z-20 hidden w-[320px] max-w-none select-none opacity-60 mix-blend-multiply dark:opacity-80 dark:mix-blend-screen sm:block sm:w-[520px] lg:w-[680px] lg:-top-16 lg:-right-12"
        />

        <div className="relative max-w-3xl">
          <div className="mb-6 eyebrow">
            {tL("trustedTitleA")} / {tL("trustedTitleB")}
          </div>
          <blockquote className="font-[family-name:var(--editorial-serif)] text-2xl italic leading-snug tracking-tight text-foreground sm:text-4xl sm:leading-[1.15]">
            &ldquo;{tL("testimonialQuoteA")}{" "}
            <span className="not-italic">{tL("testimonialQuoteB")}</span>&rdquo;
          </blockquote>
          <div className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
            <span className="font-medium">{tL("testimonialAuthor")}</span>
            <span className="text-muted-foreground">{tL("testimonialRole")}</span>
            <span className="hidden text-border sm:inline">/</span>
            <span className="text-muted-foreground">{tL("testimonialImpact")}</span>
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
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-24 sm:px-6 sm:py-36">
          <h2 className="font-[family-name:var(--editorial-serif)] text-4xl leading-[1.05] tracking-[-0.02em] sm:text-6xl">
            {tL("ctaTitleA")} <span className="italic text-muted-foreground">{tL("ctaTitleB")}</span>
          </h2>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            {tL("ctaSubtitle")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth">
              <PremiumButton size="sm" className="w-full text-sm sm:w-auto">
                {tL("ctaStart")}
              </PremiumButton>
            </Link>
            <Link href="/pricing">
              <PremiumButton variant="outline" size="sm" className="w-full text-sm sm:w-auto">
                {tL("ctaPricing")}
              </PremiumButton>
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
  eyebrow,
  titleA,
  titleMid,
  titleB,
  subtitle,
  media,
  children,
}: {
  eyebrow: string;
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
          <div className="eyebrow">
            {eyebrow}
          </div>
          <h2 className="mt-5 font-[family-name:var(--editorial-serif)] text-[2rem] leading-[1.05] tracking-[-0.02em] sm:text-[3rem]">
            {titleA}
            {titleMid && <> <span className="italic text-muted-foreground">{titleMid}</span></>}
            {titleB && <> <span className="italic text-muted-foreground">{titleB}</span></>}
          </h2>
          {subtitle && (
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-[17px]">
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
        <li key={it.n} className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 py-6 sm:gap-x-8 sm:py-8">
          <span className="pt-1 text-xs tabular-nums tracking-[0.15em] text-muted-foreground">
            {it.n}
          </span>
          <div className="min-w-0">
            <h3 className="font-[family-name:var(--editorial-serif)] text-xl tracking-tight sm:text-2xl">
              {it.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              {it.body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
