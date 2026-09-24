"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useUser } from "@/lib/user-context";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
import { isQaClient } from "@/lib/qa-bypass";

export function OnboardingCheck() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useUser();
  const hasChecked = useRef(false);

  useEffect(() => {
    // TEMPORARY: open access mode skips the onboarding gate entirely.
    if (APP_OPEN_ACCESS) return;

    // Preview-only QA back door: no account, so no onboarding gate.
    if (isQaClient()) return;

    // Skip check if already on onboarding page
    if (pathname === "/app/onboarding" || pathname.endsWith("/app/onboarding")) return;
    
    // Skip check if we've already checked once
    if (hasChecked.current) return;


    // Skip check if still loading
    if (isLoading) return;

    // Mark as checked immediately to prevent multiple checks
    hasChecked.current = true;

    // Check localStorage first - if it says completed, trust it immediately
    const localStorageCompleted = localStorage.getItem("onboarding_completed");
    
    if (localStorageCompleted === "true") {
      // User has completed onboarding according to localStorage
      return;
    }

    // Only redirect when the account is loaded AND the database says setup
    // is not finished. A missing user means sign-in is still resolving or has
    // failed; the auth gate owns that case, so we never redirect on it (this
    // was the cause of the earlier /auth <-> /app loop).
    if (!user) {
      hasChecked.current = false;
      return;
    }
    if (user.onboardingCompleted) {
      localStorage.setItem("onboarding_completed", "true");
      return;
    }
    router.replace("/app/onboarding");
  }, [pathname, router, isLoading, user]);

  return null;
}