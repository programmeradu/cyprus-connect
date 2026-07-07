"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/lib/user-context";

export function OnboardingCheck() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useUser();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Skip check if already on onboarding page
    if (pathname === "/app/onboarding") return;
    
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

    // If localStorage doesn't have the flag, check database
    if (user) {
      if (user.onboardingCompleted) {
        // Sync localStorage with database
        localStorage.setItem("onboarding_completed", "true");
        return;
      } else {
        // User hasn't completed onboarding in database - redirect
        router.push("/app/onboarding");
      }
    } else {
      // No user data loaded - redirect to onboarding
      router.push("/app/onboarding");
    }
  }, [pathname, router, isLoading]);

  return null;
}