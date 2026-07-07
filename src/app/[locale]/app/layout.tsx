"use client";

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
        <div className="relative min-h-screen">
          {/* Onboarding Check */}
          <OnboardingCheck />

          {/* Background */}
          <div className="fixed inset-0 -z-10 bg-background">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          </div>

          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
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