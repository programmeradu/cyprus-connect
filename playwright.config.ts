import { defineConfig } from "@playwright/test";

// Accessibility, keyboard and offline checks on the /app pages (e2e/).
// Runs against a dev or preview server; signs in with the QA identity, which
// only exists outside production builds. BASE_URL defaults to the local dev server.
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  retries: 0,
  workers: 2,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:8080",
    viewport: { width: 1280, height: 900 },
  },
});
