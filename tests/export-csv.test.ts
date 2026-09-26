import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "@/components/app/console/export-csv";

describe("csv export", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"');
  });
  it("neutralises formula injection but keeps negative numbers", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("-3.5")).toBe("-3.5");
    expect(csvCell(-3.5)).toBe("-3.5");
  });
  it("renders null as empty and ends rows with CRLF", () => {
    expect(toCsv(["a", "b"], [[null, 1]])).toBe("a,b\r\n,1\r\n");
  });
});
