import { createFileRoute } from "@tanstack/react-router";

const PRODUCTION_URL = "https://verdeiq.stauniverse.tech";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        background:
          "radial-gradient(1200px 600px at 15% 10%, #0f3d2e 0%, transparent 60%), radial-gradient(1000px 500px at 85% 90%, #1a5a3e 0%, transparent 55%), #06110c",
        color: "#f4f1e8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(24px, 6vw, 80px)",
      }}
    >
      <section style={{ maxWidth: 780 }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "#8fbf9f",
            marginBottom: 24,
          }}
        >
          00 / VerdeIQ
        </div>
        <h1
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(2.5rem, 6vw, 4.75rem)",
            lineHeight: 1.02,
            margin: 0,
            fontWeight: 400,
            letterSpacing: "0",
          }}
        >
          Sustainability, made operational.
        </h1>
        <p
          style={{
            marginTop: 28,
            fontSize: "clamp(1.05rem, 1.6vw, 1.25rem)",
            lineHeight: 1.55,
            color: "#c9d4c8",
            maxWidth: 560,
          }}
        >
          AI-native carbon tracking, CSRD-ready reports, and real-time insights
          for the small and medium businesses shaping tomorrow's economy.
        </p>
        <div style={{ marginTop: 40, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <a
            href={PRODUCTION_URL}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "14px 28px",
              background: "#f4f1e8",
              color: "#06110c",
              borderRadius: 999,
              textDecoration: "none",
              fontWeight: 600,
              letterSpacing: "0.01em",
            }}
          >
            Enter VerdeIQ →
          </a>
        </div>
        <div
          style={{
            marginTop: 64,
            paddingTop: 24,
            borderTop: "1px solid rgba(244,241,232,0.12)",
            fontSize: 13,
            color: "#7d8f7f",
          }}
        >
          Production app:{" "}
          <a
            href={PRODUCTION_URL}
            style={{ color: "#c9d4c8", textDecoration: "underline" }}
          >
            verdeiq.stauniverse.tech
          </a>
        </div>
      </section>
    </main>
  );
}