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
  const [menuOpen, setMenuOpen] = useState(false);

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

      {/* Top-right CTA — desktop only; on mobile it lives in the menu sheet */}
      {!isPending && (
        <div className="pointer-events-auto absolute right-4 top-1/2 hidden -translate-y-1/2 md:block sm:right-8">
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

      {/* Mobile controls — right-aligned glass pill, never overlaps the wordmark */}
      <div className="pointer-events-auto absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-full bg-black/25 px-1.5 py-1.5 ring-1 ring-white/10 backdrop-blur-xl backdrop-saturate-150 md:hidden">
        <LanguageSwitcher overHero />
        <ThemeToggle overHero />
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="grid h-8 w-8 place-items-center rounded-full text-white/85 transition-colors hover:text-white"
        >
          <span className="relative block h-[10px] w-[16px]">
            <span
              className={[
                "absolute left-0 block h-[1.5px] w-full bg-current transition-transform duration-300",
                menuOpen ? "top-[4px] rotate-45" : "top-0",
              ].join(" ")}
            />
            <span
              className={[
                "absolute left-0 block h-[1.5px] w-full bg-current transition-transform duration-300",
                menuOpen ? "top-[4px] -rotate-45" : "top-[9px]",
              ].join(" ")}
            />
          </span>
        </button>
      </div>

      {/* Desktop nav pill */}
      <div className="hidden justify-center md:flex">
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

      {/* Mobile sheet */}
      {menuOpen && (
        <div className="pointer-events-auto absolute inset-x-4 top-[calc(100%+0.75rem)] overflow-hidden rounded-3xl bg-black/55 p-2 ring-1 ring-white/12 backdrop-blur-2xl backdrop-saturate-150 md:hidden">
          <nav className="flex flex-col">
            {[
              { href: "/tools", label: tNav("tools") },
              { href: "/learn", label: tNav("learn") },
              { href: "/vision", label: tNav("vision") },
              { href: "/news", label: tNav("news") },
              { href: "/pricing", label: tNav("pricing") },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl px-4 py-3 text-[16px] font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {(
            <Link
              href={session?.user ? "/app" : "/auth"}
              onClick={() => setMenuOpen(false)}
              className="mt-2 flex h-11 w-full items-center justify-center rounded-2xl bg-[var(--accent-lime)] text-[16px] font-semibold text-[var(--accent-lime-foreground)]"
              style={{ fontFamily: "var(--editorial-display)" }}
            >
              {session?.user ? tNav("dashboard") : tHero("ctaPrimary")}
            </Link>
          )}
        </div>
      )}
    </header>

  );
}

export default MarketingHeader;
