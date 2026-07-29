import { createFileRoute } from "@tanstack/react-router";

const TARGET = "https://vuneli.com/";

/**
 * The production site is the Next.js app deployed at vuneli.com.
 * This TanStack route only exists to satisfy the Lovable preview shell;
 * redirect immediately with no interstitial UI.
 */
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vuneli" },
      { name: "description", content: "Vuneli — Cyprus-native sustainability platform for SMEs." },
      { name: "robots", content: "noindex" },
      { httpEquiv: "refresh", content: `0; url=${TARGET}` },
    ],
    links: [{ rel: "canonical", href: TARGET }],
  }),
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      window.location.replace(TARGET);
    }
  },
  component: () => null,
});
