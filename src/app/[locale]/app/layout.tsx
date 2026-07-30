"use client";

import "./app.css";
import "./console.css";
import "./console-deck.css";

import { ConsoleRail } from "@/components/app/console/ConsoleRail";
import { OnboardingCheck } from "@/components/app/OnboardingCheck";
import { UserProvider } from "@/lib/user-context";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { Toaster } from "@/components/ui/sonner";
import { usePathname } from "@/i18n/navigation";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/^\/(en|el)(?=\/|$)/, "") || "/";
  const isConsoleOverview = normalizedPath === "/app";

  return (
    <UserProvider>
      <CurrencyProvider>
        {/* `viq-app` scopes the workspace stylesheet; `vc` scopes the console
            tokens. Both light and dark modes are authored separately. */}
        <div className="viq-app vc vc-shell relative min-h-screen">
          <OnboardingCheck />

          {!isConsoleOverview && <ConsoleRail />}

          <main className={isConsoleOverview ? undefined : "lg:pl-[212px]"}>{children}</main>

          <Toaster />
        </div>
      </CurrencyProvider>
    </UserProvider>
  );
}
