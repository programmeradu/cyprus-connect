"use client";

/**
 * Renders a banner at the top of any payments page so preview users see
 * they're in test mode. Hidden in live mode with a valid token; shows a
 * red "not configured" banner when the token is missing (project published
 * before Stripe go-live finished).
 */
const clientToken =
  process.env.NEXT_PUBLIC_PAYMENTS_CLIENT_TOKEN ||
  process.env.VITE_PAYMENTS_CLIENT_TOKEN;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div
        className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-center text-sm font-medium text-amber-900 dark:text-amber-200"
        role="status"
      >
        Billing is currently in private preview for Cyprus pilot enterprises. Reach out to advisors to activate your tier.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div
        className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-center text-sm font-medium text-amber-900 dark:text-amber-200"
        role="status"
      >
        Preview / test billing mode active for Cyprus pilot enterprises. Reach out to advisors to configure production settlements.
      </div>
    );
  }
  return null;
}
