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

      {/* Top-right CTA — always visible, adapts to hero vs scrolled */}
      {!isPending && (
        <div className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 sm:right-8">
          {session?.user ? (
            <div className="flex items-center gap-2">
              <SubscriptionBadge />
              <Link
                href="/app"
                className="inline-flex h-9 items-center whitespace-nowrap rounded-full bg-[var(--accent-lime)] px-4 text-[15px] font-semibold tracking-[-0.01em] text-[var(--accent-lime-foreground)] shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--accent-lime)_55%,transparent)] transition-transform hover:scale-[1.02]"
                style={{ fontFamily: "var(--editorial-display)" }}
              >
                {tNav("dashboard")}
              </Link>
            </div>
          ) : (
            <Link
              href="/auth"
              className="inline-flex h-9 items-center whitespace-nowrap rounded-full bg-[var(--accent-lime)] px-4 text-[15px] font-semibold tracking-[-0.01em] text-[var(--accent-lime-foreground)] shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--accent-lime)_55%,transparent)] transition-transform hover:scale-[1.02]"
              style={{ fontFamily: "var(--editorial-display)" }}
            >
              {tHero("ctaPrimary")}
            </Link>
          )}
        </div>
      )}

      {/* Envirogen-style solid dark pill — smooth, opaque, always-on */}
      <div className="flex justify-center">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/25 px-3 py-2 ring-1 ring-white/10 backdrop-blur-xl backdrop-saturate-150">
          <nav className="hidden items-center md:flex">
            <Link href="/tools" className="rounded-full px-4 py-1.5 text-[14px] font-medium text-white/85 transition-colors hover:text-white">
              {tNav("tools")}
            </Link>
            <Link href="/learn" className="rounded-full px-4 py-1.5 text-[14px] font-medium text-white/85 transition-colors hover:text-white">
              {tNav("learn")}
            </Link>
            <Link href="/vision" className="rounded-full px-4 py-1.5 text-[14px] font-medium text-white/85 transition-colors hover:text-white">
              {tNav("vision")}
            </Link>
            <Link href="/news" className="rounded-full px-4 py-1.5 text-[14px] font-medium text-white/85 transition-colors hover:text-white">
              {tNav("news")}
            </Link>
            <Link href="/pricing" className="rounded-full px-4 py-1.5 text-[14px] font-medium text-white/85 transition-colors hover:text-white">
              {tNav("pricing")}
            </Link>
          </nav>

          <span aria-hidden className="mx-1 hidden h-4 w-px bg-white/15 md:block" />

          <div className="flex shrink-0 items-center gap-0.5">
            <LanguageSwitcher overHero />
            <ThemeToggle overHero />
          </div>
        </div>
      </div>
    </header>
  );
}

export default MarketingHeader;
