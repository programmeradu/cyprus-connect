"use client";

import { useEffect, useState } from "react";

export const CONSENT_STORAGE_KEY = "vuneli_cookie_consent_v1";
export const CONSENT_CHANGED_EVENT = "vuneli:consent-changed";

export type ConsentChoice = "accepted" | "necessary" | null;

type Stored = { choice: "accepted" | "necessary"; at: string };

function readConsent(): ConsentChoice {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    return parsed.choice ?? null;
  } catch {
    return null;
  }
}

/** Persist and broadcast a cookie-consent choice. */
export function setConsent(choice: "accepted" | "necessary") {
  try {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ choice, at: new Date().toISOString() }),
    );
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: { choice } }));
}

/** Clear consent (used by "Cookie settings" to re-open the banner). */
export function clearConsent() {
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: { choice: null } }));
}

/** React hook — returns current consent + `accepted` boolean, reacts to changes. */
export function useCookieConsent() {
  const [choice, setChoice] = useState<ConsentChoice>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setChoice(readConsent());
    setHydrated(true);
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ choice: ConsentChoice }>).detail;
      setChoice(detail?.choice ?? readConsent());
    };
    window.addEventListener(CONSENT_CHANGED_EVENT, handler);
    // Cross-tab sync.
    const storage = (e: StorageEvent) => {
      if (e.key === CONSENT_STORAGE_KEY) setChoice(readConsent());
    };
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, handler);
      window.removeEventListener("storage", storage);
    };
  }, []);

  return {
    choice,
    accepted: choice === "accepted",
    hydrated,
  };
}
