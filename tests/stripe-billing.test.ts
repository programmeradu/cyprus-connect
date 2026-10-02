import { describe, expect, it } from "vitest";
import en from "../messages/en.json";
import el from "../messages/el.json";
import {
  hmacSha256Hex,
  parseSignatureHeader,
  stripeModeFromKey,
  verifyStripeSignature,
} from "@/lib/stripe/server";
import { SUBSCRIPTION_PLANS, planFromLookupKey, priceFor, lookupKeyFor } from "@/lib/stripe/config";
import { summariseInvoice } from "@/lib/stripe/utils";
import { keepsPlan, subscriptionRowFrom } from "@/lib/stripe/webhook-handlers";

const SECRET = "whsec_test_secret";

async function signed(body: string, t = Math.floor(Date.now() / 1000), secret = SECRET) {
  return `t=${t},v1=${await hmacSha256Hex(secret, `${t}.${body}`)}`;
}

describe("Stripe mode comes from the key", () => {
  it("reads test, live and missing keys", () => {
    expect(stripeModeFromKey("sk_test_abc")).toBe("sandbox");
    expect(stripeModeFromKey("rk_live_abc")).toBe("live");
    expect(stripeModeFromKey("pk_live_abc")).toBeNull();
    expect(stripeModeFromKey(undefined)).toBeNull();
  });
});

describe("webhook signature", () => {
  const body = JSON.stringify({ id: "evt_1", type: "invoice.paid", data: { object: {} } });

  it("accepts a valid signature", async () => {
    const event = await verifyStripeSignature(body, await signed(body), SECRET);
    expect(event.id).toBe("evt_1");
  });

  it("accepts any of several v1 signatures (secret roll)", async () => {
    const t = Math.floor(Date.now() / 1000);
    const good = (await signed(body, t)).split("v1=")[1];
    expect((await verifyStripeSignature(body, `t=${t},v1=deadbeef,v1=${good}`, SECRET)).type).toBe("invoice.paid");
  });

  it("rejects a wrong secret, a changed body and an old timestamp", async () => {
    await expect(verifyStripeSignature(body, await signed(body, undefined, "other"), SECRET)).rejects.toThrow();
    await expect(verifyStripeSignature(body + " ", await signed(body), SECRET)).rejects.toThrow();
    const old = Math.floor(Date.now() / 1000) - 3600;
    await expect(verifyStripeSignature(body, await signed(body, old), SECRET)).rejects.toThrow(/tolerance/);
    await expect(verifyStripeSignature(body, null, SECRET)).rejects.toThrow();
  });

  it("parses the header", () => {
    expect(parseSignatureHeader("t=1, v1=a, v1=b, v0=c")).toEqual({ timestamp: "1", v1: ["a", "b"] });
  });
});

describe("plans and prices", () => {
  it("maps lookup keys both ways", () => {
    for (const id of ["pro", "enterprise"] as const) {
      for (const iv of ["month", "year"] as const) {
        expect(planFromLookupKey(lookupKeyFor(id, iv))).toEqual({ planId: id, interval: iv });
      }
    }
    expect(planFromLookupKey("pro_monthly_usd").planId).toBe("pro");
    expect(planFromLookupKey(null).planId).toBe("free");
  });

  it("yearly costs ten months", () => {
    expect(priceFor("pro", "year")).toBe(450);
    expect(priceFor("enterprise", "year")).toBe(1850);
  });
});

describe("plan lists promise only what is built", () => {
  const BANNED = /xero|quickbooks|sla|uptime|sso|white-?label|custom ai model|account manager|api rate/i;

  it("English copy matches config and has no unbuilt promises", () => {
    for (const id of ["free", "pro", "enterprise"] as const) {
      const copy = en.billing.pricingTable.features[id];
      expect(copy).toEqual([...SUBSCRIPTION_PLANS[id].features]);
      for (const line of copy) expect(line).not.toMatch(BANNED);
    }
  });

  it("Greek lists have the same length and credit numbers", () => {
    for (const id of ["free", "pro", "enterprise"] as const) {
      expect(el.billing.pricingTable.features[id]).toHaveLength(en.billing.pricingTable.features[id].length);
    }
    const credits = (s: string[]) => s.join(" ").replace(/[.,]/g, "").match(/\d{3,}/g);
    expect(credits(el.billing.pricingTable.features.pro)).toEqual(credits(en.billing.pricingTable.features.pro));
  });
});

describe("webhook mapping", () => {
  const sub = {
    id: "sub_1",
    customer: "cus_1",
    status: "past_due",
    collection_method: "send_invoice",
    cancel_at_period_end: false,
    items: { data: [{ price: { lookup_key: "enterprise_yearly_eur" }, current_period_start: 1, current_period_end: 2 }] },
  };

  it("builds the subscription row", () => {
    const row = subscriptionRowFrom(sub);
    expect(row).toMatchObject({ planId: "enterprise", billingInterval: "year", collectionMethod: "send_invoice", stripeCustomerId: "cus_1" });
  });

  it("keeps the plan while a payment is late, drops it when ended", () => {
    expect(keepsPlan("past_due")).toBe(true);
    expect(keepsPlan("unpaid")).toBe(true);
    expect(keepsPlan("canceled")).toBe(false);
    expect(keepsPlan("incomplete_expired")).toBe(false);
  });

  it("summarises an invoice", () => {
    const s = summariseInvoice({ id: "in_1", number: "VNL-1", created: 1700000000, status: "open", amount_due: 18500, currency: "eur", due_date: 1702592000, invoice_pdf: "https://x/pdf", hosted_invoice_url: "https://x", lines: { data: [{ description: "Vuneli Enterprise" }] } });
    expect(s).toMatchObject({ amount: 18500, status: "open", description: "Vuneli Enterprise", pdfUrl: "https://x/pdf" });
    expect(s.dueDate).not.toBeNull();
  });
});
