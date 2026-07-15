import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import path from "node:path";

// Vite / TanStack Start shell used ONLY by Lovable Publish (lovable.app).
// The real production app is Next.js and is deployed via Netlify
// (see netlify.toml). This build intentionally serves a minimal marketing
// landing so lovable.app has content instead of 404.
export default defineConfig({
  server: { port: 8080 },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  plugins: [
    tanstackStart({
      // `customViteReactPlugin` is accepted at runtime but not typed in the
      // installed schema; cast the options object to keep TS happy while we
      // explicitly own the React plugin below.
      ...({ customViteReactPlugin: true } as Record<string, unknown>),
    }),
    viteReact(),
  ],
});
