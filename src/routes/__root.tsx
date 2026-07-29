import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Vuneli — AI-Powered Sustainability for SMEs" },
      {
        name: "description",
        content:
          "Track, optimize, and report environmental impact with Vuneli's AI-native sustainability platform for small and medium businesses in Cyprus and the EU.",
      },
      { property: "og:title", content: "Vuneli — AI-Powered Sustainability" },
      {
        property: "og:description",
        content:
          "AI-native carbon tracking, CSRD-ready reporting, and real-time sustainability insights for SMEs.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Vuneli" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  shellComponent: RootShell,
  notFoundComponent: NotFound,
});

function RootShell() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: 32, textAlign: "center" }}>
      <div>
        <h1 style={{ fontSize: 32, margin: 0 }}>Page not found</h1>
        <p style={{ marginTop: 12, opacity: 0.7 }}>
          <a href="/en">Go to homepage</a> · <a href="https://vuneli.com">Open the app</a>
        </p>
      </div>
    </div>
  );
}
