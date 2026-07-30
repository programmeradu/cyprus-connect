/**
 * One place that answers "whose workspace is this request for?".
 *
 * The overview route creates the workspace on first visit. Every other
 * console route only needs to resolve it, so this helper reads and never
 * writes. It honours the same QA identity as the overview route, so the
 * preview back door keeps working and still cannot touch customer data.
 */

import { db } from "@/db";
import { workspaces } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { QA_ACCOUNT, QA_COOKIE, QA_HEADER, isQaRequest } from "@/lib/qa-bypass";

export interface ConsoleSession {
  account: { id: string; name?: string | null; email?: string | null };
  workspace: typeof workspaces.$inferSelect;
}

export type ConsoleSessionResult =
  | { ok: true; session: ConsoleSession }
  | { ok: false; status: number; error: string; message: string };

export async function resolveConsoleSession(
  requestHeaders: Headers,
): Promise<ConsoleSessionResult> {
  const cookieHeader = requestHeaders.get("cookie") || "";
  const qaCookie =
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${QA_COOKIE}=`))
      ?.slice(QA_COOKIE.length + 1) ?? null;

  const qa = isQaRequest({ cookie: qaCookie, header: requestHeaders.get(QA_HEADER) });
  const session = qa ? null : await auth.api.getSession({ headers: requestHeaders });
  const account = qa ? { ...QA_ACCOUNT } : session?.user;

  if (!account) {
    return {
      ok: false,
      status: 401,
      error: "not_authenticated",
      message: "Please sign in to open your workspace.",
    };
  }

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerUserId, account.id))
    .limit(1);

  if (!workspace) {
    return {
      ok: false,
      status: 409,
      error: "workspace_missing",
      message: "Open the dashboard once to set up your workspace.",
    };
  }

  return { ok: true, session: { account, workspace } };
}
