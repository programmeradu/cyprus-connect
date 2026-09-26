/**
 * Every API route reads its body through src/lib/validate.ts, which caps the
 * size and checks it against a schema. A route that calls request.json() or
 * request.formData() directly skips both, so this test fails on it.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function routes(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return routes(p);
    return name === "route.ts" ? [p] : [];
  });
}

describe("API input guard", () => {
  const files = routes(join(process.cwd(), "src/app/api"));

  it("finds the API routes", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("no route parses a body without validation", () => {
    const offenders = files.filter((f) => /\brequest\.(json|formData)\(\)/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
