import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VerdeIQ — AI-Powered Sustainability for SMEs" },
      {
        name: "description",
        content:
          "Track, optimize, and report your environmental impact effortlessly. VerdeIQ turns compliance into competitive advantage for small and medium businesses.",
      },
      { property: "og:title", content: "VerdeIQ — AI-Powered Sustainability" },
      {
        property: "og:description",
        content:
          "Turn ESG compliance into competitive advantage with AI-native carbon tracking, reporting, and insights.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "icon", href: "/favicon.ico" }],
  }),
  shellComponent: RootShell,
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
