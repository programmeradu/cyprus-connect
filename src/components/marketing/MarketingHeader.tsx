"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SubscriptionBadge } from "@/components/billing/SubscriptionBadge";

/**
 * MarketingHeader — wordmark anchored top-left, floating "dynamic island" pill
 * centered with nav + controls. Transparent over hero, gains glass on scroll.
 */
export function MarketingHeader() {
  const { data: session, isPending } = useSession();
  const tNav = useTranslations("nav");
  const tHero = useTranslations("hero");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="group/header pointer-events-none fixed inset-x-0 top-4 z-50 px-4 sm:top-6 sm:px-6"
      style={{ fontFamily: "var(--editorial-sans)" }}
      data-over-hero={!scrolled}
    >
      {/* Wordmark — free-standing top-left. Over the hero photo it stays white
          (photo always carries a dark scrim). Once scrolled past the hero it
          adopts the theme's foreground color. */}
      <Link
        href="/"
        className={[
          "pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 text-[20px] font-semibold tracking-[-0.03em] transition-colors duration-300 sm:left-8",
          scrolled ? "text-foreground" : "text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.55),0_2px_18px_rgba(0,0,0,0.35)]",
        ].join(" ")}
        style={{ fontFamily: "var(--editorial-display)" }}
      >
        Vuneli
      </Link>

      {/* Dynamic-island pill — centered, fits its content.
          Over the hero: true frosted glass (no white wash), light text.
          Scrolled: subtle tinted glass that respects the theme background. */}
      <div className="flex justify-center">
        <div
          className={[
            "pointer-events-auto flex items-center gap-1 rounded-full border px-2 py-1.5 transition-all duration-300",
            scrolled
              ? "border-foreground/10 bg-background/70 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.22)] backdrop-blur-2xl backdrop-saturate-150 [text-shadow:none]"
              : "border-white/25 bg-white/10 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.45)] backdrop-blur-2xl backdrop-saturate-200 dark:border-white/15 dark:bg-white/[0.06]",
          ].join(" ")}
        >
          <nav className="hidden items-center md:flex">
            <Link href="/tools" className={["rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors", scrolled ? "text-foreground/80 hover:text-foreground" : "text-white/90 hover:text-white"].join(" ")}>
              {tNav("tools")}
            </Link>
            <Link href="/learn" className={["rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors", scrolled ? "text-foreground/80 hover:text-foreground" : "text-white/90 hover:text-white"].join(" ")}>
              {tNav("learn")}
            </Link>
            <Link href="/news" className={["rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors", scrolled ? "text-foreground/80 hover:text-foreground" : "text-white/90 hover:text-white"].join(" ")}>
              {tNav("news")}
            </Link>
            <Link href="/pricing" className={["rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors", scrolled ? "text-foreground/80 hover:text-foreground" : "text-white/90 hover:text-white"].join(" ")}>
              {tNav("pricing")}
            </Link>
          </nav>

          <span aria-hidden className={["mx-1 hidden h-4 w-px md:block", scrolled ? "bg-foreground/10" : "bg-white/25"].join(" ")} />

          <div className="relative flex shrink-0 items-center gap-0.5">
            <LanguageSwitcher />
            <ThemeToggle />

            {!isPending &&
              (session?.user ? (
                <>
                  <SubscriptionBadge />
                  <Link
                    href="/app"
                    className="ml-1 inline-flex h-9 items-center whitespace-nowrap rounded-full bg-[var(--accent-lime)] px-4 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-[var(--accent-lime-foreground)] transition-transform hover:scale-[1.02]"
                  >
                    {tNav("dashboard")}
                  </Link>
                </>
              ) : (
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
      </div>
    </header>
  );
}

export default MarketingHeader;
