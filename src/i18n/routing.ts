import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "el"] as const,
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: true,
  // Page metadata emits the correct hreflang set (en, el-CY, x-default).
  // The middleware Link header added a conflicting "el" and a redirecting x-default.
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];
