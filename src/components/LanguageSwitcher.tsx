"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

/**
 * Minimal single-button language switcher.
 * Shows the current locale as a compact 2-letter label; click toggles to the other.
 */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
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
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold tracking-[0.02em] text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground ${className}`}
    >
      {locale.toUpperCase()}
    </button>
  );
}
