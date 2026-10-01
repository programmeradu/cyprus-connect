import { describe, expect, it } from "vitest";
import { logoDomain, normalizeDomain } from "@/lib/company-logo";

describe("company logo domain", () => {
  it("normalises websites", () => {
    expect(normalizeDomain("https://www.Acme.com.cy/about?x=1")).toBe("acme.com.cy");
    expect(normalizeDomain("bankofcyprus.com")).toBe("bankofcyprus.com");
    expect(normalizeDomain("not a site")).toBeNull();
    expect(normalizeDomain("localhost")).toBeNull();
    expect(normalizeDomain("http://127.0.0.1")).toBeNull();
  });
  it("prefers the website, then a work email, never personal mail", () => {
    expect(logoDomain("acme.cy", "a@other.com")).toBe("acme.cy");
    expect(logoDomain(null, "maria@hellenicbank.com")).toBe("hellenicbank.com");
    expect(logoDomain(null, "maria@gmail.com")).toBeNull();
    expect(logoDomain("", "x@cytanet.com.cy")).toBeNull();
    expect(logoDomain(null, null)).toBeNull();
  });
});
