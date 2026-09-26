import { describe, expect, it } from "vitest";
import { decisionLabel, riskLabel, summarizeOutput, toolLabel, triggerLabel } from "@/lib/agents/step-labels";

describe("step labels", () => {
  it("names known tools and falls back for new ones", () => {
    expect(toolLabel("save_cbam_draft").verb).toBe("Saved the CBAM declaration draft");
    expect(toolLabel("send_supplier_email").verb).toBe("Send supplier email");
  });
  it("maps decisions and risk", () => {
    expect(decisionLabel("queued_for_approval")).toEqual({ label: "Waiting for you", tone: "live" });
    expect(decisionLabel("blocked").tone).toBe("warn");
    expect(riskLabel(3)).toBe("Legal or financial");
    expect(riskLabel(9)).toBe("Risk level 9");
    expect(triggerLabel("cron")).toBe("Scheduled");
  });
  it("summarises outputs safely", () => {
    expect(summarizeOutput("executed", null)).toBeNull();
    expect(summarizeOutput("queued_for_approval", '{"taskId":7,"reused":false}')).toBe("Opened approval task #7.");
    expect(summarizeOutput("queued_for_approval", '{"taskId":7,"reused":true}')).toMatch(/already waiting/);
    expect(summarizeOutput("failed", '{"error":"Invalid input: x"}')).toBe("Invalid input: x");
    expect(summarizeOutput("executed", "[1,2,3]")).toBe("3 items returned.");
    expect(summarizeOutput("executed", '{"a":1,"b":"x","c":[1],"d":2}')).toBe("a: 1 · b: x · c: 1 items · …");
    expect(summarizeOutput("executed", '{"broken')!.length).toBeLessThanOrEqual(141);
  });
});
