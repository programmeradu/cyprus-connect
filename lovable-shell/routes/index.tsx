import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vuneli — Trustworthy carbon numbers for Cyprus SMEs" },
      { name: "description", content: "Vuneli measures how far a small company's carbon figure can be trusted, and tightens it with every document." },
      { property: "og:title", content: "Vuneli — Trustworthy carbon numbers for Cyprus SMEs" },
      { property: "og:description", content: "Calibrated per-firm emissions ranges that shrink as evidence arrives." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <div style={{ maxWidth: "40rem" }}>
        <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", lineHeight: 1.05, margin: 0 }}>Vuneli</h1>
        <p style={{ fontSize: "1.15rem", lineHeight: 1.6, opacity: 0.85 }}>
          The full site lives at{" "}
          <a href="https://vuneli.com" style={{ color: "#c8e86a" }}>vuneli.com</a>.
        </p>
      </div>
    </main>
  );
}
