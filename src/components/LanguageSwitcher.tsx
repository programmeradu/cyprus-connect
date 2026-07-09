"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
const FLAG: Record<"en" | "el", string> = {
  en: "🇬🇧",
  el: "🇬🇷",
};

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const t = useTranslations("language");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: "en" | "el") => {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full border border-border/60 bg-background/70 backdrop-blur p-0.5 ${className}`}
      role="group"
      aria-label={t("label")}
    >
      {(["en", "el"] as const).map((lng) => {
        const active = lng === locale;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => switchTo(lng)}
            disabled={isPending}
            aria-pressed={active}
            aria-label={t(lng)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors whitespace-nowrap ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span aria-hidden className="text-sm leading-none">{FLAG[lng]}</span>
            {lng === "en" ? "EN" : "EL"}
          </button>
        );
      })}

    </div>
  );
}
