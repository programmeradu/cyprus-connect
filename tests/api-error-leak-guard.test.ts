import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// Routes must return a short log reference, never the raw internal error text.
function routes(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? routes(p) : n === "route.ts" ? [p] : [];
  });
}

const LEAK = [
  /details:\s*(?:error|err|e)\.message/,
  /details:\s*getStripeErrorMessage\(/,
  /'Internal server error: ' \+/,
  /error:\s*(?:error|err|e)\??\.message\s*(?:\|\||\?\?|[,}])/,
];

describe("API error responses", () => {
  it("never echo raw error messages to the caller", () => {
    const offenders = routes("src/app/api").filter((f) => {
      const src = readFileSync(f, "utf8");
      return LEAK.some((re) => re.test(src));
    });
    expect(offenders).toEqual([]);
  });
});
