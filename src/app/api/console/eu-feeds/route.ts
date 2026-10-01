/**
 * Shared EU feeds for the console: ?source=ted (open Cyprus tenders) or
 * ?source=eurlex (recent EU climate/energy/reporting acts). Public records,
 * but served to signed-in workspaces only, like every other console read.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { resolveConsoleSession } from "@/lib/console-session";
import { logger } from "@/lib/log";
import { readEuFeed } from "@/lib/integrations/eu-feeds.server";

export const dynamic = "force-dynamic";
const log = logger("api.console.eu-feeds");

const Query = z.object({
  source: z.enum(["ted", "eurlex"]),
  green: z.enum(["1", "0"]).optional(),
});

export async function GET(req: Request) {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const q = Query.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!q.success) return NextResponse.json({ message: "Choose source=ted or source=eurlex." }, { status: 400 });
  try {
    return NextResponse.json(await readEuFeed(q.data.source, { greenOnly: q.data.green === "1", limit: 200 }));
  } catch (error) {
    const ref = log.error("read failed", error);
    return NextResponse.json({ message: "The EU feed could not be read.", ref }, { status: 500 });
  }
}
