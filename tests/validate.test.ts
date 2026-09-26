import { describe, expect, it } from "vitest";
import { z } from "zod";
import { checkUpload, parseJsonText, readJson, sniffKind } from "@/lib/validate";

const Schema = z.object({ name: z.string().min(1).max(10), n: z.number().int().min(0) }).strict();

describe("parseJsonText", () => {
  it("accepts valid input", () => {
    expect(parseJsonText('{"name":"a","n":1}', Schema)).toEqual({ ok: true, data: { name: "a", n: 1 } });
  });
  it("400 on malformed JSON", async () => {
    const r = parseJsonText("{nope", Schema);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.response.status).toBe(400);
      expect((await r.response.json()).code).toBe("INVALID_JSON");
    }
  });
  it("400 with field list on schema failure, no values echoed", async () => {
    const r = parseJsonText('{"name":"<script>too-long-name","n":-1,"x":1}', Schema);
    if (r.ok) throw new Error("expected refusal");
    const body = await r.response.json();
    expect(body.code).toBe("INVALID_INPUT");
    expect(JSON.stringify(body)).not.toContain("<script>");
    expect(body.issues.length).toBeGreaterThan(0);
  });
  it("413 over the size cap", () => {
    const r = parseJsonText(JSON.stringify({ name: "x".repeat(100) }), Schema, 50);
    if (!r.ok) expect(r.response.status).toBe(413);
    else throw new Error("expected refusal");
  });
});

describe("readJson", () => {
  it("refuses a declared oversize body before reading it", async () => {
    const req = new Request("http://x", { method: "POST", body: "{}", headers: { "content-length": "999999999" } });
    const r = await readJson(req, Schema);
    if (!r.ok) expect(r.response.status).toBe(413);
    else throw new Error("expected refusal");
  });
});

const bytes = (...b: number[]) => new Uint8Array(b);

describe("uploads", () => {
  it("identifies files by their first bytes", () => {
    expect(sniffKind(new TextEncoder().encode("%PDF-1.7\n"))).toBe("pdf");
    expect(sniffKind(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("png");
    expect(sniffKind(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("jpeg");
    expect(sniffKind(bytes(0x50, 0x4b, 0x03, 0x04))).toBe("xlsx");
    expect(sniffKind(new TextEncoder().encode("date,kWh\n2026-01,812\nΛεμεσός,1\n"))).toBe("csv");
  });
  it("rejects a program renamed to .pdf", () => {
    const exe = bytes(0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00);
    const r = checkUpload(exe, ["pdf"]);
    expect(r).toMatchObject({ ok: false, status: 415 });
  });
  it("rejects a PDF where only images are allowed", () => {
    expect(checkUpload(new TextEncoder().encode("%PDF-1.4"), ["png", "jpeg"])).toMatchObject({ ok: false, status: 415 });
  });
  it("rejects empty and oversize files", () => {
    expect(checkUpload(new Uint8Array(0), ["pdf"])).toMatchObject({ ok: false, status: 400 });
    const big = new Uint8Array(2048);
    big.set(new TextEncoder().encode("%PDF-"));
    expect(checkUpload(big, ["pdf"], 1024)).toMatchObject({ ok: false, status: 413 });
  });
  it("accepts an allowed type", () => {
    expect(checkUpload(new TextEncoder().encode("%PDF-1.4 ..."), ["pdf"])).toEqual({ ok: true, kind: "pdf" });
  });
});
