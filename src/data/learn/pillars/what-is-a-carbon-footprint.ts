import { makePillar } from "./_factory";

export const whatIsCarbonFootprint = makePillar({
  slug: "what-is-a-carbon-footprint",
  category: "carbon",
  primaryKeyword: "what is a carbon footprint",
  monthlyVolume: 40500,
  readingMinutes: 6,
  heroImage: "/assets/learn/carbon-accounting-for-smes/hero.jpg",
  relatedSlugs: ["scope-1-2-3-emissions", "carbon-accounting-for-smes", "ghg-protocol-guide", "net-zero-roadmap-smes"],
  en: {
    title: "What Is a Carbon Footprint? A Plain-English Guide",
    metaTitle: "What Is a Carbon Footprint? Meaning & How To Measure",
    metaDescription: "A carbon footprint is the total GHG emissions caused by an activity, person, or business. Here's what it means and how to measure yours.",
    heroEyebrow: "Basics",
    heroSubtitle: "The single most-searched climate question - answered without jargon, using the same definition regulators and auditors use.",
    tocLabel: "On this page",
    introduction: [
      "A carbon footprint is the total amount of greenhouse gases released into the atmosphere as a result of an activity, product, person, or organisation. It is expressed in tonnes of carbon-dioxide-equivalent (tCO₂e) so different gases can be compared on the same scale.",
      "The term applies at every scale: a flight has a footprint, a burger has a footprint, and a 40-person accounting firm has a footprint. Only the calculation boundary changes.",
    ],
    sections: [
      { heading: "What is actually counted", body: [
        "Six gases covered by the Kyoto Protocol are counted: CO₂, methane, nitrous oxide, hydrofluorocarbons, perfluorocarbons, and sulphur hexafluoride. Each is converted to CO₂-equivalent using its global warming potential.",
        "For a business, this covers direct emissions from fuel and vehicles (Scope 1), purchased electricity (Scope 2), and value-chain emissions like travel, purchased goods, and product use (Scope 3)."] },
      { heading: "How you measure it", body: [
        "Collect activity data - litres of fuel, kWh of electricity, kilometres travelled - then multiply each by a published emission factor. The GHG Protocol is the recognised global methodology.",
        "For SMEs, a full Scope 1 + 2 inventory typically takes 2-4 weeks the first time and can be automated afterwards. Scope 3 is estimated using spend-based or supplier-specific factors."] },
      { heading: "Why it matters in 2026", body: [
        "EU regulations (CSRD, CBAM, EU Taxonomy) now require thousands of companies to disclose their carbon footprint. Customers, banks, and insurers ask for it. Employees screen it before joining.",
        "Even without a regulatory obligation, knowing your footprint identifies where energy costs are highest - the same measurement that satisfies auditors also cuts bills."] },
    ],
    keyTakeaways: [
      "Carbon footprint = total GHG emissions in tCO₂e for a defined boundary.",
      "Business footprints follow the GHG Protocol and are split into Scope 1, 2, and 3.",
      "Measurement multiplies activity data by emission factors.",
      "Required by CSRD, CBAM, and EU Taxonomy - and asked for by customers and banks.",
    ],
    faq: [
      { q: "What's the difference between carbon footprint and carbon emissions?", a: "'Emissions' refers to the release itself; 'footprint' is the total over a defined boundary (a year, a product, an organisation)." },
      { q: "Is a personal footprint different from a business one?", a: "The concept is identical; only the boundary changes. Businesses use the GHG Protocol; individuals use household calculators." },
      { q: "How accurate does it need to be?", a: "For disclosure, the GHG Protocol requires materiality-based accuracy - roughly ±5% for Scope 1/2 and higher tolerance for Scope 3 spend-based estimates." },
      { q: "Do I need software?", a: "Small firms can start in a spreadsheet. Beyond 20-30 emission sources or annual re-reporting, software pays back quickly." },
    ],
    ctaHeading: "Measure your footprint in a weekend",
    ctaBody: "VerdeIQ automates Scope 1, 2, and material Scope 3 for Cyprus SMEs with pre-mapped emission factors and one-click reports.",
  },
  el: {
    title: "Τι Είναι το Αποτύπωμα Άνθρακα; Απλός Οδηγός",
    metaTitle: "Τι Είναι το Αποτύπωμα Άνθρακα; Ορισμός & Μέτρηση",
    metaDescription: "Το αποτύπωμα άνθρακα είναι οι συνολικές εκπομπές GHG μιας δραστηριότητας, ατόμου ή επιχείρησης. Δείτε τι σημαίνει και πώς μετριέται.",
    heroEyebrow: "Βασικά",
    heroSubtitle: "Η πιο δημοφιλής κλιματική ερώτηση - απαντημένη χωρίς jargon.",
    tocLabel: "Σε αυτή τη σελίδα",
    introduction: [
      "Αποτύπωμα άνθρακα είναι το σύνολο των αερίων του θερμοκηπίου που εκπέμπονται από μια δραστηριότητα, προϊόν ή οργανισμό, εκφρασμένο σε τόνους CO₂-ισοδύναμα (tCO₂e).",
      "Εφαρμόζεται σε κάθε κλίμακα - μόνο τα όρια αλλάζουν.",
    ],
    sections: [
      { heading: "Τι μετριέται", body: [
        "Έξι αέρια Kyoto: CO₂, μεθάνιο, N₂O, HFC, PFC, SF₆.",
        "Για επιχείρηση: Scope 1 (καύση/οχήματα), Scope 2 (ηλεκτρισμός), Scope 3 (αλυσίδα αξίας)."] },
      { heading: "Πώς μετριέται", body: [
        "Δεδομένα δραστηριότητας × συντελεστές εκπομπών. Πρότυπο: GHG Protocol.",
        "Για ΜμΕ: 2-4 εβδομάδες αρχική εφαρμογή, μετά αυτοματοποιείται."] },
      { heading: "Γιατί έχει σημασία", body: [
        "CSRD, CBAM, EU Taxonomy το απαιτούν. Πελάτες και τράπεζες το ζητούν.",
        "Η μέτρηση εντοπίζει και τα υψηλότερα ενεργειακά κόστη."] },
    ],
    keyTakeaways: ["Σύνολο GHG σε tCO₂e.", "Scope 1/2/3 βάσει GHG Protocol.", "Απαιτείται από CSRD/CBAM.", "Ταυτόχρονα μειώνει κόστη."],
    faq: [
      { q: "Διαφορά με εκπομπές;", a: "Εκπομπές = η ίδια η έκλυση· αποτύπωμα = σύνολο σε ορισμένο όριο." },
      { q: "Ατομικό vs επιχειρηματικό;", a: "Ίδια έννοια, διαφορετικά όρια." },
      { q: "Πόσο ακριβές;", a: "GHG Protocol: ±5% για Scope 1/2." },
      { q: "Χρειάζομαι λογισμικό;", a: "Μικρές: excel. Πέραν 20-30 πηγών: λογισμικό." },
    ],
    ctaHeading: "Μετρήστε το αποτύπωμα σε ένα ΣΚ",
    ctaBody: "Η VerdeIQ αυτοματοποιεί Scope 1/2/3 για ΜμΕ Κύπρου.",
  },
});
