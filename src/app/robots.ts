import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://vuneli.com").replace(/\/$/, "");

const AI_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "Google-Extended",
  "SearchGPT",
  "Amazonbot",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "Bytespider",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  const commonDisallows = [
    "/api/",
    "/auth/",
    "/en/app/",
    "/el/app/",
    "/en/settings/",
    "/el/settings/",
    "/en/onboarding/",
    "/el/onboarding/",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: commonDisallows,
      },
      ...AI_USER_AGENTS.map((agent) => ({
        userAgent: agent,
        allow: "/",
        disallow: commonDisallows,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
