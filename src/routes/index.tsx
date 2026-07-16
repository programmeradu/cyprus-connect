import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: ({ location }) => {
    // Prefer Greek for el-CY visitors; default to English otherwise.
    let target: "en" | "el" = "en";
    if (typeof navigator !== "undefined") {
      const langs = (navigator.languages ?? [navigator.language ?? ""]).join(",").toLowerCase();
      if (/\bel\b/.test(langs)) target = "el";
    }
    throw redirect({ to: "/$locale", params: { locale: target }, search: location.search });
  },
  component: () => null,
});
