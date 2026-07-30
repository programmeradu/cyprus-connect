"use client";

import "./app.css";
import "./console.css";
import "./console-deck.css";
import "./console-kit.css";

import { ConsoleChrome } from "@/components/app/console/ConsoleChrome";
import { ConsoleDataProvider } from "@/components/app/console/ConsoleData";
import { OnboardingCheck } from "@/components/app/OnboardingCheck";
import { UserProvider } from "@/lib/user-context";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <CurrencyProvider>
        <ConsoleDataProvider>
          {/* `viq-app` scopes the workspace stylesheet; `vc` scopes the console
              tokens. Both light and dark modes are authored separately. */}
          <div className="viq-app vc vc-shell relative min-h-screen">
            <OnboardingCheck />

            <ConsoleChrome />

            <main>{children}</main>

            <Toaster />
          </div>
        </ConsoleDataProvider>
      </CurrencyProvider>
    </UserProvider>
  );
}
