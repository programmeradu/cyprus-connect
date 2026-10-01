import { describe, expect, it } from "vitest";
import { nameScore, nameTokens, parseEuCsv } from "@/lib/integrations/sanctions.server";

const H = "fileGenerationDate;Entity_LogicalId;Entity_DesignationDate;Entity_SubjectType_ClassificationCode;Entity_Regulation_Programme;Entity_Regulation_PublicationUrl;NameAlias_WholeName;Address_CountryIso2Code";
const csv = (rows: string[]) => "\uFEFF" + [H, ...rows].join("\n");

describe("EU sanctions list", () => {
  it("normalizes names: accents, punctuation and legal forms do not count", () => {
    expect(nameTokens("ООО «Acme-Trading», LLC")).toEqual(["acme", "trading"]);
    expect(nameTokens("Café Société S.A.")).toEqual(["cafe", "societe"]);
    expect(nameTokens("Ltd")).toEqual([]);
  });
  it("scores against the longer name, so a shared word alone is not a match", () => {
    expect(nameScore(["acme", "trading"], ["acme", "trading"])).toBe(1);
    expect(nameScore(["acme", "bakery"], ["acme", "trading"])).toBe(0.5);
    expect(nameScore([], ["x"])).toBe(0);
  });
  it("parses the official CSV: one row per entity name, keeps country, link and list date", () => {
    const { generated, rows } = parseEuCsv(csv([
      '2026-09-30;13;2022-03-15;enterprise;RUS;https://eur-lex.europa.eu/x;"Acme ""Trading"" LLC";',
      "2026-09-30;13;2022-03-15;enterprise;RUS;https://eur-lex.europa.eu/x;Acme \"Trading\" LLC;RU",
      "2026-09-30;14;bad;person;IRN;javascript:x;John Doe;",
    ]));
    expect(generated).toBe("2026-09-30");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ entityId: "13", tokens: ["acme", "trading"], country: "RU", programme: "RUS", designated: "2022-03-15", url: "https://eur-lex.europa.eu/x" });
    expect(rows[1]).toMatchObject({ designated: null, url: null });
  });
  it("refuses a file that is not the EU list instead of storing nothing", () => {
    expect(() => parseEuCsv("a;b\n1;2")).toThrow();
  });
});
