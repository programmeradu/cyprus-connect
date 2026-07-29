"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

/**
 * Minimal single-button language switcher.
 * Shows the current locale as a compact 2-letter label; click toggles to the other.
 */
export function LanguageSwitcher({ className = "", overHero = false }: { className?: string; overHero?: boolean }) {
  const t = useTranslations("language");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const next: "en" | "el" = locale === "en" ? "el" : "en";

  const switchTo = () => {
    const currentPath = typeof window !== "undefined" ? window.location.pathname : `/${locale}`;
    const stripped = currentPath.replace(/^\/(en|el)(?=\/|$)/, "") || "/";
    const target = `/${next}${stripped === "/" ? "" : stripped}`;
    const search = typeof window !== "undefined" ? window.location.search : "";
    if (typeof window !== "undefined") {
      window.location.assign(target + search);
    }
    void startTransition;
  };

  return (
    <button
      type="button"
      onClick={switchTo}
      disabled={isPending}
      aria-label={`${t("label")}: ${t(next)}`}
      title={t(next)}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold tracking-[0.02em] transition-colors",
        overHero
          ? "text-white/90 hover:text-white hover:bg-white/10 [text-shadow:0_1px_2px_rgba(0,0,0,0.55)]"
          : "text-foreground/70 hover:text-foreground hover:bg-foreground/5",
        className,
      ].join(" ")}
    >
      {locale.toUpperCase()}
    </button>
  );
}
