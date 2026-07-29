"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SubscriptionBadge } from "@/components/billing/SubscriptionBadge";

/**
 * MarketingHeader — floating glass pill (Solaric-inspired), transparent over hero,
 * gains subtle glass on scroll. Vuneli wordmark left, centered nav, lime CTA right.
 */
export function MarketingHeader() {
  const { data: session, isPending } = useSession();
  const tNav = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="group/header fixed inset-x-0 top-4 z-50 flex justify-center px-3 sm:top-6 sm:px-6"
      style={{ fontFamily: "var(--editorial-sans)" }}
    >
      <div
        className={[
          "flex w-full max-w-3xl items-center justify-between gap-3 rounded-full border px-4 py-2.5 transition-all duration-300 sm:px-5 sm:py-3",
          scrolled
            ? "border-foreground/10 bg-background/85 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.22)] backdrop-blur-xl"
            : "border-foreground/10 bg-background/55 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-background/40",
        ].join(" ")}
      >
        <Link
          href="/"
          className="flex items-center pl-1.5 text-[19px] font-semibold tracking-[-0.025em] text-foreground"
          style={{ fontFamily: "var(--editorial-display)" }}
        >
          Vuneli
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/tools" className="text-[15px] font-medium text-foreground/80 transition-colors hover:text-foreground">
            {tNav("tools")}
          </Link>
          <Link href="/learn" className="text-[15px] font-medium text-foreground/80 transition-colors hover:text-foreground">
            {tNav("learn")}
          </Link>
          <Link href="/news" className="text-[15px] font-medium text-foreground/80 transition-colors hover:text-foreground">
            {tNav("news")}
          </Link>
          <Link href="/pricing" className="text-[15px] font-medium text-foreground/80 transition-colors hover:text-foreground">
            {tNav("pricing")}
          </Link>
        </nav>

        <div className="relative flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          {!isPending &&
            (session?.user ? (
              <>
                <SubscriptionBadge />
                <Link
                  href="/app"
                  className="ml-1 inline-flex h-11 items-center whitespace-nowrap rounded-full bg-[var(--accent-lime)] px-5 text-[13.5px] font-semibold uppercase tracking-[0.1em] text-[var(--accent-lime-foreground)] transition-transform hover:scale-[1.02]"
                >
                  {tNav("dashboard")}
                </Link>
              </>
            ) : (
              // Absolute so hover-reveal never shifts layout or covers the switchers.
              <Link
                href="/auth"
                aria-label={tNav("signIn")}
                className="pointer-events-none absolute right-0 top-1/2 z-10 inline-flex h-9 -translate-y-1/2 translate-x-[calc(100%+8px)] items-center whitespace-nowrap rounded-full bg-[var(--accent-lime)] px-4 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-[var(--accent-lime-foreground)] opacity-0 shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--accent-lime)_55%,transparent)] transition-opacity duration-300 ease-out focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover/header:pointer-events-auto group-hover/header:opacity-100"
              >
                {tNav("signIn")}
              </Link>
            ))}
        </div>
      </div>
    </header>
  );
}

export default MarketingHeader;
