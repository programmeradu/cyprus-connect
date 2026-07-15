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
          "Track, optimize, and report environmental impact with VerdeIQ's AI-native sustainability platform for small and medium businesses.",
      },
      { property: "og:title", content: "VerdeIQ — AI-Powered Sustainability" },
      {
        property: "og:description",
        content:
          "AI-native carbon tracking, CSRD-ready reporting, and real-time sustainability insights for SMEs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
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