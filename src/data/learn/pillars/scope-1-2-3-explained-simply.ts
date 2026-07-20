import { makePillar } from "./_factory";

export const scope123ExplainedSimply = makePillar({
  slug: "scope-1-2-3-explained-simply",
  category: "carbon",
  primaryKeyword: "scope 1 2 3 explained",
  monthlyVolume: 8100,
  readingMinutes: 6,
  heroImage: "/assets/learn/scope-1-2-3-emissions/hero.jpg",
  relatedSlugs: ["scope-1-2-3-emissions", "scope-3-emissions-calculation", "ghg-protocol-guide", "what-is-a-carbon-footprint"],
  en: {
    title: "Scope 1, 2, and 3 Emissions Explained Simply",
    metaTitle: "Scope 1, 2, 3 Emissions Explained Simply (With Examples)",
    metaDescription: "Scope 1 is what you burn, Scope 2 is what you buy, Scope 3 is everything else. Here's what each scope covers - with real business examples.",
    heroEyebrow: "Basics",
    heroSubtitle: "Three simple boundaries invented by the GHG Protocol so every company on Earth counts emissions the same way.",
    tocLabel: "On this page",
    introduction: [
      "Scope 1, 2, and 3 are the three categories the GHG Protocol uses to split a company's emissions. They exist so two companies can be compared without double-counting.",
      "The shortcut: Scope 1 is what you burn, Scope 2 is what you buy (as energy), and Scope 3 is everything else across your value chain.",
    ],
    sections: [
      { heading: "Scope 1 - direct emissions", body: [
        "Emissions from sources you own or control: fuel burned in company vehicles, natural gas in boilers, refrigerant leaks, on-site diesel generators.",
        "Example: a bakery's oven gas, a delivery firm's van diesel, a hotel's boiler fuel."] },
      { heading: "Scope 2 - purchased energy", body: [
        "Indirect emissions from electricity, steam, heat, or cooling your business buys and consumes on-site.",
        "Example: the electricity powering your office lights, servers, and HVAC. Reported two ways - location-based (grid average) and market-based (reflecting green contracts)."] },
      { heading: "Scope 3 - everything else", body: [
        "The 15 categories covering your value chain: purchased goods, business travel, employee commuting, waste, transportation, use of sold products, investments.",
        "Usually the biggest slice. For a professional services firm, Scope 3 is often 80-90% of the total."] },
      { heading: "Why the split matters", body: [
        "Scope 1 and 2 are your direct responsibility and required by every framework (CSRD, CBAM, SBTi, EU Taxonomy). Scope 3 is required for CSRD when material and always required by SBTi for companies where it exceeds 40% of the total."] },
    ],
    keyTakeaways: [
      "Scope 1 = burn, Scope 2 = buy, Scope 3 = everything else.",
      "Scope 2 has two reporting methods: location-based and market-based.",
      "Scope 3 is usually the biggest slice - and is where reductions have the most impact.",
      "The GHG Protocol is the recognised methodology behind all three scopes.",
    ],
    faq: [
      { q: "Do I have to report all three?", a: "Scope 1 and 2 are required by every framework. Scope 3 is required by CSRD when material and by SBTi when it exceeds 40% of total emissions." },
      { q: "Isn't Scope 3 double-counted with my supplier's Scope 1?", a: "Yes, and that's intentional - it lets you see the emissions embedded in what you buy, and lets your supplier see their own direct impact. Both perspectives matter." },
      { q: "How do I start with Scope 3?", a: "Estimate using spend-based factors first, then refine the biggest categories with supplier-specific data. Perfection is not the goal in year one." },
    ],
    ctaHeading: "Get Scope 1, 2, and 3 in one place",
    ctaBody: "VerdeIQ pre-maps common activity data to GHG Protocol categories so you get a defensible scope split without a consultant.",
  },
  el: {
    title: "Scope 1, 2, 3: Απλή Επεξήγηση",
    metaTitle: "Scope 1, 2, 3 Εκπομπές: Απλή Επεξήγηση με Παραδείγματα",
    metaDescription: "Scope 1: όσα καίτε. Scope 2: όσα αγοράζετε ως ενέργεια. Scope 3: όλα τα άλλα. Δείτε τι καλύπτει το καθένα.",
    heroEyebrow: "Βασικά",
    heroSubtitle: "Τρία απλά όρια του GHG Protocol για να μετρούν όλοι τις εκπομπές με τον ίδιο τρόπο.",
    tocLabel: "Σε αυτή τη σελίδα",
    introduction: [
      "Οι κατηγορίες Scope 1/2/3 δημιουργήθηκαν από το GHG Protocol για συγκρίσιμες μετρήσεις χωρίς διπλή καταμέτρηση.",
      "Συντόμευση: Scope 1 = ό,τι καίτε, Scope 2 = ενέργεια που αγοράζετε, Scope 3 = όλα τα υπόλοιπα.",
    ],
    sections: [
      { heading: "Scope 1 - άμεσες", body: ["Καύσιμα οχημάτων/λεβήτων, διαρροές ψυκτικών, γεννήτριες.", "Παράδειγμα: φούρνος αερίου, πετρέλαιο θέρμανσης."] },
      { heading: "Scope 2 - αγορασμένη ενέργεια", body: ["Ηλεκτρισμός/ατμός/θέρμανση/ψύξη που καταναλώνετε.", "Δύο μέθοδοι: location-based, market-based."] },
      { heading: "Scope 3 - όλα τα άλλα", body: ["15 κατηγορίες αλυσίδας αξίας.", "Συνήθως το μεγαλύτερο τμήμα (80-90% για υπηρεσίες)."] },
      { heading: "Γιατί μετράει", body: ["Scope 1/2 απαιτούνται από όλα τα πλαίσια. Scope 3 από CSRD (όταν ουσιώδες) και SBTi (όταν >40%)."] },
    ],
    keyTakeaways: ["Scope 1: καύση. Scope 2: αγορά. Scope 3: υπόλοιπα.", "Scope 2: δύο μέθοδοι.", "Scope 3: μεγαλύτερος αντίκτυπος.", "GHG Protocol παντού."],
    faq: [
      { q: "Χρειάζονται και τα τρία;", a: "Scope 1/2 πάντα. Scope 3 όταν είναι ουσιώδες." },
      { q: "Διπλή καταμέτρηση;", a: "Ναι, εσκεμμένα - βλέπετε ενσωματωμένες εκπομπές και ο προμηθευτής τις δικές του." },
      { q: "Πώς ξεκινώ Scope 3;", a: "Ξεκινήστε από spend-based, βελτιώστε τις μεγάλες κατηγορίες με στοιχεία προμηθευτών." },
    ],
    ctaHeading: "Όλα τα Scopes σε ένα μέρος",
    ctaBody: "Η VerdeIQ αντιστοιχίζει δραστηριότητες σε κατηγορίες GHG Protocol.",
  },
});
