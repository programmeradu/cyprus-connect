"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import { Globe } from "lucide-react";

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
      className={`inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/70 backdrop-blur px-1 py-0.5 ${className}`}
      role="group"
      aria-label={t("label")}
    >
      <Globe className="w-3.5 h-3.5 mx-1.5 text-muted-foreground shrink-0" aria-hidden />
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
            className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors whitespace-nowrap ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {lng === "en" ? "EN" : "EL"}
          </button>
        );
      })}
    </div>
  );
}
