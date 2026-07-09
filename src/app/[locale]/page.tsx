"use client";

import { motion } from "framer-motion";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardDemo } from "@/components/DashboardDemo";
import { SubscriptionBadge } from "@/components/billing/SubscriptionBadge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { LearnLinksSection } from "@/components/learn/LearnLinksSection";

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
    <div className="relative min-h-screen overflow-hidden text-foreground antialiased">
      {/* Premium 4K Background Image */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              'url(https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/941d64ce-418c-43a8-8d2f-da8a089432ee/generated_images/premium-4k-photorealistic-image-of-a-mod-7e888bf4-20251114215917.jpg)',
          }}
        />
        {/* Light: soft scrim on the left half so hero text is legible, right stays open */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/55 to-background/10 dark:hidden" />
        {/* Dark: dim overlay */}
        <div className="absolute inset-0 hidden dark:block bg-gradient-to-r from-background/90 via-background/70 to-background/30" />
        <div className="absolute inset-0 hidden dark:block bg-black/40" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="text-lg font-bold gradient-text tracking-tight">
            VerdeIQ
          </Link>
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

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-16 sm:px-6 sm:pt-24 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <div className="mb-6 flex items-center gap-3 eyebrow">
            <span>VerdeIQ</span>
            <span className="h-px w-8 bg-border" />
            <span>{tHero("badge")}</span>
          </div>

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

        {/* Dashboard demo */}
        <motion.div
          className="mt-14 overflow-hidden rounded-lg border border-border/60 bg-card/40 sm:mt-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25 }}
        >
          <div className="border-b border-border/60 px-4 py-2 eyebrow sm:px-6">
            Live preview / Dashboard
          </div>
          <div className="p-3 sm:p-6">
            <DashboardDemo landingMode />
          </div>
        </motion.div>
      </section>

      <SectionDivider />

      {/* BENEFITS — Why VerdeIQ */}
      <EditorialSection
        eyebrow="01 / Why VerdeIQ"
        titleA={tL("whyTitleA")}
        subtitle={tL("whySubtitle")}
      >
        <NumberedList
          items={[
            { n: "01", title: tL("benefitAiTitle"), body: tL("benefitAiDesc") },
            { n: "02", title: tL("benefitReportTitle"), body: tL("benefitReportDesc") },
            { n: "03", title: tL("benefitMonitorTitle"), body: tL("benefitMonitorDesc") },
          ]}
        />
      </EditorialSection>

      <SectionDivider />

      {/* POWER — Platform Capabilities */}
      <EditorialSection
        eyebrow="02 / The Platform"
        titleA={tL("powerTitleA")}
        titleMid={tL("powerTitleMid")}
        titleB={tL("powerTitleB")}
        subtitle={tL("powerSubtitle")}
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
      <EditorialSection
        eyebrow="03 / Ecosystem"
        titleA={tL("beyondTitleA")}
        titleB={tL("beyondTitleB")}
        subtitle={tL("beyondSubtitle")}
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

      <SectionDivider />

      {/* INTEGRATIONS */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-8 eyebrow">
          {tL("integratedWith")}
        </div>
        <ul className="grid grid-cols-2 items-stretch gap-x-6 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
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
              className="flex h-16 items-center justify-center border-t border-border/60 pt-4"
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
                <span className="font-[family-name:var(--editorial-serif)] text-xl tracking-tight text-foreground sm:text-2xl">
                  {name}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <SectionDivider />

      {/* HOW IT WORKS */}
      <EditorialSection
        eyebrow="04 / How it works"
        titleA={tL("howTitleA")}
        titleB={tL("howTitleB")}
        subtitle={tL("howSubtitle")}
      >
        <NumberedList
          items={[
            { n: "01", title: tL("stepConnectTitle"), body: tL("stepConnectDesc") },
            { n: "02", title: tL("stepAnalyzeTitle"), body: tL("stepAnalyzeDesc") },
            { n: "03", title: tL("stepActionTitle"), body: tL("stepActionDesc") },
          ]}
        />
      </EditorialSection>

      <SectionDivider />

      {/* TESTIMONIAL */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28">
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
      </section>

      <SectionDivider />

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28">
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
  children,
}: {
  eyebrow: string;
  titleA: string;
  titleMid?: string;
  titleB?: string;
  subtitle?: string;
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
        <div className="sm:col-span-7">{children}</div>
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
