import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Every change made from /app must land on the shared activity record, so
// Home, Agents and Verde all see it. Exempt routes change nothing the team shares.
const EXEMPT: Record<string, string> = {
  "tour/route.ts": "per-person tour progress",
  "insights/advice/route.ts": "read-only advice",
  "bank/connect/route.ts": "only starts the bank sign-in; the callback records the link",
  "company/route.ts": "writes through company-update.server.ts, which records activity",
  "bank/sync/route.ts": "bank.server.ts records activity",
  "bank/disconnect/route.ts": "bank.server.ts records activity",
  "integrations/bill-inbox/route.ts": "bill-inbox.server.ts records activity",
};
const ROOT = "src/app/api/console";
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

describe("shared activity record", () => {
  it("every /app write route records activity", () => {
    const missing = walk(ROOT)
      .filter((f) => f.endsWith("route.ts"))
      .filter((f) => /export (async function|const) (POST|PUT|PATCH|DELETE)\b/.test(readFileSync(f, "utf8")))
      .map((f) => f.slice(ROOT.length + 1))
      .filter((rel) => !EXEMPT[rel])
      .filter((rel) => !/recordActivity|activityEvents|logEvent/.test(readFileSync(join(ROOT, rel), "utf8")));
    expect(missing).toEqual([]);
  });
});
