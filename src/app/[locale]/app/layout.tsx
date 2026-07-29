"use client";

import "./app.css";

import { Sidebar } from "@/components/app/Sidebar";
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
        {/* `viq-app` scopes the workspace stylesheet. Every token, surface and
            primitive under /app resolves from app.css, not the marketing sheet. */}
        <div className="viq-app app-page relative min-h-screen">
          <OnboardingCheck />

          {/* Flat page plane. No gradient wash: depth comes from surface value. */}
          <div className="app-page fixed inset-0 -z-10" />

          <Sidebar />

          <main className="lg:pl-56">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              {children}
            </div>
          </main>

          <Toaster />
        </div>
      </CurrencyProvider>
    </UserProvider>
  );
}
