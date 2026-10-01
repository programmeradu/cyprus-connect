import { afterEach, describe, expect, it, vi } from "vitest";
import { parseMatchResponse, screenCompany } from "@/lib/integrations/sanctions.server";

const answer = { responses: { q: { results: [
  { id: "NK-abc", caption: "Acme Trading LLC", schema: "Company", score: 0.91, match: true, datasets: ["eu_fsf", "us_ofac_sdn"], last_change: "2026-09-01T00:00:00", properties: { jurisdiction: ["ru"], programId: ["RUS"] } },
  { id: "NK-low", caption: "Acme Bakery", schema: "Company", score: 0.41, match: false, properties: {} },
] } } };

describe("OpenSanctions", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it("keeps only above-threshold matches, with source link", () => {
    const hits = parseMatchResponse(answer);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ name: "Acme Trading LLC", score: 0.91, countries: ["ru"], url: "https://www.opensanctions.org/entities/NK-abc/" });
  });
  it("rejects an unexpected answer instead of calling it clear", () => {
    expect(() => parseMatchResponse({ error: "x" })).toThrow();
  });
  it("is not configured without a key, and never guesses", async () => {
    vi.stubEnv("OPENSANCTIONS_API_KEY", "");
    expect(await screenCompany({ name: "Acme" })).toEqual({ ok: false, reason: "not_configured" });
  });
  it("sends the key, the Cyprus register number, and maps outcomes (offline)", async () => {
    vi.stubEnv("OPENSANCTIONS_API_KEY", "k");
    const f = vi.fn(async () => new Response(JSON.stringify(answer), { status: 200 }));
    vi.stubGlobal("fetch", f);
    const r = await screenCompany({ name: "Acme", country: "CY", registrationNo: "HE 123" });
    expect(r.ok && r.status).toBe("possible_match");
    const [, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("ApiKey k");
    expect(JSON.parse(init.body as string).queries.q.properties).toEqual({ name: ["Acme"], jurisdiction: ["cy"], registrationNumber: ["HE123"] });
    f.mockResolvedValueOnce(new Response("no", { status: 401 }));
    expect(await screenCompany({ name: "Acme" })).toEqual({ ok: false, reason: "rejected" });
    f.mockRejectedValueOnce(new Error("down"));
    expect(await screenCompany({ name: "Acme" })).toEqual({ ok: false, reason: "unavailable" });
  });
});
