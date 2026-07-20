import { makePillar } from "./_factory";

export const whatIsNetZero = makePillar({
  slug: "what-is-net-zero",
  category: "carbon",
  primaryKeyword: "what is net zero",
  monthlyVolume: 18100,
  readingMinutes: 6,
  heroImage: "/assets/learn/net-zero-roadmap-smes/hero.jpg",
  relatedSlugs: ["net-zero-roadmap-smes", "science-based-targets-sbti", "carbon-offsetting-vs-reduction", "what-is-a-carbon-footprint"],
  en: {
    title: "What Is Net Zero? A Clear Definition",
    metaTitle: "What Is Net Zero? Definition, Meaning, and How It's Reached",
    metaDescription: "Net zero means cutting greenhouse gas emissions as close to zero as possible and neutralising the rest with permanent removals. Here's what it really requires.",
    heroEyebrow: "Basics",
    heroSubtitle: "The most-used and most-abused climate term of the decade - defined the way the IPCC, SBTi, and EU regulators actually use it.",
    tocLabel: "On this page",
    introduction: [
      "Net zero means reducing greenhouse gas emissions as close to zero as possible, then balancing any remaining emissions with an equivalent amount of permanent CO₂ removals.",
      "It is not the same as carbon neutral. Net zero requires deep reduction first; offsets are only for the small residual that reduction cannot yet eliminate.",
    ],
    sections: [
      { heading: "The precise definition", body: [
        "The IPCC defines net zero as a state where anthropogenic GHG emissions are balanced by anthropogenic GHG removals over a specified period.",
        "For corporates, SBTi's Corporate Net-Zero Standard requires at least 90-95% absolute emissions reduction across Scopes 1, 2, and 3 by 2050, with the remaining 5-10% neutralised via permanent removals."] },
      { heading: "Net zero vs carbon neutral", body: [
        "Carbon neutral means offsets have been bought to match current emissions - the emissions themselves may not have fallen.",
        "Net zero requires the reduction first. A company can be 'carbon neutral' today without being on a net-zero pathway. Regulators and serious buyers know the difference."] },
      { heading: "What a credible net-zero commitment looks like", body: [
        "A near-term target (2030) aligned with 1.5°C, a long-term target (2050) covering 90%+ of emissions, a public transition plan, and annual progress reporting.",
        "Removals for the residual should be permanent (100+ years) - not short-cycle forestry or unverified projects."] },
    ],
    keyTakeaways: [
      "Net zero = deep reduction + neutralisation of the residual with permanent removals.",
      "It is not the same as carbon neutral. Reduction has to come first.",
      "SBTi requires 90-95% absolute reduction by 2050.",
      "Credible commitments include a 2030 target and public annual progress.",
    ],
    faq: [
      { q: "Is net zero the same as carbon neutral?", a: "No. Carbon neutral means offsets match current emissions; net zero requires the emissions to be nearly eliminated first." },
      { q: "Can offsets get me to net zero?", a: "Only for the small residual after 90-95% reduction. Offsetting a full footprint is carbon neutral, not net zero." },
      { q: "Do SMEs need a net-zero target?", a: "Not legally, but major customers, banks, and public tenders increasingly require one. SBTi's SME route validates targets for under $1,000." },
    ],
    ctaHeading: "Set a credible net-zero target",
    ctaBody: "VerdeIQ walks Cyprus SMEs from baseline to SBTi-validated commitment with pre-built templates and annual tracking.",
  },
  el: {
    title: "Τι Είναι το Net Zero; Σαφής Ορισμός",
    metaTitle: "Τι Είναι το Net Zero; Ορισμός & Πώς Επιτυγχάνεται",
    metaDescription: "Net zero: μείωση εκπομπών όσο πιο κοντά στο μηδέν και εξουδετέρωση υπολειπόμενων με μόνιμες απομακρύνσεις.",
    heroEyebrow: "Βασικά",
    heroSubtitle: "Ο πιο παρεξηγημένος κλιματικός όρος - ορισμένος όπως τον χρησιμοποιούν IPCC και SBTi.",
    tocLabel: "Σε αυτή τη σελίδα",
    introduction: [
      "Net zero: μείωση εκπομπών GHG όσο πιο κοντά στο μηδέν, και εξισορρόπηση υπολοίπων με μόνιμες απομακρύνσεις CO₂.",
      "Δεν είναι το ίδιο με carbon neutral. Πρώτα η μείωση, μετά η αντιστάθμιση.",
    ],
    sections: [
      { heading: "Ακριβής ορισμός", body: ["IPCC: ισορροπία ανθρωπογενών εκπομπών και απομακρύνσεων.", "SBTi: τουλάχιστον 90-95% απόλυτη μείωση έως 2050."] },
      { heading: "Net zero vs carbon neutral", body: ["Carbon neutral: offsets = εκπομπές (χωρίς πραγματική μείωση).", "Net zero: πρώτα μείωση."] },
      { heading: "Αξιόπιστη δέσμευση", body: ["Στόχος 2030 (1.5°C), 2050 (90%+), δημόσιο πλάνο, ετήσια αναφορά.", "Μόνιμες απομακρύνσεις (100+ έτη)."] },
    ],
    keyTakeaways: ["Μείωση + μόνιμη απομάκρυνση.", "Όχι ίδιο με carbon neutral.", "SBTi: 90-95% έως 2050.", "Στόχος 2030 + δημόσια ενημέρωση."],
    faq: [
      { q: "Ίδιο με carbon neutral;", a: "Όχι - carbon neutral = offsets· net zero = πρώτα μείωση." },
      { q: "Offsets αρκούν;", a: "Μόνο για υπολειπόμενες μετά 90-95% μείωση." },
      { q: "Χρειάζονται οι ΜμΕ;", a: "Όχι νομικά, αλλά ζητείται από πελάτες/τράπεζες." },
    ],
    ctaHeading: "Ορίστε αξιόπιστο στόχο net zero",
    ctaBody: "Η VerdeIQ οδηγεί ΜμΕ Κύπρου σε επικυρωμένη δέσμευση.",
  },
});
