"use client";

import { useSession } from "@/lib/auth-client";
import { Link } from "@/i18n/navigation";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SubscriptionBadge } from "@/components/billing/SubscriptionBadge";
import { PricingTable } from "@/components/billing/PricingTable";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { LearnLinksSection } from "@/components/learn/LearnLinksSection";

export default function PricingPage() {
  const { data: session } = useSession();
  const tNav = useTranslations("nav");
  const t = useTranslations("pricing");

  return (
    <div className="relative min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Link href="/" aria-label="VerdeIQ home" className="min-w-0">
            <span
              className="text-base font-semibold tracking-tight sm:text-lg"
              style={{ fontFamily: "var(--editorial-serif)" }}
            >
              VerdeIQ
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            <LanguageSwitcher />
            <ThemeToggle />
            {session?.user ? (
              <>
                <SubscriptionBadge />
                <Link href="/app">
                  <PremiumButton variant="outline" size="sm" className="h-8 whitespace-nowrap px-3 text-xs">
                    {tNav("dashboard")}
                  </PremiumButton>
                </Link>
              </>
            ) : (
              <Link href="/auth">
                <PremiumButton variant="outline" size="sm" className="h-8 whitespace-nowrap px-3 text-xs">
                  {tNav("signIn")}
                </PremiumButton>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 pb-10 pt-14 sm:px-8 sm:pb-16 sm:pt-24">
        <div className="mx-auto max-w-4xl">
          <div className="eyebrow mb-5">Pricing</div>
          <h1
            className="text-balance text-[2.25rem] leading-[1.02] tracking-tight sm:text-6xl md:text-7xl"
            style={{ fontFamily: "var(--editorial-serif)", fontWeight: 400 }}
          >
            {t("titleA")}{" "}
            <em className="italic text-muted-foreground">{t("titleB")}</em>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mt-8 sm:text-lg">
            {t("subtitle")}
          </p>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground/70 sm:text-sm">
            {t("vatNoticeCY")}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="h-px w-full bg-border/60" />
      </div>

      {/* Plans */}
      <section className="px-5 py-12 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <PricingTable />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="h-px w-full bg-border/60" />
      </div>

      {/* FAQ */}
      <section className="px-5 py-14 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="eyebrow mb-4">{t("faqSubtitle")}</div>
          <h2
            className="mb-10 text-balance text-3xl leading-[1.05] tracking-tight sm:mb-14 sm:text-5xl"
            style={{ fontFamily: "var(--editorial-serif)", fontWeight: 400 }}
          >
            {t("faqTitleA")}{" "}
            <em className="italic text-muted-foreground">{t("faqTitleB")}</em>
          </h2>

          <div className="divide-y divide-border/60 border-y border-border/60">
            {([1, 2, 3, 4, 5] as const).map((i) => (
              <details key={i} className="group py-5 sm:py-7">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
                  <div className="flex min-w-0 items-start gap-4 sm:gap-6">
                    <span
                      className="mt-1 shrink-0 text-xs tabular-nums text-muted-foreground sm:text-sm"
                      style={{ letterSpacing: "0.1em" }}
                    >
                      {String(i).padStart(2, "0")}
                    </span>
                    <h3 className="text-balance text-base font-medium leading-snug sm:text-xl">
                      {t(`faq.q${i}` as `faq.q${typeof i}`)}
                    </h3>
                  </div>
                  <span
                    aria-hidden
                    className="mt-1.5 shrink-0 text-lg text-muted-foreground transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="ml-8 mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:ml-14 sm:text-base">
                  {t(`faq.a${i}` as `faq.a${typeof i}`)}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="h-px w-full bg-border/60" />
      </div>

      {/* CTA */}
      <section className="px-5 py-16 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="text-balance text-3xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl"
            style={{ fontFamily: "var(--editorial-serif)", fontWeight: 400 }}
          >
            {t("ctaTitleA")}{" "}
            <em className="italic text-muted-foreground">{t("ctaTitleB")}</em>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("ctaSubtitle")}
          </p>
          <div className="mt-8 sm:mt-10">
            <Link href="/auth" className="inline-block">
              <PremiumButton size="lg" className="h-12 px-8 text-sm">
                <span className="whitespace-nowrap">{t("ctaButton")}</span>
                <span aria-hidden className="ml-2">→</span>
              </PremiumButton>
            </Link>
          </div>
        </div>
      </section>

      <LearnLinksSection />
    </div>
  );
}
