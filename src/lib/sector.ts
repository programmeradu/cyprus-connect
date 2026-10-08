/**
 * Sector checks for features that only apply to some businesses.
 * The industry is free text on the company profile (EN or EL), so we match
 * on words rather than a fixed code.
 */
const HOSPITALITY = /(hotel|hospitality|accommodation|resort|hostel|guest ?house|tourism|\bnace\s*i?\s*55|\b55\.\d|ξενοδοχ|φιλοξεν|τουρισ|κατάλυμ|καταλυμ)/i;

export function isHospitalitySector(industry: string | null | undefined): boolean {
  return !!industry && HOSPITALITY.test(industry);
}
