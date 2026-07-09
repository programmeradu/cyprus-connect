"use client";

import { Link } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SubscriptionBadge } from "@/components/billing/SubscriptionBadge";

/**
 * Shared marketing header used across landing, pricing, learn hub, and pillar pages.
 * Sticky, glassy backdrop; VerdeIQ wordmark left, locale/theme/auth controls right.
 */
export function MarketingHeader() {
  const { data: session, isPending } = useSession();
  const tNav = useTranslations("nav");

  return (
    <header
      className="sticky top-0 z-50 border-b border-foreground/10 bg-background/85 backdrop-blur-md"
      style={{ fontFamily: "var(--editorial-sans)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <Link href="/" className="min-w-0 text-base font-semibold tracking-tight sm:text-lg">
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
        <div className="flex shrink-0 items-center gap-1.5">
          <LanguageSwitcher />
          <ThemeToggle />
          {!isPending &&
            (session?.user ? (
              <>
                <SubscriptionBadge />
                <Link href="/app" className="hidden sm:inline">
                  <PremiumButton variant="outline" size="sm" className="h-8 whitespace-nowrap px-3 text-xs">
                    {tNav("dashboard")}
                  </PremiumButton>
                </Link>
              </>
            ) : (
              <>
                <Link href="/pricing" className="hidden sm:inline">
                  <PremiumButton variant="outline" size="sm" className="h-8 whitespace-nowrap px-3 text-xs">
                    {tNav("pricing")}
                  </PremiumButton>
                </Link>
                <Link href="/auth">
                  <PremiumButton size="sm" className="h-8 whitespace-nowrap px-3 text-xs">
                    {tNav("signIn")}
                  </PremiumButton>
                </Link>
              </>
            ))}
        </div>
      </div>
    </header>
  );
}

export default MarketingHeader;
