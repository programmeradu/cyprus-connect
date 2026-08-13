import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Supabase Auth replaces Better Auth runtime integrations", async () => {
  const [serverAuth, browserAuth, authRoute, middleware] = await Promise.all([
    read("src/lib/auth.ts"),
    read("src/lib/auth-client.ts"),
    read("src/app/api/auth/[...all]/route.ts"),
    read("src/middleware.ts"),
  ]);

  assert.match(serverAuth, /getVuneliSession/);
  assert.match(serverAuth, /requireVuneliUserId/);
  assert.doesNotMatch(serverAuth, /from ["']better-auth/);
  assert.match(browserAuth, /signInWithPassword/);
  assert.match(browserAuth, /signInWithOAuth/);
  assert.match(authRoute, /getVuneliSession/);
  assert.match(middleware, /createServerClient/);
});

test("identity mapping migration remains additive and locked down", async () => {
  const migration = await read("supabase/migrations/20260813_add_auth_identity.sql");
  assert.match(migration, /create table if not exists public\.auth_identity/i);
  assert.match(migration, /references public\."user"\(id\)/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all on table public\.auth_identity from anon, authenticated/i);
});

test("legacy-account transition is explicit and safe to dry-run", async () => {
  const [script, runbook] = await Promise.all([
    read("scripts/migrate-legacy-auth.mjs"),
    read("docs/SUPABASE_AUTH_CUTOVER.md"),
  ]);
  assert.match(script, /--dry-run/);
  assert.match(script, /hasGoogleOnlyAccount/);
  assert.match(script, /auth_identity/);
  assert.match(runbook, /without changing any existing Vuneli user ID/i);
  assert.match(runbook, /password recovery/i);
});
