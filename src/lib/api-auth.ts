/**
 * Binds an API request to the signed-in account.
 *
 * Older routes accepted `userId` from the query string, the body or the path
 * and trusted it, so any caller could read or change another account. Every
 * such route now calls `bindSessionUser`: the account always comes from the
 * session, and a request that names a different account is refused.
 */

import { NextResponse } from "next/server";
import { requireVuneliUserId } from "@/lib/auth";
import { QA_ACCOUNT, QA_COOKIE, QA_HEADER, isQaRequest } from "@/lib/qa-bypass";

export type BoundUser =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

function readCookie(headers: Headers, name: string): string | null {
  const raw = headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

/** Pure decision, exported for tests. */
export function decideBinding(sessionUserId: string | null, claimed: unknown): BoundUser {
  if (!sessionUserId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Please sign in.", code: "UNAUTHENTICATED" },
        { status: 401 },
      ),
    };
  }
  const claimedId = typeof claimed === "string" ? claimed.trim() : claimed == null ? "" : String(claimed);
  if (claimedId && claimedId !== sessionUserId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You can only access your own account.", code: "FORBIDDEN" },
        { status: 403 },
      ),
    };
  }
  return { ok: true, userId: sessionUserId };
}

export async function bindSessionUser(
  request: { headers: Headers },
  claimedUserId?: unknown,
): Promise<BoundUser> {
  const qa = isQaRequest({
    cookie: readCookie(request.headers, QA_COOKIE),
    header: request.headers.get(QA_HEADER),
  });
  const sessionUserId = qa ? QA_ACCOUNT.id : await requireVuneliUserId(request.headers);
  return decideBinding(sessionUserId, claimedUserId);
}
