"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import {
  CONSENT_STORAGE_KEY,
  clearConsent as clearConsentState,
  setConsent,
} from "@/lib/consent";

type Consent = "accepted" | "necessary";

const COPY = {
  en: {
    title: "We value your privacy",
    body: "Vuneli uses strictly-necessary cookies to keep you signed in and remember your language. With your consent we also use analytics cookies to improve the product. You can change your choice any time from the footer.",
    accept: "Accept all",
    necessary: "Necessary only",
    manage: "Privacy Policy",
  },
  el: {
    title: "Σεβόμαστε την ιδιωτικότητά σας",
    body: "Το Vuneli χρησιμοποιεί απολύτως απαραίτητα cookies για ταυτοποίηση και γλώσσα. Με τη συγκατάθεσή σας χρησιμοποιούμε επίσης analytics cookies για βελτίωση του προϊόντος. Μπορείτε να αλλάξετε την επιλογή σας οποτεδήποτε από το footer.",
    accept: "Αποδοχή όλων",
    necessary: "Μόνο τα απαραίτητα",
    manage: "Πολιτική Απορρήτου",
  },
} as const;

export function CookieBanner() {
  const locale = (useLocale() as "en" | "el") ?? "en";
  const pathname = usePathname();
  const t = COPY[locale] ?? COPY.en;
  const [visible, setVisible] = useState(false);
  const appPath = pathname?.replace(/^\/(en|el)(?=\/|$)/, "") ?? pathname ?? "";
  const isAppRoute = appPath === "/app" || appPath.startsWith("/app/");

  useEffect(() => {
    if (isAppRoute) {
      setVisible(false);
      return;
    }

    try {
      if (!localStorage.getItem(CONSENT_STORAGE_KEY)) setVisible(true);
    } catch {
      /* storage unavailable */
    }
    const handler = () => setVisible(true);
    window.addEventListener("vuneli:open-cookie-banner", handler);
    return () => window.removeEventListener("vuneli:open-cookie-banner", handler);
  }, [isAppRoute]);

  const choose = (c: Consent) => {
    setConsent(c);
    setVisible(false);
  };

  if (isAppRoute || !visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t.title}
      className="fixed bottom-4 left-4 right-4 z-50 md:left-6 md:right-auto md:bottom-6 md:max-w-[420px]"
      style={{ fontFamily: "var(--editorial-sans)" }}
    >
      <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-background/85 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-background/70">
        <div className="px-5 pt-5 pb-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-lime)]" aria-hidden />
            <p
              className="text-[15px] font-semibold tracking-[-0.01em] text-foreground"
              style={{ fontFamily: "var(--editorial-display)" }}
            >
              {t.title}
            </p>
          </div>
          <p className="text-[13px] leading-[1.55] text-foreground/70">
            {t.body}{" "}
            <a
              href={`/${locale}/privacy`}
              className="text-foreground underline decoration-foreground/30 underline-offset-2 transition-colors hover:decoration-foreground"
            >
              {t.manage}
            </a>
            .
          </p>
        </div>
        <div className="flex items-stretch border-t border-foreground/10">
          <button
            type="button"
            onClick={() => choose("necessary")}
            className="flex-1 px-4 py-3 text-[12.5px] font-medium text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            {t.necessary}
          </button>
          <div className="w-px bg-foreground/10" aria-hidden />
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="flex-1 px-4 py-3 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-lime-foreground)] bg-[var(--accent-lime)] transition-transform hover:scale-[1.005]"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}

export function reopenCookieBanner() {
  clearConsentState();
  window.dispatchEvent(new Event("vuneli:open-cookie-banner"));
}
