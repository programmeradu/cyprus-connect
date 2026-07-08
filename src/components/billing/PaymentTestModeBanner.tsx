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
        className="w-full bg-red-100 border-b border-red-300 px-4 py-2 text-center text-sm text-red-800"
        role="status"
      >
        Production checkout is not configured. Complete Stripe go-live in your
        Lovable project to accept real payments.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div
        className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-sm text-orange-800"
        role="status"
      >
        Preview / test mode — no real charges. Use card{" "}
        <code className="font-mono">4242 4242 4242 4242</code>, any future
        expiry, any CVC.{" "}
        <a
          href="https://docs.lovable.dev/features/payments#test-and-live-environments"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium"
        >
          Learn more
        </a>
      </div>
    );
  }
  return null;
}
