import { describe, it, expect } from "vitest";
import { CONNECTORS } from "@/components/app/integrations/catalog";
import { CYPRUS_BANKS } from "@/lib/bank/saltedge";
import { saltEdgeConfig } from "@/lib/bank/saltedge.server";
import { nangoConfig } from "@/lib/integrations/nango.server";

describe("Integrations Catalog & Connectors", () => {
  it("includes Salt Edge and Nango in the connectors list", () => {
    const saltedge = CONNECTORS.find((c) => c.id === "saltedge");
    expect(saltedge).toBeDefined();
    expect(saltedge?.category).toBe("accounting");
    expect(saltedge?.light).toBe("/integrations/saltedge-light.svg");
    expect(saltedge?.dark).toBe("/integrations/saltedge-dark.svg");
    expect(saltedge?.desc.en).toContain("Hellenic Bank");
    expect(saltedge?.desc.el).toContain("Ελληνικής");

    const nango = CONNECTORS.find((c) => c.id === "nango");
    expect(nango).toBeDefined();
    expect(nango?.category).toBe("accounting");
    expect(nango?.light).toBe("/integrations/nango-light.svg");
    expect(nango?.dark).toBe("/integrations/nango-dark.svg");
    expect(nango?.desc.en).toContain("Sage, SAP");
  });

  it("defines institutional Cyprus banks for Salt Edge with valid BICs", () => {
    expect(CYPRUS_BANKS.length).toBeGreaterThanOrEqual(4);
    const codes = CYPRUS_BANKS.map((b) => b.code);
    expect(codes).toContain("hellenic_bank_cy");
    expect(codes).toContain("eurobank_cy");
    expect(codes).toContain("alpha_bank_cy");
    expect(codes).toContain("astrobank_cy");

    for (const bank of CYPRUS_BANKS) {
      expect(bank.name.en).toBeTruthy();
      expect(bank.name.el).toBeTruthy();
      expect(bank.bic).toMatch(/^[A-Z0-9]{8,11}$/);
    }
  });

  it("handles missing environment configuration gracefully", () => {
    const origAppId = process.env.SALTEDGE_APP_ID;
    delete process.env.SALTEDGE_APP_ID;
    expect(saltEdgeConfig()).toBeNull();
    if (origAppId) process.env.SALTEDGE_APP_ID = origAppId;

    const origNangoKey = process.env.NANGO_SECRET_KEY;
    delete process.env.NANGO_SECRET_KEY;
    expect(nangoConfig()).toBeNull();
    if (origNangoKey) process.env.NANGO_SECRET_KEY = origNangoKey;
  });
});
