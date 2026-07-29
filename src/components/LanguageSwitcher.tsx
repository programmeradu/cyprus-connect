"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

function FlagGB({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <clipPath id="lsw-gb-c">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id="lsw-gb-t">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath="url(#lsw-gb-c)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#lsw-gb-t)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

function FlagGR({ className = "" }: { className?: string }) {
  const stripe = 30 / 9;
  return (
    <svg viewBox="0 0 45 30" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="45" height="30" fill="#0D5EAF" />
      {[1, 3, 5, 7].map((i) => (
        <rect key={i} y={i * stripe} width="45" height={stripe} fill="#fff" />
      ))}
      <rect width={stripe * 5} height={stripe * 5} fill="#0D5EAF" />
      <rect y={stripe * 2} width={stripe * 5} height={stripe} fill="#fff" />
      <rect x={stripe * 2} width={stripe} height={stripe * 5} fill="#fff" />
    </svg>
  );
}

const FLAGS: Record<"en" | "el", React.ComponentType<{ className?: string }>> = {
  en: FlagGB,
  el: FlagGR,
};


export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const t = useTranslations("language");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: "en" | "el") => {
    if (next === locale) return;
    const currentPath = typeof window !== "undefined" ? window.location.pathname : `/${locale}`;
    const stripped = currentPath.replace(/^\/(en|el)(?=\/|$)/, "") || "/";
    const target = `/${next}${stripped === "/" ? "" : stripped}`;
    const search = typeof window !== "undefined" ? window.location.search : "";
    if (typeof window !== "undefined") {
      window.location.assign(target + search);
    }
    // Silence unused when the typed router isn't consumed here.
    void router; void pathname; void startTransition;
  };

  return (
    <div
      className={`inline-flex h-11 items-center gap-0.5 rounded-full border border-foreground/15 bg-card/70 backdrop-blur p-1 ${className}`}
      role="group"
      aria-label={t("label")}
    >
      {(["en", "el"] as const).map((lng) => {
        const active = lng === locale;
        const FlagIcon = FLAGS[lng];
        return (

          <button
            key={lng}
            type="button"
            onClick={() => switchTo(lng)}
            disabled={isPending}
            aria-pressed={active}
            aria-label={t(lng)}
            className={`inline-flex items-center gap-1.5 h-full text-[13px] font-semibold px-3 rounded-full transition-colors whitespace-nowrap ${
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FlagIcon className="h-3.5 w-[20px] rounded-[1px] shrink-0 pointer-events-none" />
            {lng === "en" ? "EN" : "EL"}
          </button>
        );
      })}

    </div>
  );
}
