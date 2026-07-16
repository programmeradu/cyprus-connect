import { createFileRoute } from "@tanstack/react-router";

/**
 * The production site is the Next.js app under src/app/[locale].
 * This TanStack route only exists to satisfy the Lovable preview shell;
 * we redirect to the real deployed site.
 */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      window.location.replace("https://verdeiq.stauniverse.tech/");
    }
  },
  component: () => (
    <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: 32, fontFamily: "system-ui" }}>
      <a href="https://verdeiq.stauniverse.tech/">Open VerdeIQ →</a>
    </div>
  ),
});
