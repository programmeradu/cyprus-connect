/**
 * One way to write the shared activity record that Home, Agents and Verde read.
 * Never throws: a failed activity write is logged, the user's action still stands.
 */
import { db } from "@/db";
import { activityEvents } from "@/db/schema";
import { logger } from "@/lib/log";

const log = logger("activity");

export type ActivitySession = { workspace: { id: string }; account: { id: string; name?: string | null; email?: string | null } };

export const actorName = (s: ActivitySession) => s.account.name || s.account.email || s.account.id;

export async function recordActivity(
  s: ActivitySession,
  verb: string,
  object: string,
  detail?: string | null,
  actorType: "human" | "agent" = "human",
): Promise<void> {
  try {
    await db.insert(activityEvents).values({
      workspaceId: s.workspace.id,
      actorType,
      actorName: actorName(s),
      verb: verb.slice(0, 120),
      object: object.slice(0, 200),
      detail: detail ? detail.slice(0, 1000) : null,
    });
  } catch (e) {
    log.error("activity write failed", e);
  }
}
