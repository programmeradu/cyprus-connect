import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Every /app page reads and writes workspace data through the shared store
 * (src/components/app/console/workspace-store.ts), never with its own fetch.
 * Pages not yet moved are listed with the plan phase that moves them; the
 * list may only shrink.
 */
const ROOT = join(process.cwd(), "src/app/[locale]/app");

const NOT_YET_MOVED: Record<string, string> = {
};

function pages(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return pages(p);
    return name.endsWith(".tsx") ? [p] : [];
  });
}

describe("app pages use the shared workspace store", () => {
  const files = pages(ROOT).map((p) => relative(ROOT, p).split("\\").join("/"));

  it("no moved page calls fetch directly", () => {
    const offenders = files.filter(
      (f) => !(f in NOT_YET_MOVED) && /\bfetch\s*\(/.test(readFileSync(join(ROOT, f), "utf8")),
    );
    expect(offenders).toEqual([]);
  });

  it("the not-yet-moved list only names pages that still fetch", () => {
    const stale = Object.keys(NOT_YET_MOVED).filter(
      (f) => !files.includes(f) || !/\bfetch\s*\(/.test(readFileSync(join(ROOT, f), "utf8")),
    );
    expect(stale).toEqual([]);
  });
});
