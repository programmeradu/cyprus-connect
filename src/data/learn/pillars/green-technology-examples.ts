import { makePillar } from "./_factory";

export const greenTechnologyExamples = makePillar({
  slug: "green-technology-examples",
  category: "esg",
  primaryKeyword: "green technology examples",
  monthlyVolume: 3600,
  readingMinutes: 7,
  heroImage: "/assets/learn/esg-software-cyprus/hero.jpg",
  relatedSlugs: ["carbon-footprint-software-smes", "esg-reporting-software", "net-zero-roadmap-smes", "eu-taxonomy-explained"],
  en: {
    title: "Green Technology: 12 Real Examples Working Today",
    metaTitle: "Green Technology Examples: 12 Proven Solutions in 2026",
    metaDescription: "Real examples of green technology deployed at scale in 2026 - from heat pumps and solar-plus-storage to green hydrogen, DAC, and precision agriculture.",
    heroEyebrow: "Concepts",
    heroSubtitle: "Not concepts. Not pilots. Twelve green technologies with commercial deployments and measurable impact today.",
    tocLabel: "On this page",
    introduction: [
      "Green technology (or 'cleantech') describes any hardware, software, or process designed to reduce environmental impact - most often greenhouse gas emissions, but also water, waste, and biodiversity.",
      "The examples below are not aspirational. Each is deployed commercially in the EU today and has a defensible impact per euro invested.",
    ],
    sections: [
      { heading: "Energy generation and storage", body: [
        "Utility-scale solar with battery storage - now cheaper than new gas in most EU markets.",
        "Offshore wind - approaching 100 GW installed in Europe.",
        "Green hydrogen electrolysers - moving from pilot to first commercial fleets in Iberia and northern Europe."] },
      { heading: "Buildings and heat", body: [
        "Heat pumps (air-source and ground-source) - three to five times more efficient than gas boilers.",
        "Smart building controls - AI-driven HVAC optimisation cutting building energy 15-30% with no capex on the fabric.",
        "Passive-house retrofits and mineral-based insulation."] },
      { heading: "Transport", body: [
        "Battery electric vehicles - now cheaper on TCO than diesel for most fleet use cases.",
        "eBikes and last-mile electric cargo bikes - decarbonising urban delivery.",
        "Sustainable aviation fuel (SAF) - blended into commercial flights since 2024."] },
      { heading: "Industry and agriculture", body: [
        "Direct air capture (DAC) - Climeworks and 1PointFive at first commercial megatonne scale.",
        "Precision agriculture and variable-rate fertiliser - cutting N₂O and input costs simultaneously.",
        "Green steel via hydrogen DRI - SSAB and H2 Green Steel shipping first tonnes to European automakers."] },
      { heading: "Software and data", body: [
        "Carbon accounting and ESG reporting software - including VerdeIQ - turning compliance into measurable reduction.",
        "Grid-optimisation software - shifting industrial load to renewable hours."] },
    ],
    keyTakeaways: [
      "Green tech is commercial today, not aspirational.",
      "The biggest impact levers for SMEs are heat pumps, solar+storage, and EVs.",
      "Software (carbon accounting, grid optimisation) unlocks reductions across all sectors.",
      "Green hydrogen and DAC are moving from pilot to first commercial deployments.",
    ],
    faq: [
      { q: "What's the easiest green tech to deploy in an SME?", a: "LED lighting, sub-metering, and heat pumps are typically the fastest payback. Rooftop solar follows once tariff structures suit the business." },
      { q: "Is green hydrogen ready?", a: "For hard-to-electrify heavy industry, first commercial fleets are operating in 2026. For SMEs, direct electrification is almost always cheaper." },
      { q: "Does 'green' technology actually reduce emissions?", a: "The examples above have measurable, third-party-verified lifecycle emissions well below the fossil incumbents they replace." },
    ],
    ctaHeading: "Track the impact of every green tech deployment",
    ctaBody: "VerdeIQ measures emission reductions from your green tech investments in real time so you can prove ROI and reduce financing cost.",
  },
  el: {
    title: "Πράσινη Τεχνολογία: 12 Πραγματικά Παραδείγματα",
    metaTitle: "Παραδείγματα Πράσινης Τεχνολογίας: 12 Αποδεδειγμένες Λύσεις",
    metaDescription: "Πραγματικά παραδείγματα πράσινης τεχνολογίας που εφαρμόζονται σήμερα - από αντλίες θερμότητας μέχρι πράσινο υδρογόνο και DAC.",
    heroEyebrow: "Έννοιες",
    heroSubtitle: "Όχι πιλότοι - 12 τεχνολογίες με εμπορική εφαρμογή σήμερα.",
    tocLabel: "Σε αυτή τη σελίδα",
    introduction: [
      "Πράσινη τεχνολογία: υλικό, λογισμικό ή διαδικασία που μειώνει περιβαλλοντικές επιπτώσεις.",
      "Τα παρακάτω εφαρμόζονται εμπορικά στην ΕΕ σήμερα.",
    ],
    sections: [
      { heading: "Ενέργεια & αποθήκευση", body: ["Φωτοβολταϊκά + μπαταρίες.", "Υπεράκτια αιολικά (~100 GW ΕΕ).", "Πράσινο υδρογόνο - πρώτες εμπορικές μονάδες."] },
      { heading: "Κτίρια & θέρμανση", body: ["Αντλίες θερμότητας (3-5× πιο αποδοτικές).", "Έξυπνοι έλεγχοι BMS (-15-30%).", "Ανακαινίσεις passive-house."] },
      { heading: "Μεταφορές", body: ["EV - φθηνότερα σε TCO.", "eBikes για last-mile.", "SAF στις πτήσεις."] },
      { heading: "Βιομηχανία & γεωργία", body: ["DAC (Climeworks).", "Ακριβής γεωργία.", "Πράσινος χάλυβας με H₂."] },
      { heading: "Λογισμικό", body: ["Carbon accounting/ESG (VerdeIQ).", "Grid optimisation."] },
    ],
    keyTakeaways: ["Εμπορικές σήμερα.", "ΜμΕ: αντλίες, ΦΒ, EV.", "Το λογισμικό ξεκλειδώνει μειώσεις.", "Η₂/DAC από πιλότο σε εμπορικό."],
    faq: [
      { q: "Ευκολότερη για ΜμΕ;", a: "LED, submetering, αντλίες θερμότητας." },
      { q: "Έτοιμο το υδρογόνο;", a: "Ναι για βαριά βιομηχανία. ΜμΕ: ηλεκτροκίνηση φθηνότερη." },
      { q: "Μειώνουν πράγματι;", a: "Ναι - επαληθευμένος κύκλος ζωής." },
    ],
    ctaHeading: "Μετρήστε τον αντίκτυπο κάθε επένδυσης",
    ctaBody: "Η VerdeIQ αποδεικνύει ROI για πράσινες επενδύσεις.",
  },
});
