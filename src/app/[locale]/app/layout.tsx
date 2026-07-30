"use client";

import "./app.css";
import "./console.css";

import { ConsoleRail } from "@/components/app/console/ConsoleRail";
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
        {/* `viq-app` scopes the workspace stylesheet; `vc` scopes the console
            tokens. Both light and dark modes are authored separately. */}
        <div className="viq-app vc vc-shell relative min-h-screen">
          <OnboardingCheck />

          <ConsoleRail />

          <main className="lg:pl-[212px]">{children}</main>

          <Toaster />
        </div>
      </CurrencyProvider>
    </UserProvider>
  );
}
