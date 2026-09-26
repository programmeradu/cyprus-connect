import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx|mjs)$/.test(n) ? [p] : [];
  });
}

describe(".env.example parity", () => {
  it("lists every process.env variable the app reads", () => {
    const used = new Set<string>();
    for (const f of files("src")) for (const m of readFileSync(f, "utf8").matchAll(/process\.env\.([A-Z0-9_]+)/g)) used.add(m[1]);
    const listed = new Set(readFileSync(".env.example", "utf8").match(/^[A-Z0-9_]+(?==)/gm) ?? []);
    const builtIn = new Set(["NODE_ENV", "NEXT_RUNTIME"]);
    expect([...used].filter((v) => !listed.has(v) && !builtIn.has(v)).sort()).toEqual([]);
  });
});
