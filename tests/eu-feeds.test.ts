import { describe, expect, it } from "vitest";
import { parseTedNotices, parseEurLex, topicsFor, isGreenCpv } from "@/lib/integrations/eu-feeds.server";

describe("TED parser", () => {
  const json = { notices: [
    { "publication-number": "510359-2026", "title-proc": { eng: "Smart meters rollout" }, "buyer-name": { eng: ["Electricity Authority of Cyprus"] },
      "publication-date": "2026-07-23+02:00", "deadline-receipt-tender-date-lot": ["2026-10-16+03:00", "2026-10-10+03:00"],
      "classification-cpv": ["38554000", "38554000"], "estimated-value-proc": "25000000", "estimated-value-cur-proc": "EUR" },
    { "publication-number": "485680-2026", "title-proc": { ell: "Διαγωνισμός υπηρεσιών" }, "buyer-name": { ell: ["Αρχή"] },
      "publication-date": "2026-07-14+02:00", "classification-cpv": ["98390000"], "estimated-value-proc": "100", "estimated-value-cur-proc": "USD" },
    { "publication-number": "", "title-proc": { eng: "no number" }, "publication-date": "2026-07-14" },
  ] };
  it("keeps real fields, earliest lot deadline, EUR only, Greek link for Greek titles", () => {
    const [a, b, ...rest] = parseTedNotices(json);
    expect(rest).toHaveLength(0);
    expect(a).toMatchObject({ id: "ted:510359-2026", deadline: "2026-10-10", valueEur: 25000000, green: true, cpv: ["38554000"], titleLang: "en" });
    expect(b).toMatchObject({ valueEur: null, green: false, titleLang: "el", deadline: null });
    expect(b.url).toContain("/el/notice/");
  });
});

describe("EUR-Lex parser", () => {
  it("tags topics, act type and corrigenda; drops duplicates", () => {
    const row = (celex: string, title: string) => ({ celex: { value: celex }, date: { value: "2026-09-14" }, title: { value: title } });
    const items = parseEurLex({ results: { bindings: [
      row("32026R2049", "Implementing Regulation on primary batteries"),
      row("32026R2049", "dup"),
      row("32023R2674R(01)", "Corrigendum to Regulation (EU) 2023/956 carbon border adjustment"),
    ] } });
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ actType: "Regulation", topics: ["Batteries"] });
    expect(items[1].actType).toBe("Corrigendum");
    expect(items[1].topics).toContain("CBAM");
  });
  it("topic and CPV rules", () => {
    expect(topicsFor("amending Directive (EU) 2022/2464 sustainability reporting")).toContain("Sustainability reporting");
    expect(topicsFor("fisheries quota")).toEqual([]);
    expect(isGreenCpv(["90700000"])).toBe(true);
    expect(isGreenCpv(["33100000"])).toBe(false);
  });
});
