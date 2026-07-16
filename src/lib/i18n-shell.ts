// i18n for the TanStack landing shell (Lovable preview / publish only).
// The Next.js production site under src/app/ keeps using next-intl.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../../messages/en.json";
import el from "../../messages/el.json";

export type ShellLocale = "en" | "el";

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en as Record<string, unknown> },
      el: { translation: el as Record<string, unknown> },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;
