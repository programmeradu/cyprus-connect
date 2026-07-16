import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PremiumButton } from "@/components/shell/PremiumButton";
import { LanguageSwitcher } from "@/components/shell/LanguageSwitcher";
import { ThemeToggle } from "@/components/shell/ThemeToggle";

const PROD = "https://verdeiq.stauniverse.tech";

export function MarketingNav({ locale }: { locale: "en" | "el" }) {
  const { t } = useTranslation();
  const nav = (k: string) => t(`nav.${k}`);
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          to="/$locale"
          params={{ locale }}
          className="text-lg font-bold tracking-[-0.02em] text-foreground font-[family-name:var(--editorial-serif)]"
        >
          VerdeIQ
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <a href={`${PROD}/${locale}/tools`} className="text-sm text-foreground/80 hover:text-foreground">{nav("tools")}</a>
          <a href={`${PROD}/${locale}/learn`} className="text-sm text-foreground/80 hover:text-foreground">{nav("learn")}</a>
          <a href={`${PROD}/${locale}/news`} className="text-sm text-foreground/80 hover:text-foreground">{nav("news")}</a>
        </nav>
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher />
          <ThemeToggle />
          <a href={`${PROD}/${locale}/pricing`} className="hidden sm:inline">
            <PremiumButton variant="outline" size="sm" className="text-xs">{nav("pricing")}</PremiumButton>
          </a>
          <a href={`${PROD}/${locale}/auth`}>
            <PremiumButton size="sm" className="text-xs">{nav("signIn")}</PremiumButton>
          </a>
        </div>
      </div>
    </header>
  );
}
