"use client";

import "./console.css";
import "./console-deck.css";
import "./console-kit.css";
import "./console-copilot.css";
import "./console-home.css";

import { useLocale } from "next-intl";
import { ConsoleChrome } from "@/components/app/console/ConsoleChrome";
import { SectionTabs } from "@/components/app/console/SectionTabs";
import { ConsoleDataProvider } from "@/components/app/console/ConsoleData";
import { UserProvider } from "@/lib/user-context";
import { OnboardingCheck } from "@/components/app/OnboardingCheck";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();

  return (
    <UserProvider>
      <ConsoleDataProvider>
        {/* `viq-app` scopes the workspace stylesheet; `vc` scopes the console
            tokens. Both light and dark modes are authored separately. */}
        <div className="viq-app vc vc-shell relative min-h-screen">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md focus:shadow-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm font-medium"
          >
            {locale === "el" ? "Μετάβαση στο περιεχόμενο" : "Skip to content"}
          </a>
          <OnboardingCheck />
          <ConsoleChrome />
          <SectionTabs />

          <main id="main-content" tabIndex={-1} className="outline-none">
            {children}
          </main>
        </div>
      </ConsoleDataProvider>
    </UserProvider>
  );
}
