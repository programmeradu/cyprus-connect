import { createFileRoute } from "@tanstack/react-router";

const TARGET = "https://verdeiq.stauniverse.tech/";

/**
 * The production site is the Next.js app deployed at verdeiq.stauniverse.tech.
 * This TanStack route only exists to satisfy the Lovable preview shell;
 * redirect immediately with no interstitial UI.
 */
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VerdeIQ" },
      { name: "description", content: "VerdeIQ — Cyprus-native sustainability platform for SMEs." },
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
