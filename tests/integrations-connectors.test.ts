import { describe, it, expect } from "vitest";
import { CONNECTORS } from "@/components/app/integrations/catalog";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { CYPRUS_BANKS } from "@/lib/bank/saltedge";
import { ERP_SYSTEMS } from "@/lib/integrations/erp-catalog";
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
    expect(saltedge?.desc.en).not.toMatch(/AstroBank|Ancoria/);

    const nango = CONNECTORS.find((c) => c.id === "nango");
    expect(nango).toBeDefined();
    expect(nango?.category).toBe("accounting");
    expect(nango?.light).toBe("/integrations/nango-light.svg");
    expect(nango?.dark).toBe("/integrations/nango-dark.svg");
    expect(nango?.desc.en).toContain("Sage, SAP");
    expect(nango?.desc.en).not.toMatch(/150\+|two-way/i);
  });

  it("lists only Cyprus banks Salt Edge covers today, each with a real logo", () => {
    const codes = CYPRUS_BANKS.map((b) => b.code);
    expect(codes).toEqual(["hellenic_bank_cy", "eurobank_cy", "alpha_bank_cy"]);
    // AstroBank merged into Alpha Bank; Ancoria is not covered; BoC is linked directly.
    expect(codes).not.toContain("astrobank_cy");
    expect(codes).not.toContain("ancoria_bank_cy");
    expect(codes.some((c) => c.includes("bank_of_cyprus"))).toBe(false);

    for (const bank of CYPRUS_BANKS) {
      expect(bank.name.en).toBeTruthy();
      expect(bank.name.el).toBeTruthy();
      expect(bank.system.en).toBeTruthy();
      expect(bank.system.el).toBeTruthy();
      expect(existsSync(join(process.cwd(), "public", bank.icon))).toBe(true);
    }
  });

  it("routes every accounting system, QuickBooks and Xero included, through the one picker", () => {
    const ids = ERP_SYSTEMS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("quickbooks");
    expect(ids).toContain("xero");
    expect(CONNECTORS.some((c) => c.id === "quickbooks" || c.id === "xero")).toBe(false);
    for (const s of ERP_SYSTEMS) {
      expect(existsSync(join(process.cwd(), "public", s.light))).toBe(true);
      expect(existsSync(join(process.cwd(), "public", s.dark))).toBe(true);
      expect(s.fit.en && s.fit.el).toBeTruthy();
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
