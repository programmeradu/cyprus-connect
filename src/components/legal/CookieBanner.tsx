"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import {
  CONSENT_STORAGE_KEY,
  clearConsent as clearConsentState,
  setConsent,
} from "@/lib/consent";

type Consent = "accepted" | "necessary";

const COPY = {
  en: {
    title: "We value your privacy",
    body: "VerdeIQ uses strictly-necessary cookies to keep you signed in and remember your language. With your consent we also use analytics cookies to improve the product. You can change your choice any time from the footer.",
    accept: "Accept all",
    necessary: "Necessary only",
    manage: "Privacy Policy",
  },
  el: {
    title: "Σεβόμαστε την ιδιωτικότητά σας",
    body: "Το VerdeIQ χρησιμοποιεί απολύτως απαραίτητα cookies για ταυτοποίηση και γλώσσα. Με τη συγκατάθεσή σας χρησιμοποιούμε επίσης analytics cookies για βελτίωση του προϊόντος. Μπορείτε να αλλάξετε την επιλογή σας οποτεδήποτε από το footer.",
    accept: "Αποδοχή όλων",
    necessary: "Μόνο τα απαραίτητα",
    manage: "Πολιτική Απορρήτου",
  },
} as const;

export function CookieBanner() {
  const locale = (useLocale() as "en" | "el") ?? "en";
  const t = COPY[locale] ?? COPY.en;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_STORAGE_KEY)) setVisible(true);
    } catch {
      /* storage unavailable */
    }
    const handler = () => setVisible(true);
    window.addEventListener("verdeiq:open-cookie-banner", handler);
    return () => window.removeEventListener("verdeiq:open-cookie-banner", handler);
  }, []);

  const choose = (c: Consent) => {
    setConsent(c);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t.title}
      className="fixed bottom-3 left-3 right-3 md:left-6 md:right-auto md:max-w-md z-50 rounded-xl border border-border/70 bg-background/95 backdrop-blur shadow-xl p-4 md:p-5"
    >
      <p className="text-sm font-semibold mb-1.5">{t.title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        {t.body}{" "}
        <a
          href={`/${locale}/privacy`}
          className="underline hover:text-foreground"
        >
          {t.manage}
        </a>
        .
      </p>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => choose("necessary")}
          className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
        >
          {t.necessary}
        </button>
        <button
          type="button"
          onClick={() => choose("accepted")}
          className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t.accept}
        </button>
      </div>
    </div>
  );
}

export function reopenCookieBanner() {
  clearConsentState();
  window.dispatchEvent(new Event("verdeiq:open-cookie-banner"));
}
