import { makePillar } from "./_factory";

export const csrdReportingCyprus = makePillar({
  slug: "csrd-reporting-cyprus",
  category: "cyprus",
  primaryKeyword: "CSRD Cyprus",
  monthlyVolume: 0,
  readingMinutes: 8,
  publishedAt: "2026-07-08",
  updatedAt: "2026-10-01",
  relatedSlugs: ["csrd-reporting-guide", "vsme-reporting-guide", "green-loans-esg-data-smes", "esg-software-cyprus"],
  en: {
    title: "CSRD in Cyprus After the Omnibus: Which Cypriot Companies Still Report",
    metaTitle: "CSRD Cyprus 2026: Who Reports After the Omnibus",
    metaDescription:
      "What the 2025 CSRD simplification means for Cyprus: very few local companies stay in scope, but suppliers to large groups and bank borrowers will still need sustainability data.",
    heroEyebrow: "Cyprus regulatory guide, updated October 2026",
    heroSubtitle:
      "With thresholds raised to more than 1,000 employees and €450 million turnover, only a handful of Cypriot companies will file CSRD reports. For everyone else, the real pressure comes from customers and banks.",
    tocLabel: "On this page",
    introduction: [
      "Most businesses in Cyprus are small or micro enterprises. Even under the original CSRD scope only a limited number of local companies would have reported. After the Omnibus agreement of December 2025, that number falls to a small group of the largest banks, insurers, listed groups and international subsidiaries.",
      "This does not mean sustainability data has stopped mattering. Cypriot banks must consider climate and environmental risks when they lend, EU customers are asking suppliers for emissions figures, and public funding calls increasingly ask for them too.",
    ],
    sections: [
      {
        heading: "Who in Cyprus is still in scope",
        body: [
          "Cypriot companies with more than 1,000 employees and net turnover above €450 million, on an individual or consolidated basis. Large banks and some listed groups are the obvious candidates.",
          "Cyprus-based subsidiaries of large EU groups are usually covered through their parent's consolidated report rather than reporting separately, but they still have to supply data to the parent.",
          "Holding and shipping structures registered in Cyprus need case-by-case analysis based on consolidated figures. Ask your auditor rather than relying on the registered office alone.",
        ],
      },
      {
        heading: "Where local businesses will feel it",
        body: [
          "Supplier questionnaires: hotels supplying international tour operators, food producers selling to EU retailers and contractors working for large groups will get data requests. Under the value-chain cap, those requests should not go beyond the voluntary SME standard (VSME).",
          "Bank lending: Cypriot banks follow European Banking Authority loan origination guidelines and ECB expectations on climate risk, which means asking business borrowers about energy use, emissions and transition plans.",
          "Funding and tenders: EU-funded programmes and many public tenders ask for environmental information, and some score it.",
        ],
      },
      {
        heading: "What a Cypriot SME should prepare",
        body: [
          "A yearly dataset following the VSME Basic Module: electricity from EAC bills, fuel for vehicles and generators, water, waste, headcount and basic policies.",
          "Scope 2 emissions calculated with a published Cyprus grid factor, with the factor's source and year recorded. Cyprus's grid is still largely oil-fired, so electricity is often the biggest part of a small company's footprint.",
          "Evidence kept with each figure: the bill, the meter reading or the invoice. That is what turns a number into something a bank or customer can rely on.",
        ],
      },
    ],
    keyTakeaways: [
      "After the Omnibus, only Cypriot companies with more than 1,000 employees and €450 million turnover file CSRD reports.",
      "Subsidiaries of large EU groups usually feed data into their parent's report.",
      "Most local SMEs are affected through supplier questionnaires, bank lending and funding calls.",
      "A sourced VSME-style dataset built from EAC bills and real records covers most requests.",
    ],
    faq: [
      {
        q: "Does my Cypriot SME have to file a CSRD report?",
        a: "Almost certainly not. The thresholds are now more than 1,000 employees and more than €450 million turnover.",
      },
      {
        q: "A large client sent us a long ESG questionnaire. Do we have to answer everything?",
        a: "Under the value-chain cap, large reporting companies should not require more than the VSME standard from partners with fewer than 1,000 employees, apart from data that is customary in the sector. Answer what VSME covers, with evidence.",
      },
      {
        q: "Which Cyprus grid emission factor should we use?",
        a: "Use a published, dated factor and record the source, for example the national inventory or official EU datasets. Do not mix factors from different years without noting it.",
      },
      {
        q: "Who supervises CSRD reporting in Cyprus?",
        a: "Reports are part of the management report and checked by statutory auditors, with oversight by the Cyprus Public Audit Oversight Board. Listed companies are also supervised by the Cyprus Securities and Exchange Commission.",
      },
    ],
    ctaHeading: "Be ready when a client or bank asks",
    ctaBody:
      "Vuneli reads your EAC and water bills, calculates emissions with published Cyprus factors and keeps the evidence behind every figure, so you can answer supplier and bank questions in minutes.",
  },
  el: {
    title: "Η CSRD στην Κύπρο μετά το Omnibus: Ποιες Κυπριακές Εταιρείες Υποβάλλουν Ακόμη",
    metaTitle: "CSRD Κύπρος 2026: Ποιοι Υποβάλλουν μετά το Omnibus",
    metaDescription:
      "Τι σημαίνει η απλοποίηση της CSRD για την Κύπρο: ελάχιστες εταιρείες παραμένουν υπόχρεες, αλλά προμηθευτές μεγάλων ομίλων και δανειολήπτες θα χρειάζονται δεδομένα βιωσιμότητας.",
    heroEyebrow: "Κυπριακός ρυθμιστικός οδηγός, ενημέρωση Οκτωβρίου 2026",
    heroSubtitle:
      "Με όρια πάνω από 1.000 εργαζόμενους και €450 εκατ. κύκλο εργασιών, ελάχιστες κυπριακές εταιρείες θα υποβάλουν έκθεση CSRD. Για όλες τις άλλες, η πραγματική πίεση έρχεται από πελάτες και τράπεζες.",
    tocLabel: "Σε αυτή τη σελίδα",
    introduction: [
      "Οι περισσότερες επιχειρήσεις στην Κύπρο είναι μικρές ή πολύ μικρές. Ακόμη και με το αρχικό πεδίο της CSRD λίγες τοπικές εταιρείες θα υπέβαλλαν. Μετά τη συμφωνία Omnibus του Δεκεμβρίου 2025, ο αριθμός περιορίζεται σε μια μικρή ομάδα μεγάλων τραπεζών, ασφαλιστικών, εισηγμένων ομίλων και διεθνών θυγατρικών.",
      "Αυτό δεν σημαίνει ότι τα δεδομένα βιωσιμότητας έπαψαν να μετρούν. Οι κυπριακές τράπεζες πρέπει να λαμβάνουν υπόψη κλιματικούς κινδύνους όταν δανείζουν, πελάτες στην ΕΕ ζητούν στοιχεία εκπομπών από προμηθευτές και όλο και περισσότερες προσκλήσεις χρηματοδότησης τα ζητούν επίσης.",
    ],
    sections: [
      {
        heading: "Ποιοι στην Κύπρο παραμένουν υπόχρεοι",
        body: [
          "Κυπριακές εταιρείες με περισσότερους από 1.000 εργαζόμενους και καθαρό κύκλο εργασιών άνω των €450 εκατ., σε ατομική ή ενοποιημένη βάση. Μεγάλες τράπεζες και ορισμένοι εισηγμένοι όμιλοι είναι οι προφανείς περιπτώσεις.",
          "Θυγατρικές μεγάλων ευρωπαϊκών ομίλων στην Κύπρο συνήθως καλύπτονται από την ενοποιημένη έκθεση της μητρικής, αλλά πρέπει να της παρέχουν δεδομένα.",
          "Εταιρείες συμμετοχών και ναυτιλιακές δομές με έδρα στην Κύπρο χρειάζονται ανάλυση ανά περίπτωση με βάση τα ενοποιημένα στοιχεία. Συμβουλευτείτε τον ελεγκτή σας.",
        ],
      },
      {
        heading: "Πού θα το νιώσουν οι τοπικές επιχειρήσεις",
        body: [
          "Ερωτηματολόγια προμηθευτών: ξενοδοχεία που συνεργάζονται με διεθνείς tour operators, παραγωγοί τροφίμων που πουλούν σε ευρωπαϊκές αλυσίδες και εργολάβοι μεγάλων ομίλων θα λαμβάνουν αιτήματα. Βάσει του ορίου της αλυσίδας αξίας, δεν πρέπει να ξεπερνούν το εθελοντικό πρότυπο VSME.",
          "Τραπεζικός δανεισμός: οι κυπριακές τράπεζες ακολουθούν τις κατευθυντήριες γραμμές της Ευρωπαϊκής Αρχής Τραπεζών για τη χορήγηση δανείων και τις προσδοκίες της ΕΚΤ για τον κλιματικό κίνδυνο, άρα ρωτούν για ενέργεια, εκπομπές και σχέδια μετάβασης.",
          "Χρηματοδότηση και διαγωνισμοί: προγράμματα της ΕΕ και πολλοί δημόσιοι διαγωνισμοί ζητούν περιβαλλοντικές πληροφορίες και ορισμένοι τις βαθμολογούν.",
        ],
      },
      {
        heading: "Τι να ετοιμάσει μια κυπριακή ΜμΕ",
        body: [
          "Ένα ετήσιο σύνολο δεδομένων κατά τη Βασική Ενότητα του VSME: ρεύμα από λογαριασμούς ΑΗΚ, καύσιμα οχημάτων και γεννητριών, νερό, απόβλητα, προσωπικό και βασικές πολιτικές.",
          "Εκπομπές Πεδίου 2 με δημοσιευμένο συντελεστή του κυπριακού δικτύου, με καταγεγραμμένη πηγή και έτος. Το δίκτυο της Κύπρου βασίζεται ακόμη κυρίως στο πετρέλαιο, οπότε το ρεύμα είναι συχνά το μεγαλύτερο μέρος του αποτυπώματος μιας μικρής εταιρείας.",
          "Τεκμηρίωση για κάθε αριθμό: ο λογαριασμός, η ένδειξη μετρητή ή το τιμολόγιο. Αυτό κάνει έναν αριθμό αξιόπιστο για τράπεζα ή πελάτη.",
        ],
      },
    ],
    keyTakeaways: [
      "Μετά το Omnibus, έκθεση CSRD υποβάλλουν μόνο κυπριακές εταιρείες με πάνω από 1.000 εργαζόμενους και €450 εκατ. κύκλο εργασιών.",
      "Οι θυγατρικές μεγάλων ευρωπαϊκών ομίλων συνήθως τροφοδοτούν την έκθεση της μητρικής.",
      "Οι περισσότερες ΜμΕ επηρεάζονται μέσω ερωτηματολογίων προμηθευτών, δανεισμού και προσκλήσεων χρηματοδότησης.",
      "Ένα τεκμηριωμένο σύνολο τύπου VSME από λογαριασμούς ΑΗΚ και πραγματικά αρχεία καλύπτει τα περισσότερα αιτήματα.",
    ],
    faq: [
      {
        q: "Πρέπει η κυπριακή ΜμΕ μου να υποβάλει έκθεση CSRD;",
        a: "Σχεδόν σίγουρα όχι. Τα όρια είναι πλέον πάνω από 1.000 εργαζόμενοι και πάνω από €450 εκατ. κύκλος εργασιών.",
      },
      {
        q: "Μεγάλος πελάτης μάς έστειλε μακροσκελές ερωτηματολόγιο ESG. Πρέπει να απαντήσουμε σε όλα;",
        a: "Οι μεγάλες υπόχρεες εταιρείες δεν πρέπει να απαιτούν από συνεργάτες κάτω των 1.000 εργαζομένων περισσότερα από το VSME, εκτός από δεδομένα συνήθη στον κλάδο. Απαντήστε όσα καλύπτει το VSME, με τεκμηρίωση.",
      },
      {
        q: "Ποιον συντελεστή εκπομπών του κυπριακού δικτύου να χρησιμοποιήσουμε;",
        a: "Έναν δημοσιευμένο, χρονολογημένο συντελεστή με καταγεγραμμένη πηγή, π.χ. από την εθνική απογραφή ή επίσημα σύνολα δεδομένων της ΕΕ. Μην αναμειγνύετε συντελεστές διαφορετικών ετών χωρίς σημείωση.",
      },
      {
        q: "Ποιος εποπτεύει την αναφορά CSRD στην Κύπρο;",
        a: "Οι εκθέσεις είναι μέρος της έκθεσης διαχείρισης και ελέγχονται από νόμιμους ελεγκτές, με εποπτεία από το Σώμα Εποπτείας Ελεγκτικού Επαγγέλματος. Οι εισηγμένες εποπτεύονται και από την Επιτροπή Κεφαλαιαγοράς Κύπρου.",
      },
    ],
    ctaHeading: "Να είστε έτοιμοι όταν ρωτήσει πελάτης ή τράπεζα",
    ctaBody:
      "Η Vuneli διαβάζει τους λογαριασμούς ΑΗΚ και νερού, υπολογίζει εκπομπές με δημοσιευμένους κυπριακούς συντελεστές και κρατά την τεκμηρίωση κάθε αριθμού, ώστε να απαντάτε σε προμηθευτές και τράπεζες σε λίγα λεπτά.",
  },
});
