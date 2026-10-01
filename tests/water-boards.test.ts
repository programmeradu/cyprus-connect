import { describe, expect, it } from "vitest";
import { recogniseText, refuseText } from "@/lib/documents/intake";
import { checkWaterAnswer } from "@/lib/integrations/water.server";

describe("one water reader for every Cyprus supplier", () => {
  it.each([
    ["Συμβούλιο Υδατοπρομήθειας Λεμεσού Κατανάλωση m³ 42"],
    ["Water Board of Larnaca Consumption m3 18"],
    ["ΔΗΜΟΣ ΠΑΦΟΥ ΥΔΑΤΟΠΡΟΜΗΘΕΙΑ - WATER SUPPLY 14 κμ @ 0,43"],
    ["Δήμος Παραλιμνίου Τέλη Νερού Κατανάλωση 22 κυβικά"],
  ])("recognises %s", (text) => {
    expect(recogniseText(text)).toBe("water_bill");
    expect(refuseText(text)).toBeNull();
  });

  it.each([
    ["ΣΥΜΒΟΥΛΙΟΝ ΑΠΟΧΕΤΕΥΣΕΩΝ ΛΕΥΚΩΣΙΑΣ Sewerage Board of Nicosia", /Sewerage/],
    ["cablenet ΛΟΓΑΡΙΑΣΜΟΣ ΙΟΥΝΙΟΣ 2011", /internet/],
    ["Δήμος Πάφου Άδειες Σκυβάλων Licence fee", /Municipal/],
    ["Paralimni Municipality Tax Customer No.", /Municipal/],
  ])("turns away %s", (text, why) => {
    expect(refuseText(text)).toMatch(why);
  });

  it("accepts the Paphos sample figures and refuses a blank form", () => {
    const ok = checkWaterAnswer({ is_water_bill: true, board: "paphos", account_number: "08456 9 1223764 9", period_start: "2021-04-01", period_end: "2021-06-30", m3: 14, amount_eur: 78.23 });
    expect(ok.ok && ok.bill.m3).toBe(14);
    expect(checkWaterAnswer({ is_water_bill: true, board: "larnaca", account_number: "XXXXXXXX", period_start: "", period_end: "", m3: null, amount_eur: null }).ok).toBe(false);
  });
});
