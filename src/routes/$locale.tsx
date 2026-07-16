import { Outlet, createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import i18n from "@/lib/i18n-shell";

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }) => {
    if (params.locale !== "en" && params.locale !== "el") {
      throw notFound();
    }
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  const { locale } = Route.useParams();
  // Set i18n language synchronously so SSR and first client render match.
  if (i18n.language !== locale) {
    void i18n.changeLanguage(locale);
  }
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);
  return <Outlet />;
}
