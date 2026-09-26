import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ requireVuneliUserId: vi.fn() }));

import { isDevOnlyApi, isPublicApi } from "@/lib/api-access";
import { decideBinding } from "@/lib/api-auth";

describe("isPublicApi", () => {
  it.each([
    "/api/news",
    "/api/news/takes",
    "/api/public/payments/webhook",
    "/api/auth/config",
    "/api/cron/grant-alerts",
    "/api/climate-trace/sectors",
  ])("allows %s", (p) => expect(isPublicApi(p)).toBe(true));

  it.each([
    "/api/dashboard/metrics",
    "/api/users/abc",
    "/api/documents/upload",
    "/api/newsletter", // prefix lookalike must not match /api/news
    "/api/console/overview",
    "/api/climate-trace/admin/search",
  ])("requires a session for %s", (p) => expect(isPublicApi(p)).toBe(false));

  it("flags admin-only tools", () => {
    expect(isDevOnlyApi("/api/climate-trace/admin/search")).toBe(true);
    expect(isDevOnlyApi("/api/news")).toBe(false);
  });
});

describe("decideBinding", () => {
  it("refuses without a session", async () => {
    const r = decideBinding(null, undefined);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(401);
  });

  it("refuses another account's id", () => {
    const r = decideBinding("me", "someone-else");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(403);
  });

  it("uses the session id when none or the same id is claimed", () => {
    expect(decideBinding("me", undefined)).toEqual({ ok: true, userId: "me" });
    expect(decideBinding("me", "")).toEqual({ ok: true, userId: "me" });
    expect(decideBinding("me", " me ")).toEqual({ ok: true, userId: "me" });
  });
});

describe("bindSessionUser", () => {
  it("resolves the account from the session, not the request", async () => {
    const { requireVuneliUserId } = await import("@/lib/auth");
    const { bindSessionUser } = await import("@/lib/api-auth");
    vi.mocked(requireVuneliUserId).mockResolvedValueOnce("owner");
    const headers = new Headers({ cookie: "a=1; b=2" });
    const r = await bindSessionUser({ headers }, "intruder");
    expect(r.ok).toBe(false);
    vi.mocked(requireVuneliUserId).mockResolvedValueOnce("owner");
    expect(await bindSessionUser({ headers })).toEqual({ ok: true, userId: "owner" });
  });
});
