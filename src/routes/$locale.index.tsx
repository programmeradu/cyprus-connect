import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { PremiumButton } from "@/components/shell/PremiumButton";
import { MarketingNav } from "@/components/shell/MarketingNav";
import { LearnLinksSection } from "@/components/shell/LearnLinksSection";
import sectionWhyImg from "@/assets/section-why-dashboard.jpg?url";
import sectionPlatformImg from "@/assets/section-platform-scopes.jpg?url";
import sectionHowImg from "@/assets/section-how-steps.jpg?url";
import sectionEcosystemImg from "@/assets/section-ecosystem.jpg?url";
import sectionCtaImg from "@/assets/section-cta-dawn.jpg?url";
import testimonialBranch from "@/assets/testimonial-impact-curve.png?url";
import accentJourneyPath from "@/assets/accent-journey-path.png?url";
import accentWindCurrents from "@/assets/accent-wind-currents.png?url";

const PROD = "https://verdeiq.stauniverse.tech";

export const Route = createFileRoute("/$locale/")({
  head: ({ params }) => {
    const locale = params.locale === "el" ? "el" : "en";
    const isEl = locale === "el";
    const title = isEl
      ? "VerdeIQ — Βιωσιμότητα με τεχνητή νοημοσύνη για ΜμΕ"
      : "VerdeIQ — AI-Powered Sustainability for SMEs";
    const desc = isEl
      ? "Παρακολουθήστε, βελτιστοποιήστε και αναφέρετε τις εκπομπές σας. Πλατφόρμα CSRD/VSME/CBAM για ΜμΕ στην Κύπρο και την ΕΕ."
      : "Track, optimize, and report environmental impact with VerdeIQ's AI-native sustainability platform for SMEs in Cyprus and the EU.";
    const url = `https://verdeiq.lovable.app/${locale}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "en", href: "https://verdeiq.lovable.app/en" },
        { rel: "alternate", hrefLang: "el", href: "https://verdeiq.lovable.app/el" },
        { rel: "alternate", hrefLang: "x-default", href: "https://verdeiq.lovable.app/en" },
      ],
    };
  },
  component: Landing,
});

function Landing() {
  const { locale } = Route.useParams();
  const active = (locale === "el" ? "el" : "en") as "en" | "el";
  const { t } = useTranslation();
  const tNav = (k: string) => t(`nav.${k}`);
  const tHero = (k: string) => t(`hero.${k}`);
  const tL = (k: string) => t(`landing.${k}`);

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased">
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

      <MarketingNav locale={active} />

      {/* HERO */}
      <section className="relative -mt-[57px] overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 bg-no-repeat bg-cover"
            style={{
              backgroundImage:
                "url(https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/941d64ce-418c-43a8-8d2f-da8a089432ee/generated_images/premium-4k-photorealistic-image-of-a-mod-7e888bf4-20251114215917.jpg)",
              backgroundPosition: "65% 50%",
            }}
          />
          <div className="absolute inset-0 sm:hidden bg-gradient-to-b from-background/85 via-background/40 to-background/70 dark:from-background/80 dark:via-background/40 dark:to-background/85" />
          <div className="absolute inset-0 hidden sm:block bg-gradient-to-r from-background via-background/70 to-background/10 dark:from-background dark:via-background/80 dark:to-background/30" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-32 pb-20 sm:px-6 sm:pt-56 sm:pb-32">
          <div className="max-w-[36rem] sm:pl-6 md:pl-14 lg:pl-20">
            <div className="mb-10 flex items-center gap-4">
              <span aria-hidden className="h-px w-14 bg-foreground/50" />
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/70">
                00 / VerdeIQ
              </span>
            </div>
            <h1 className="font-[family-name:var(--editorial-serif)] text-[2.6rem] leading-[1.02] tracking-[-0.02em] sm:text-[4.4rem] sm:leading-[0.96]">
              {tHero("titleLine1")}
              <br />
              <span className="italic text-muted-foreground">{tHero("titleLine2")}</span>
              <br />
              {tHero("titleLine3")}
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:mt-8 sm:text-lg">
              {tHero("subtitle")}
            </p>
            <div className="mt-10">
              <a href={`${PROD}/${active}/auth`}>
                <PremiumButton size="sm" className="w-full text-sm sm:w-auto">
                  {tHero("ctaPrimary")}
                </PremiumButton>
              </a>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Why */}
      <EditorialSection
        eyebrow="01 / Why VerdeIQ"
        titleA={tL("whyTitleA")}
        subtitle={tL("whySubtitle")}
        media={{ src: sectionWhyImg, alt: "VerdeIQ emissions overview dashboard" }}
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

      {/* Platform */}
      <EditorialSection
        eyebrow="02 / The Platform"
        titleA={tL("powerTitleA")}
        titleMid={tL("powerTitleMid")}
        titleB={tL("powerTitleB")}
        subtitle={tL("powerSubtitle")}
        media={{ src: sectionPlatformImg, alt: "Scope 1, 2, and 3 emissions breakdown" }}
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

      {/* Ecosystem */}
      <EditorialSection
        eyebrow="03 / Ecosystem"
        titleA={tL("beyondTitleA")}
        titleB={tL("beyondTitleB")}
        subtitle={tL("beyondSubtitle")}
        media={{ src: sectionEcosystemImg, alt: "ESG ecosystem" }}
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

      {/* Integrations */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="relative z-10 mb-8 text-center eyebrow">{tL("integratedWith")}</div>
        <ul className="relative z-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14 md:gap-x-16">
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
            <li key={name} className="flex h-10 shrink-0 items-center justify-center">
              {slug ? (
                <>
                  <img src={`https://cdn.simpleicons.org/${slug}/000000`} alt={name} loading="lazy" className="h-7 w-auto opacity-70 hover:opacity-100 dark:hidden" />
                  <img src={`https://cdn.simpleicons.org/${slug}/ffffff`} alt={name} loading="lazy" className="hidden h-7 w-auto opacity-70 hover:opacity-100 dark:block" />
                </>
              ) : (
                <span className="text-xl font-semibold tracking-tight text-foreground/80 sm:text-2xl">{name}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <SectionDivider />

      {/* How it works */}
      <div className="relative">
        <img
          src={accentJourneyPath}
          alt=""
          aria-hidden
          loading="lazy"
          className="pointer-events-none absolute -bottom-16 -left-10 z-10 hidden w-[320px] max-w-none rotate-[4deg] select-none opacity-55 mix-blend-multiply dark:opacity-75 dark:mix-blend-screen md:block lg:-bottom-24 lg:-left-20 lg:w-[440px]"
        />
        <EditorialSection
          eyebrow="04 / How it works"
          titleA={tL("howTitleA")}
          titleB={tL("howTitleB")}
          subtitle={tL("howSubtitle")}
          media={{ src: sectionHowImg, alt: "Ingest, analyze, act" }}
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

      {/* Testimonial */}
      <section className="relative z-20 mx-auto max-w-5xl px-4 py-24 sm:px-6 sm:py-32">
        <img
          src={testimonialBranch}
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
        <div className="pointer-events-none absolute inset-0">
          <img src={sectionCtaImg} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
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
            <a href={`${PROD}/${active}/auth`}>
              <PremiumButton size="sm" className="w-full text-sm sm:w-auto">{tL("ctaStart")}</PremiumButton>
            </a>
            <a href={`${PROD}/${active}/pricing`}>
              <PremiumButton variant="outline" size="sm" className="w-full text-sm sm:w-auto">{tL("ctaPricing")}</PremiumButton>
            </a>
          </div>
        </div>
      </section>

      <SectionDivider />

      <LearnLinksSection locale={active} />

      <img
        src={accentWindCurrents}
        alt=""
        aria-hidden
        loading="lazy"
        className="hidden"
      />

      {/* Note about live widgets: NewsTicker, ContextWidgets and SubscriptionBadge
          on the Next.js production site require its API surface. This Lovable
          shell links out to that site for the app itself. */}
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="h-px w-full bg-border/60" />
    </div>
  );
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
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="grid gap-10 sm:grid-cols-12 sm:gap-12">
        <div className="sm:col-span-5">
          <div className="eyebrow">{eyebrow}</div>
          <h2 className="mt-5 font-[family-name:var(--editorial-serif)] text-[2rem] leading-[1.05] tracking-[-0.02em] sm:text-[3rem]">
            {titleA}
            {titleMid && <> <span className="italic text-muted-foreground">{titleMid}</span></>}
            {titleB && <> <span className="italic text-muted-foreground">{titleB}</span></>}
          </h2>
          {subtitle && (
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-[17px]">{subtitle}</p>
          )}
        </div>
        <div className="sm:col-span-7">
          {media && (
            <div className="mb-8 overflow-hidden rounded-md border border-border/60 bg-muted/30">
              <img src={media.src} alt={media.alt} width={1600} height={1008} loading="lazy" className="h-auto w-full object-cover" />
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
          <span className="pt-1 text-xs tabular-nums tracking-[0.15em] text-muted-foreground">{it.n}</span>
          <div className="min-w-0">
            <h3 className="font-[family-name:var(--editorial-serif)] text-xl tracking-tight sm:text-2xl">{it.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground sm:text-base">{it.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
