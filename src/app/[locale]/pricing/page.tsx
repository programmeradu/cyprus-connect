"use client";

import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SubscriptionBadge } from "@/components/billing/SubscriptionBadge";
import { PricingTable } from "@/components/autumn/pricing-table";
import { PaymentGatewaySelector } from "@/components/billing/PaymentGatewaySelector";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";

export default function PricingPage() {
  const { data: session } = useSession();
  const tNav = useTranslations("nav");
  const t = useTranslations("pricing");

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Header */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-2">
          <Link href="/">
            <h1 className="text-sm font-bold gradient-text tracking-tight cursor-pointer">
              VerdeIQ
            </h1>
          </Link>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <LanguageSwitcher />
            <ThemeToggle />
            {session?.user ? (
              <>
                <SubscriptionBadge />
                <Link href="/app">
                  <PremiumButton variant="outline" size="sm" className="text-xs px-2.5 py-1 h-7 whitespace-nowrap">
                    {tNav("dashboard")}
                  </PremiumButton>
                </Link>
              </>
            ) : (
              <Link href="/auth">
                <PremiumButton variant="outline" size="sm" className="text-xs px-2.5 py-1 h-7 whitespace-nowrap">
                  {tNav("signIn")}
                </PremiumButton>
              </Link>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-10 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-2xl md:text-3xl font-semibold mb-3 tracking-tight">
              {t("titleA")} <span className="gradient-text">{t("titleB")}</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-4 font-light">
              {t("subtitle")}
            </p>
            <p className="text-[11px] text-muted-foreground/80 max-w-xl mx-auto font-light">
              {t("vatNoticeCY")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Table */}
      <section className="relative pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <PricingTable />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-xl font-semibold mb-2">
              {t("faqTitleA")} <span className="gradient-text">{t("faqTitleB")}</span>
            </h2>
            <p className="text-xs text-muted-foreground font-light">{t("faqSubtitle")}</p>
          </motion.div>

          <div className="space-y-3">
            {([1, 2, 3, 4, 5] as const).map((i, index) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <PremiumCard className="p-4">
                  <h3 className="font-semibold text-sm mb-1.5">
                    {t(`faq.q${i}` as `faq.q${typeof i}`)}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-light">
                    {t(`faq.a${i}` as `faq.a${typeof i}`)}
                  </p>
                </PremiumCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <PremiumCard className="p-6 md:p-8 text-center bg-gradient-to-br from-primary/5 to-primary/10">
              <h2 className="text-xl md:text-2xl font-semibold mb-2.5">
                {t("ctaTitleA")} <span className="gradient-text">{t("ctaTitleB")}</span>
              </h2>
              <p className="text-xs text-muted-foreground mb-4 max-w-xl mx-auto font-light">
                {t("ctaSubtitle")}
              </p>
              <Link href="/auth">
                <PremiumButton size="sm" className="h-8 text-xs px-4">
                  <span className="whitespace-nowrap">{t("ctaButton")}</span>
                  <svg className="w-3 h-3 ml-1.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </PremiumButton>
              </Link>
            </PremiumCard>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs text-muted-foreground font-light">
            © {new Date().getFullYear()} VerdeIQ. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
