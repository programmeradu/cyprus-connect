import type { NextRequest } from "next/server";

export const BANK_STATE_COOKIE = "boc_link";
export const BANK_CALLBACK_PATH = "/api/console/bank/callback";

/**
 * The address the bank sends the customer back to. It must match, exactly,
 * the redirect URL registered on the Bank of Cyprus developer app, so it can
 * be pinned with BOC_REDIRECT_URI; otherwise it follows the site the request
 * came from.
 */
export function bankRedirectUri(request: NextRequest): string {
  return process.env.BOC_REDIRECT_URI || `${request.nextUrl.origin}${BANK_CALLBACK_PATH}`;
}
