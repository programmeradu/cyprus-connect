"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { reopenCookieBanner } from "./CookieBanner";

const COPY = {
  en: {
    tagline: "AI-powered sustainability for SMEs in Cyprus & the EU.",
    product: "Product",
    home: "Home",
    pricing: "Pricing",
    learn: "Learn",
    legal: "Legal",
    privacy: "Privacy",
    terms: "Terms",
    security: "Security",
    dpa: "DPA",
    company: "Company",
    contact: "Contact",
    cookies: "Cookie settings",
    rights: "All rights reserved.",
    based: "Verde IQ · Strovolos, Cyprus",
  },
  el: {
    tagline: "Βιωσιμότητα με AI για ΜμΕ σε Κύπρο και ΕΕ.",
    product: "Προϊόν",
    home: "Αρχική",
    pricing: "Τιμές",
    learn: "Μάθετε",
    legal: "Νομικά",
    privacy: "Απόρρητο",
    terms: "Όροι",
    security: "Ασφάλεια",
    dpa: "DPA",
    company: "Εταιρεία",
    contact: "Επικοινωνία",
    cookies: "Ρυθμίσεις cookies",
    rights: "Με επιφύλαξη κάθε νόμιμου δικαιώματος.",
    based: "Verde IQ · Στρόβολος, Κύπρος",
  },
} as const;

export function SiteFooter() {
  const locale = (useLocale() as "en" | "el") ?? "en";
  const t = COPY[locale] ?? COPY.en;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-background/60 backdrop-blur mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <p
            className="gradient-text text-lg font-bold tracking-tight mb-2"
          >
            VerdeIQ
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
            {t.tagline}
          </p>
          <p className="text-[11px] text-muted-foreground/80 mt-3">{t.based}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {t.product}
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href={`/${locale}`} className="text-foreground/80 hover:text-foreground">
                {t.home}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/pricing`} className="text-foreground/80 hover:text-foreground">
                {t.pricing}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/tools`} className="text-foreground/80 hover:text-foreground">
                {locale === "el" ? "Εργαλεία" : "Tools"}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/learn`} className="text-foreground/80 hover:text-foreground">
                {t.learn}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {t.legal}
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href={`/${locale}/privacy`} className="text-foreground/80 hover:text-foreground">
                {t.privacy}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/terms`} className="text-foreground/80 hover:text-foreground">
                {t.terms}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/security`} className="text-foreground/80 hover:text-foreground">
                {t.security}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/dpa`} className="text-foreground/80 hover:text-foreground">
                {t.dpa}
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={reopenCookieBanner}
                className="text-foreground/80 hover:text-foreground underline-offset-2 hover:underline"
              >
                {t.cookies}
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <span>
            © {year} Verde IQ. {t.rights}
          </span>
          <a
            href="mailto:samuel@stauniverse.tech"
            className="hover:text-foreground"
          >
            samuel@stauniverse.tech
          </a>
        </div>
      </div>
    </footer>
  );
}
