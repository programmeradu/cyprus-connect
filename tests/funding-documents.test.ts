import { describe, expect, it } from "vitest";
import { isOfficialPdfUrl, pdfLinksIn, pickCallPdfs, relevantExcerpt } from "@/lib/funding/call-documents.server";

describe("funding call documents", () => {
  it("only accepts https PDFs on official hosts", () => {
    expect(isOfficialPdfUrl("https://ec.europa.eu/info/x/call-fiche_en.pdf")).toBe(true);
    expect(isOfficialPdfUrl("https://eic.ec.europa.eu/document/download/abc_en?filename=Guide.pdf")).toBe(true);
    expect(isOfficialPdfUrl("https://www.research.org.cy/wp-content/x.pdf")).toBe(true);
    expect(isOfficialPdfUrl("http://ec.europa.eu/x.pdf")).toBe(false);
    expect(isOfficialPdfUrl("https://evil-europa.eu.example.com/x.pdf")).toBe(false);
    expect(isOfficialPdfUrl("https://ec.europa.eu/page.html")).toBe(false);
  });

  it("drops generic guidance and ranks call-specific documents first", () => {
    const base = "https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027";
    const picked = pickCallPdfs([
      `${base}/common/guidance/om_en.pdf`,
      `${base}/cef/temp-form/af/af_cef-t_en.pdf`,
      `${base}/common/guidance/aga_en.pdf`,
      `${base}/cef/wp-call/2026/call-fiche_cef-t-2026-sustmobgen_en.pdf`,
      `${base}/cef/wp-call/2026/call-fiche_cef-t-2026-sustmobgen_en.pdf`,
    ], "CEF-T-2026-SUSTMOBGEN-EMS-WORKS");
    expect(picked).toEqual([`${base}/cef/wp-call/2026/call-fiche_cef-t-2026-sustmobgen_en.pdf`]);
  });

  it("finds absolute and relative PDF links", () => {
    const html = `<a href="/docs/guide.pdf">x</a> "https://ec.europa.eu/a/b_en.pdf" <a href="/page">y</a>`;
    expect(pdfLinksIn(html, "https://www.research.org.cy/call/1").sort()).toEqual([
      "https://ec.europa.eu/a/b_en.pdf",
      "https://www.research.org.cy/docs/guide.pdf",
    ]);
  });

  it("keeps the work-programme section about this call, not the table of contents", () => {
    const filler = "Lorem ipsum dolor sit amet. ".repeat(2000);
    const text = `Contents HORIZON-X-01 page 4\n${filler}\nHORIZON-X-01 Eligibility: applicants must be SMEs established in an EU member state. ${filler}`;
    const out = relevantExcerpt(text, "HORIZON-X-01", 8000);
    expect(out.length).toBeLessThanOrEqual(8000);
    expect(out).toContain("applicants must be SMEs established");
  });
});
