import { describe, expect, it } from "vitest";
import { isRunLabel, plainText, shortSummary } from "@/lib/agents/plain-summary";

const WEAVER = "I checked the workspace: * No CBAM supplier contacts are recorded for 2026. I recorded this fact (key **cbam_supplier_contacts_found**). * The linked bank account shows categories (electricity, fuel, water, freight) but no supplier/payee names are present in the spend data. **What I found:** No supplier data is currently in the workspace. **What's waiting:** A person must provide the supplier list.";

describe("plain run summaries", () => {
  it("drops markdown, bullets, fact keys and section labels", () => {
    const p = plainText(WEAVER);
    expect(p).not.toMatch(/\*|cbam_supplier|key |What I found/);
    expect(p).toContain("No CBAM supplier contacts are recorded for 2026.");
  });
  it("keeps whole sentences within the limit", () => {
    const s = shortSummary(WEAVER, 200);
    expect(s.length).toBeLessThanOrEqual(200);
    expect(s.endsWith(".")).toBe(true);
  });
  it("removes the step-ledger line and spots run numbers", () => {
    expect(shortSummary("Stopped after 10 rounds. Everything read and recorded is in the step ledger.")).toBe("Stopped after 10 rounds.");
    expect(isRunLabel("Run #51")).toBe(true);
    expect(isRunLabel("Company details")).toBe(false);
  });
});
