import { makePillar } from "./_factory";

export const cbamDefaultValuesExplained = makePillar({
  slug: "cbam-default-values-explained",
  category: "cbam",
  primaryKeyword: "CBAM default values",
  readingMinutes: 8,
  publishedAt: "2026-10-01",
  updatedAt: "2026-10-01",
  relatedSlugs: ["cbam-cyprus", "cbam-explained", "cbam-authorisation-declarant-portal", "scope-3-emissions-calculation"],
  en: {
    title: "CBAM Default Values Explained: What They Are, the Mark-Up, and When Actual Data Pays Off",
    metaTitle: "CBAM Default Values 2026: Mark-Ups and How to Use Them",
    metaDescription:
      "How the Commission's CBAM default values work in the definitive period: country tables, the 10%, 20% and 30% mark-ups, and when supplier data is worth chasing.",
    heroEyebrow: "CBAM guide",
    heroSubtitle:
      "When a supplier cannot give you verified emissions, CBAM lets you use official default values per product and country. They are legal and simple, but deliberately cautious, and they get more expensive each year.",
    tocLabel: "On this page",
    introduction: [
      "Every CBAM declaration needs a figure for the embedded emissions of each imported good, in tonnes of CO2 equivalent per tonne of product. You can use actual emissions reported by the producing installation and verified by an accredited verifier, or default values published by the European Commission.",
      "For the definitive period, default values are set in Commission Implementing Regulation (EU) 2025/2621. Annexes I and IV were replaced by Implementing Regulation (EU) 2026/1740, published in the Official Journal on 31 July 2026 and applying from 1 January 2026. Those are the values Vuneli uses.",
    ],
    sections: [
      {
        heading: "How the tables are built",
        body: [
          "Default values are listed per CN code (product) and per country of origin. Where the Commission did not have reliable data for a country, an EU-wide fallback value applies. Values are given for direct emissions and, where relevant, indirect emissions from electricity used in production.",
          "They are based on the average emissions intensity of producers in each exporting country, adjusted upward so that using defaults is not cheaper than reporting real data from an average plant.",
        ],
      },
      {
        heading: "The mark-up",
        body: [
          "On top of the table value, a mark-up is applied when working out how many certificates you need: 10% for 2026 imports, 20% for 2027 and 30% from 2028. For fertilisers, the mark-up for 2026 is 1%, reflecting the sector's specific situation.",
          "The rising mark-up is intentional. It gives importers a growing financial reason to obtain verified data from their suppliers rather than relying on defaults indefinitely.",
        ],
      },
      {
        heading: "A worked example",
        body: [
          "Suppose you import 500 tonnes of a steel product in 2026 for which the default value for the country of origin is 2.0 tCO2e per tonne. Embedded emissions are 500 × 2.0 = 1,000 tCO2e. With the 10% mark-up, certificates are calculated on 1,100 tCO2e, before deducting the free allocation adjustment and any carbon price effectively paid in the country of origin.",
          "If the mill supplies verified data showing 1.6 tCO2e per tonne, embedded emissions fall to 800 tCO2e and no mark-up applies. That is 300 fewer tonnes of certificate exposure on a single product line. Figures here are illustrative; use the published table value for your exact CN code and origin.",
        ],
      },
      {
        heading: "When defaults are the right call",
        body: [
          "For small or irregular imports, or products from many different suppliers, the effort to collect verified data may not pay back. Defaults are a lawful, defensible choice.",
          "For your largest product lines and repeat suppliers, request verified data. Even a few suppliers moving from defaults to actual data usually changes the total materially.",
        ],
      },
      {
        heading: "Practical tips",
        body: [
          "Record which table, version and date each value came from. If the Commission updates the tables, you need to show which values applied to which imports.",
          "Keep supplier replies even when they arrive incomplete. Partial data can still help identify the production route, which affects which default applies.",
        ],
      },
    ],
    keyTakeaways: [
      "Definitive-period default values are in Implementing Regulation (EU) 2025/2621, with Annexes I and IV replaced by Regulation (EU) 2026/1740.",
      "Values are per CN code and country of origin, with an EU fallback where country data is missing.",
      "A mark-up of 10% (2026), 20% (2027) and 30% (2028) applies; fertilisers carry 1% in 2026.",
      "Verified supplier data removes the mark-up and often lowers emissions further.",
      "Record the exact table version used for every import.",
    ],
    faq: [
      {
        q: "Are CBAM default values legal to use in the definitive period?",
        a: "Yes. Default values are an accepted basis for the declaration when actual verified data is not available.",
      },
      {
        q: "Where can I find the official default values?",
        a: "In Implementing Regulation (EU) 2025/2621 as amended by Regulation (EU) 2026/1740, published on EUR-Lex. Vuneli reads the values directly from that text.",
      },
      {
        q: "Does the mark-up apply to actual data?",
        a: "No. The mark-up only applies when default values are used.",
      },
      {
        q: "What if my supplier's country is not in the table?",
        a: "An EU-wide fallback default value applies to that product.",
      },
    ],
    ctaHeading: "See your CBAM exposure with official values",
    ctaBody:
      "Vuneli applies the Commission's published default values and mark-ups to your imports, shows which suppliers would make the biggest difference with verified data, and keeps the source of every figure.",
  },
  el: {
    title: "Οι Προεπιλεγμένες Τιμές του CBAM: Τι Είναι, η Προσαύξηση και Πότε Αξίζουν τα Πραγματικά Δεδομένα",
    metaTitle: "Προεπιλεγμένες Τιμές CBAM 2026: Προσαυξήσεις και Χρήση",
    metaDescription:
      "Πώς λειτουργούν οι προεπιλεγμένες τιμές CBAM της Επιτροπής στην οριστική περίοδο: πίνακες ανά χώρα, προσαυξήσεις 10%, 20%, 30% και πότε αξίζει να ζητήσετε δεδομένα προμηθευτών.",
    heroEyebrow: "Οδηγός CBAM",
    heroSubtitle:
      "Όταν ένας προμηθευτής δεν μπορεί να δώσει επαληθευμένες εκπομπές, ο CBAM επιτρέπει επίσημες προεπιλεγμένες τιμές ανά προϊόν και χώρα. Είναι νόμιμες και απλές, αλλά σκόπιμα συντηρητικές, και ακριβαίνουν κάθε χρόνο.",
    tocLabel: "Σε αυτή τη σελίδα",
    introduction: [
      "Κάθε δήλωση CBAM χρειάζεται τις ενσωματωμένες εκπομπές κάθε εισαγόμενου αγαθού, σε τόνους CO2 ισοδύναμου ανά τόνο προϊόντος. Μπορείτε να χρησιμοποιήσετε πραγματικές εκπομπές της εγκατάστασης παραγωγής, επαληθευμένες από διαπιστευμένο επαληθευτή, ή τις προεπιλεγμένες τιμές της Ευρωπαϊκής Επιτροπής.",
      "Για την οριστική περίοδο, οι προεπιλεγμένες τιμές ορίζονται στον Εκτελεστικό Κανονισμό (ΕΕ) 2025/2621. Τα Παραρτήματα I και IV αντικαταστάθηκαν από τον Εκτελεστικό Κανονισμό (ΕΕ) 2026/1740, που δημοσιεύθηκε στην Επίσημη Εφημερίδα στις 31 Ιουλίου 2026 και ισχύει από 1 Ιανουαρίου 2026. Αυτές τις τιμές χρησιμοποιεί η Vuneli.",
    ],
    sections: [
      {
        heading: "Πώς είναι δομημένοι οι πίνακες",
        body: [
          "Οι τιμές δίνονται ανά κωδικό ΣΟ (προϊόν) και ανά χώρα καταγωγής. Όπου η Επιτροπή δεν είχε αξιόπιστα στοιχεία για μια χώρα, ισχύει ενιαία τιμή ΕΕ. Δίνονται άμεσες εκπομπές και, όπου χρειάζεται, έμμεσες από το ρεύμα που χρησιμοποιείται στην παραγωγή.",
          "Βασίζονται στη μέση ένταση εκπομπών των παραγωγών κάθε χώρας, προσαρμοσμένη προς τα πάνω ώστε οι προεπιλεγμένες τιμές να μην είναι φθηνότερες από πραγματικά δεδομένα ενός μέσου εργοστασίου.",
        ],
      },
      {
        heading: "Η προσαύξηση",
        body: [
          "Πάνω στην τιμή του πίνακα εφαρμόζεται προσαύξηση για τον υπολογισμό των πιστοποιητικών: 10% για τις εισαγωγές του 2026, 20% για το 2027 και 30% από το 2028. Για τα λιπάσματα η προσαύξηση του 2026 είναι 1%.",
          "Η αυξανόμενη προσαύξηση είναι σκόπιμη: δίνει στους εισαγωγείς όλο και μεγαλύτερο οικονομικό λόγο να ζητούν επαληθευμένα δεδομένα από τους προμηθευτές τους.",
        ],
      },
      {
        heading: "Παράδειγμα υπολογισμού",
        body: [
          "Ας πούμε ότι εισάγετε 500 τόνους ενός προϊόντος χάλυβα το 2026, με προεπιλεγμένη τιμή 2,0 tCO2e ανά τόνο για τη χώρα καταγωγής. Οι ενσωματωμένες εκπομπές είναι 500 × 2,0 = 1.000 tCO2e. Με προσαύξηση 10%, τα πιστοποιητικά υπολογίζονται σε 1.100 tCO2e, πριν από την προσαρμογή για τη δωρεάν κατανομή και τυχόν τιμή άνθρακα που καταβλήθηκε στη χώρα καταγωγής.",
          "Αν το χαλυβουργείο δώσει επαληθευμένα δεδομένα 1,6 tCO2e ανά τόνο, οι εκπομπές πέφτουν στους 800 tCO2e χωρίς προσαύξηση: 300 τόνοι λιγότερη έκθεση σε πιστοποιητικά για ένα μόνο προϊόν. Τα νούμερα είναι ενδεικτικά· χρησιμοποιήστε την επίσημη τιμή για τον ακριβή κωδικό και την καταγωγή σας.",
        ],
      },
      {
        heading: "Πότε είναι σωστή επιλογή οι προεπιλεγμένες τιμές",
        body: [
          "Για μικρές ή ακανόνιστες εισαγωγές ή προϊόντα από πολλούς διαφορετικούς προμηθευτές, η προσπάθεια συλλογής επαληθευμένων δεδομένων μπορεί να μην αποδίδει. Οι προεπιλεγμένες τιμές είναι νόμιμη και τεκμηριωμένη επιλογή.",
          "Για τα μεγαλύτερα προϊόντα σας και τους σταθερούς προμηθευτές, ζητήστε επαληθευμένα δεδομένα. Ακόμη και λίγοι προμηθευτές που περνούν σε πραγματικά δεδομένα συνήθως αλλάζουν σημαντικά το σύνολο.",
        ],
      },
      {
        heading: "Πρακτικές συμβουλές",
        body: [
          "Καταγράφετε από ποιον πίνακα, έκδοση και ημερομηνία προήλθε κάθε τιμή. Αν η Επιτροπή ενημερώσει τους πίνακες, πρέπει να φαίνεται ποιες τιμές ίσχυαν για ποιες εισαγωγές.",
          "Κρατάτε τις απαντήσεις των προμηθευτών ακόμη κι αν είναι ελλιπείς· βοηθούν να προσδιοριστεί η μέθοδος παραγωγής, που επηρεάζει ποια τιμή ισχύει.",
        ],
      },
    ],
    keyTakeaways: [
      "Οι προεπιλεγμένες τιμές της οριστικής περιόδου βρίσκονται στον Κανονισμό (ΕΕ) 2025/2621, με τα Παραρτήματα I και IV να έχουν αντικατασταθεί από τον Κανονισμό (ΕΕ) 2026/1740.",
      "Οι τιμές δίνονται ανά κωδικό ΣΟ και χώρα καταγωγής, με ενιαία τιμή ΕΕ όπου λείπουν στοιχεία.",
      "Προσαύξηση 10% (2026), 20% (2027) και 30% (2028)· για τα λιπάσματα 1% το 2026.",
      "Τα επαληθευμένα δεδομένα προμηθευτών αφαιρούν την προσαύξηση και συχνά μειώνουν τις εκπομπές.",
      "Καταγράφετε την ακριβή έκδοση πίνακα για κάθε εισαγωγή.",
    ],
    faq: [
      {
        q: "Επιτρέπονται οι προεπιλεγμένες τιμές στην οριστική περίοδο;",
        a: "Ναι, όταν δεν υπάρχουν πραγματικά επαληθευμένα δεδομένα.",
      },
      {
        q: "Πού βρίσκω τις επίσημες τιμές;",
        a: "Στον Εκτελεστικό Κανονισμό (ΕΕ) 2025/2621, όπως τροποποιήθηκε από τον Κανονισμό (ΕΕ) 2026/1740, στο EUR-Lex. Η Vuneli διαβάζει τις τιμές απευθείας από αυτό το κείμενο.",
      },
      {
        q: "Εφαρμόζεται η προσαύξηση στα πραγματικά δεδομένα;",
        a: "Όχι. Μόνο όταν χρησιμοποιούνται προεπιλεγμένες τιμές.",
      },
      {
        q: "Τι γίνεται αν η χώρα του προμηθευτή δεν υπάρχει στον πίνακα;",
        a: "Ισχύει η ενιαία προεπιλεγμένη τιμή ΕΕ για το προϊόν.",
      },
    ],
    ctaHeading: "Δείτε την έκθεσή σας στον CBAM με επίσημες τιμές",
    ctaBody:
      "Η Vuneli εφαρμόζει τις επίσημες προεπιλεγμένες τιμές και προσαυξήσεις της Επιτροπής στις εισαγωγές σας, δείχνει ποιοι προμηθευτές θα έκαναν τη μεγαλύτερη διαφορά με επαληθευμένα δεδομένα και κρατά την πηγή κάθε αριθμού.",
  },
});
