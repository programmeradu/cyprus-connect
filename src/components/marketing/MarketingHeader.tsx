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
 * gains subtle glass on scroll. VerdeIQ wordmark left, centered nav, lime CTA right.
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
      className="fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-5 sm:px-6"
      style={{ fontFamily: "var(--editorial-sans)" }}
    >
      <div
        className={[
          "flex w-full max-w-6xl items-center justify-between gap-3 rounded-full border px-3 py-2 transition-all duration-300 sm:px-4",
          scrolled
            ? "border-foreground/10 bg-background/70 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl"
            : "border-white/15 bg-white/5 backdrop-blur-md",
        ].join(" ")}
      >
        <Link
          href="/"
          className="flex items-center gap-2 pl-2 text-[15px] font-semibold tracking-[-0.02em] text-foreground"
        >
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full bg-[oklch(0.55_0.15_155)]"
          />
          VerdeIQ
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link href="/tools" className="text-[13.5px] text-foreground/75 transition-colors hover:text-foreground">
            {tNav("tools")}
          </Link>
          <Link href="/learn" className="text-[13.5px] text-foreground/75 transition-colors hover:text-foreground">
            {tNav("learn")}
          </Link>
          <Link href="/news" className="text-[13.5px] text-foreground/75 transition-colors hover:text-foreground">
            {tNav("news")}
          </Link>
          <Link href="/pricing" className="text-[13.5px] text-foreground/75 transition-colors hover:text-foreground">
            {tNav("pricing")}
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          {!isPending &&
            (session?.user ? (
              <>
                <SubscriptionBadge />
                <Link
                  href="/app"
                  className="ml-1 inline-flex h-9 items-center whitespace-nowrap rounded-full bg-[var(--accent-lime)] px-4 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-lime-foreground)] transition-transform hover:scale-[1.02]"
                >
                  {tNav("dashboard")}
                </Link>
              </>
            ) : (
              <Link
                href="/auth"
                className="ml-1 inline-flex h-9 items-center whitespace-nowrap rounded-full bg-[var(--accent-lime)] px-4 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-lime-foreground)] transition-transform hover:scale-[1.02]"
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
