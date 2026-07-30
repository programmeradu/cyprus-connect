"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/legal/SiteFooter";
import { FloatingAIAssistant } from "@/components/ai/FloatingAIAssistant";

/**
 * Renders the global footer and floating assistant, except on focused
 * single-frame screens such as /auth where they would force scrolling.
 */
export function GlobalChrome() {
  const pathname = usePathname() || "";
  const isFocusedScreen =
    /^\/(en|el)\/auth(\/|$)/.test(pathname) ||
    pathname === "/auth" ||
    /^\/(en|el)\/lab(\/|$)/.test(pathname) ||
    pathname.startsWith("/lab");
  // The authenticated workspace has its own chrome; the marketing footer
  // must never appear inside /app.
  const isWorkspace = /^\/(en|el)\/app(\/|$)/.test(pathname) || pathname === "/app" || pathname.startsWith("/app/");

  if (isFocusedScreen) return null;

  return (
    <>
      {!isWorkspace && <SiteFooter />}
      <FloatingAIAssistant />
    </>
  );
}
