import { describe, it, expect } from "vitest";
import { isHospitalitySector } from "@/lib/sector";

describe("hospitality sector gate", () => {
  it("shows the pack for hotels in English and Greek", () => {
    expect(isHospitalitySector("Hotel & resort")).toBe(true);
    expect(isHospitalitySector("Ξενοδοχείο")).toBe(true);
    expect(isHospitalitySector("Accommodation (NACE I55)")).toBe(true);
  });
  it("hides it for other businesses or an empty profile", () => {
    expect(isHospitalitySector("Software consultancy")).toBe(false);
    expect(isHospitalitySector("Manufacturing")).toBe(false);
    expect(isHospitalitySector(null)).toBe(false);
  });
});
