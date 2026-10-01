import { makePillar } from "./_factory";

/**
 * Written 1 Oct 2026. Facts checked against:
 * - Reg. (EU) 2023/1115 (EUDR), as amended by Reg. (EU) 2025/2650 (OJ L 23.12.2025)
 * - Impl. Reg. (EU) 2026/1565 (simplified declarations, information system)
 * See docs/research/DEADLINES_2026-10-01.md.
 */
export const eudrGuide = makePillar({
  slug: "eudr-guide",
  category: "standards",
  primaryKeyword: "EUDR",
  monthlyVolume: 3600,
  readingMinutes: 9,
  publishedAt: "2026-10-01",
  updatedAt: "2026-10-01",
  relatedSlugs: ["cbam-cyprus", "eu-greenwashing-rules-2026", "scope-3-emissions-calculation", "csrd-reporting-guide"],
  en: {
    title: "EUDR Explained: The EU Deforestation Regulation After the 2025 Changes",
    metaTitle: "EUDR Explained: Dates, Scope and Duties (2026)",
    metaDescription:
      "Who the EU Deforestation Regulation applies to after the 2025 amendment, the 30 Dec 2026 and 30 Jun 2027 dates, and what operators and traders must do.",
    heroEyebrow: "EU regulation",
    heroSubtitle:
      "The EUDR bans cattle, cocoa, coffee, palm oil, rubber, soya and wood products from the EU market unless they are deforestation-free, legal and covered by a due diligence statement. Large and medium companies must comply from 30 December 2026.",
    tocLabel: "On this page",
    introduction: [
      "The EU Deforestation Regulation (Regulation (EU) 2023/1115, usually shortened to EUDR) was meant to apply from the end of 2024. It was postponed twice, and in December 2025 it was amended by Regulation (EU) 2025/2650, which also cut the paperwork for many businesses further down the supply chain.",
      "Much of what was written about the EUDR before 2026 is now out of date. This guide sets out the rules as they stand after the amendment: which products are covered, who carries the main duty, the new dates, and what a smaller company should do now.",
    ],
    sections: [
      {
        heading: "Which products are covered",
        body: [
          "The regulation covers seven commodities: cattle, cocoa, coffee, oil palm, rubber, soya and wood. It also covers products listed in its Annex I that contain them, were fed with them or were made with them. Examples include leather, chocolate, roasted coffee, palm-oil derivatives, tyres, furniture, paper, printed matter and charcoal.",
          "Whether a product is in scope depends on its customs code in Annex I, not its marketing description. A hotel buying coffee and furniture is affected through its suppliers. A Cypriot importer of timber, paper or cocoa products is directly affected.",
        ],
      },
      {
        heading: "The three conditions",
        body: [
          "Covered products may only be placed on the EU market, made available on it or exported from it if all three conditions are met.",
          "Deforestation-free: the commodity was produced on land that was not deforested after 31 December 2020. For wood, the forest was not degraded after that date.",
          "Legal: it was produced in line with the laws of the country of production, including land use, environmental, labour and tax laws.",
          "Covered by a due diligence statement: the company that first places it on the market has collected the information, assessed the risk, reduced it where needed, and filed a statement in the EU information system. That information includes the geolocation of the plots of land where it was produced.",
        ],
      },
      {
        heading: "Who has to do what after the 2025 amendment",
        body: [
          "Operators: the company that first places a covered product on the EU market, or exports it, carries the main duty. It must do the due diligence and file the statement. For goods arriving from outside the EU, this is normally the importer.",
          "Downstream operators and traders: companies that buy covered products already on the EU market and sell them on, or process them further, no longer have to file their own due diligence statements. They must still keep records of who supplied them and who they supplied, and keep the reference numbers of the statements that cover their goods.",
          "Micro and small primary operators: small producers who grow or raise the commodity themselves, in a low-risk country, can file a one-off simplified declaration instead of repeated statements. This was introduced by the 2025 amendment and set out in detail by Implementing Regulation (EU) 2026/1565.",
        ],
      },
      {
        heading: "The dates",
        body: [
          "30 December 2026: the rules apply to large and medium-sized operators and traders.",
          "30 June 2027: the rules apply to micro and small enterprises that were established by 31 December 2024.",
          "The amendment also asked the Commission to review the regulation's simplification. Watch for further changes, and check the consolidated text on EUR-Lex before relying on any summary, including this one.",
        ],
      },
      {
        heading: "What this means for businesses in Cyprus",
        body: [
          "Most Cypriot businesses are buyers of covered products rather than first importers, so after the amendment their main duty is to keep supplier and customer records and statement reference numbers.",
          "The exceptions are companies that bring covered goods in from outside the EU themselves: timber and wood-product traders, paper and packaging importers, coffee roasters and cocoa or chocolate importers, leather and furniture importers, and animal-feed traders bringing in soya. These are operators and need full due diligence, including geolocation data from their suppliers.",
          "Banks and large customers are starting to ask about EUDR in supplier questionnaires even when the law does not require a statement from you. A short written note on which covered products you handle, and how, answers most of these questions.",
        ],
      },
      {
        heading: "First steps",
        body: [
          "1. List every product you buy or sell that could fall under Annex I and note its customs code.",
          "2. For each one, decide whether you are the operator (first to place it on the EU market or export it) or a downstream operator or trader.",
          "3. If you are an operator, ask suppliers now for plot geolocation and proof of legality. This takes the longest.",
          "4. If you are downstream, set up a simple record of supplier names, customer names and statement reference numbers for each covered product.",
          "5. Note your applicable date: 30 December 2026 or, for micro and small enterprises established by the end of 2024, 30 June 2027.",
        ],
      },
    ],
    keyTakeaways: [
      "EUDR covers cattle, cocoa, coffee, oil palm, rubber, soya, wood and products made from them.",
      "Products must be deforestation-free (cut-off 31 December 2020), legal, and covered by a due diligence statement.",
      "After the 2025 amendment, the main duty sits with the company that first places the product on the EU market.",
      "Downstream operators and traders keep records and statement references instead of filing their own statements.",
      "Large and medium companies: 30 December 2026. Micro and small companies established by the end of 2024: 30 June 2027.",
    ],
    faq: [
      {
        q: "Has the EUDR been delayed again?",
        a: "It was postponed twice. Regulation (EU) 2025/2650 set the current dates: 30 December 2026 for large and medium companies and 30 June 2027 for micro and small companies established by 31 December 2024. Always check EUR-Lex for later changes.",
      },
      {
        q: "We only buy coffee from an EU distributor. Do we file anything?",
        a: "Usually not. As a downstream operator or trader you do not file your own statement. Keep a record of your supplier and of the statement reference numbers for the coffee you buy.",
      },
      {
        q: "What is geolocation data?",
        a: "The coordinates of the plots of land where the commodity was produced. For larger plots this is a polygon. Operators must collect it from their supply chain before filing a due diligence statement.",
      },
      {
        q: "Does EUDR apply to services or only goods?",
        a: "Only to goods listed in Annex I. Service companies are affected only through the covered products they buy, and then usually as downstream users rather than operators.",
      },
      {
        q: "What are the penalties?",
        a: "Member states set them, but the regulation requires them to be effective and dissuasive, including fines linked to turnover, confiscation of products and temporary exclusion from public contracts.",
      },
    ],
    ctaHeading: "Find out in one question whether EUDR applies to you",
    ctaBody:
      "Vuneli's deadline checker asks only what it needs, such as whether you place any covered commodity on the market, and shows the EUDR date that applies to your business, with the legal source.",
  },
  el: {
    title: "Ο EUDR με απλά λόγια: Ο Κανονισμός της ΕΕ για την Αποψίλωση μετά τις αλλαγές του 2025",
    metaTitle: "EUDR: Ημερομηνίες, πεδίο και υποχρεώσεις (2026)",
    metaDescription:
      "Ποιους αφορά ο Κανονισμός για την Αποψίλωση μετά την τροποποίηση του 2025, οι ημερομηνίες 30/12/2026 και 30/6/2027 και τι πρέπει να κάνουν φορείς και έμποροι.",
    heroEyebrow: "Νομοθεσία ΕΕ",
    heroSubtitle:
      "Ο EUDR απαγορεύει στην αγορά της ΕΕ βοοειδή, κακάο, καφέ, φοινικέλαιο, καουτσούκ, σόγια και προϊόντα ξύλου, εκτός αν δεν συνδέονται με αποψίλωση, είναι νόμιμα και καλύπτονται από δήλωση δέουσας επιμέλειας. Οι μεγάλες και μεσαίες εταιρείες πρέπει να συμμορφωθούν από τις 30 Δεκεμβρίου 2026.",
    tocLabel: "Σε αυτή τη σελίδα",
    introduction: [
      "Ο Κανονισμός της ΕΕ για την Αποψίλωση (Κανονισμός (ΕΕ) 2023/1115, γνωστός ως EUDR) επρόκειτο να εφαρμοστεί από τα τέλη του 2024. Αναβλήθηκε δύο φορές και τον Δεκέμβριο 2025 τροποποιήθηκε με τον Κανονισμό (ΕΕ) 2025/2650, που μείωσε επίσης τη γραφειοκρατία για πολλές επιχειρήσεις πιο κάτω στην αλυσίδα εφοδιασμού.",
      "Μεγάλο μέρος όσων γράφτηκαν για τον EUDR πριν από το 2026 δεν ισχύει πια. Αυτός ο οδηγός παρουσιάζει τους κανόνες όπως ισχύουν μετά την τροποποίηση: ποια προϊόντα καλύπτονται, ποιος έχει την κύρια υποχρέωση, τις νέες ημερομηνίες και τι πρέπει να κάνει τώρα μια μικρότερη εταιρεία.",
    ],
    sections: [
      {
        heading: "Ποια προϊόντα καλύπτονται",
        body: [
          "Ο κανονισμός καλύπτει επτά βασικά προϊόντα: βοοειδή, κακάο, καφέ, φοινικέλαιο, καουτσούκ, σόγια και ξύλο. Καλύπτει επίσης προϊόντα του Παραρτήματος Ι που τα περιέχουν, έχουν τραφεί με αυτά ή έχουν παραχθεί με αυτά, όπως δέρμα, σοκολάτα, καβουρδισμένο καφέ, παράγωγα φοινικελαίου, ελαστικά, έπιπλα, χαρτί, έντυπα και ξυλάνθρακα.",
          "Το αν ένα προϊόν εμπίπτει εξαρτάται από τον δασμολογικό του κωδικό στο Παράρτημα Ι, όχι από την εμπορική περιγραφή. Ένα ξενοδοχείο που αγοράζει καφέ και έπιπλα επηρεάζεται μέσω των προμηθευτών του. Ένας κύπριος εισαγωγέας ξυλείας, χαρτιού ή προϊόντων κακάο επηρεάζεται άμεσα.",
        ],
      },
      {
        heading: "Οι τρεις προϋποθέσεις",
        body: [
          "Τα καλυπτόμενα προϊόντα μπορούν να διατίθενται στην αγορά της ΕΕ ή να εξάγονται από αυτήν μόνο αν πληρούνται και οι τρεις προϋποθέσεις.",
          "Χωρίς αποψίλωση: το προϊόν παράχθηκε σε γη που δεν αποψιλώθηκε μετά τις 31 Δεκεμβρίου 2020. Για το ξύλο, το δάσος δεν υποβαθμίστηκε μετά από εκείνη την ημερομηνία.",
          "Νομιμότητα: παράχθηκε σύμφωνα με τους νόμους της χώρας παραγωγής, όπως για τη χρήση γης, το περιβάλλον, την εργασία και τη φορολογία.",
          "Δήλωση δέουσας επιμέλειας: η εταιρεία που το διαθέτει πρώτη στην αγορά έχει συγκεντρώσει τις πληροφορίες, έχει αξιολογήσει τον κίνδυνο, τον έχει μειώσει όπου χρειάζεται και έχει υποβάλει δήλωση στο σύστημα πληροφοριών της ΕΕ. Οι πληροφορίες περιλαμβάνουν τη γεωγραφική θέση των αγροτεμαχίων παραγωγής.",
        ],
      },
      {
        heading: "Ποιος κάνει τι μετά την τροποποίηση του 2025",
        body: [
          "Φορείς: η εταιρεία που διαθέτει πρώτη ένα καλυπτόμενο προϊόν στην αγορά της ΕΕ ή το εξάγει έχει την κύρια υποχρέωση. Πρέπει να ασκήσει δέουσα επιμέλεια και να υποβάλει τη δήλωση. Για αγαθά από χώρες εκτός ΕΕ, αυτός είναι συνήθως ο εισαγωγέας.",
          "Κατάντη φορείς και έμποροι: οι εταιρείες που αγοράζουν καλυπτόμενα προϊόντα ήδη διαθέσιμα στην αγορά της ΕΕ και τα μεταπωλούν ή τα επεξεργάζονται δεν χρειάζεται πλέον να υποβάλλουν δικές τους δηλώσεις. Πρέπει όμως να κρατούν αρχείο για το ποιος τους προμήθευσε και ποιους προμήθευσαν, καθώς και τους αριθμούς αναφοράς των δηλώσεων που καλύπτουν τα αγαθά τους.",
          "Πολύ μικροί και μικροί πρωτογενείς φορείς: οι μικροί παραγωγοί που καλλιεργούν ή εκτρέφουν οι ίδιοι το προϊόν σε χώρα χαμηλού κινδύνου μπορούν να υποβάλουν μία απλουστευμένη δήλωση αντί για επαναλαμβανόμενες δηλώσεις. Αυτό εισήχθη με την τροποποίηση του 2025 και εξειδικεύτηκε με τον Εκτελεστικό Κανονισμό (ΕΕ) 2026/1565.",
        ],
      },
      {
        heading: "Οι ημερομηνίες",
        body: [
          "30 Δεκεμβρίου 2026: οι κανόνες εφαρμόζονται στους μεγάλους και μεσαίους φορείς και εμπόρους.",
          "30 Ιουνίου 2027: οι κανόνες εφαρμόζονται στις πολύ μικρές και μικρές επιχειρήσεις που ιδρύθηκαν έως τις 31 Δεκεμβρίου 2024.",
          "Η τροποποίηση ζήτησε επίσης από την Επιτροπή να επανεξετάσει την απλοποίηση του κανονισμού. Παρακολουθείτε για νέες αλλαγές και ελέγχετε το ενοποιημένο κείμενο στο EUR-Lex πριν βασιστείτε σε οποιαδήποτε σύνοψη, και σε αυτήν.",
        ],
      },
      {
        heading: "Τι σημαίνει για τις επιχειρήσεις στην Κύπρο",
        body: [
          "Οι περισσότερες κυπριακές επιχειρήσεις αγοράζουν καλυπτόμενα προϊόντα αντί να τα εισάγουν πρώτες, οπότε μετά την τροποποίηση η κύρια υποχρέωσή τους είναι να κρατούν αρχείο προμηθευτών, πελατών και αριθμών αναφοράς δηλώσεων.",
          "Εξαίρεση αποτελούν όσοι φέρνουν οι ίδιοι καλυπτόμενα αγαθά από χώρες εκτός ΕΕ: έμποροι ξυλείας και προϊόντων ξύλου, εισαγωγείς χαρτιού και συσκευασιών, καφεκοπτεία, εισαγωγείς κακάο ή σοκολάτας, δέρματος και επίπλων, και έμποροι ζωοτροφών που εισάγουν σόγια. Αυτοί είναι φορείς και χρειάζονται πλήρη δέουσα επιμέλεια, με στοιχεία γεωγραφικής θέσης από τους προμηθευτές τους.",
          "Τράπεζες και μεγάλοι πελάτες αρχίζουν να ρωτούν για τον EUDR σε ερωτηματολόγια προμηθευτών, ακόμη και όταν ο νόμος δεν απαιτεί δήλωση από εσάς. Ένα σύντομο γραπτό σημείωμα για το ποια καλυπτόμενα προϊόντα διακινείτε και πώς απαντά στις περισσότερες ερωτήσεις.",
        ],
      },
      {
        heading: "Πρώτα βήματα",
        body: [
          "1. Καταγράψτε κάθε προϊόν που αγοράζετε ή πουλάτε και μπορεί να εμπίπτει στο Παράρτημα Ι, με τον δασμολογικό του κωδικό.",
          "2. Για καθένα, αποφασίστε αν είστε ο φορέας (πρώτος που το διαθέτει στην αγορά της ΕΕ ή το εξάγει) ή κατάντη φορέας ή έμπορος.",
          "3. Αν είστε φορέας, ζητήστε από τώρα από τους προμηθευτές γεωγραφική θέση αγροτεμαχίων και αποδείξεις νομιμότητας. Αυτό παίρνει τον περισσότερο χρόνο.",
          "4. Αν είστε κατάντη, οργανώστε ένα απλό αρχείο με ονόματα προμηθευτών, πελατών και αριθμούς αναφοράς δηλώσεων για κάθε καλυπτόμενο προϊόν.",
          "5. Σημειώστε την ημερομηνία που σας αφορά: 30 Δεκεμβρίου 2026 ή, για πολύ μικρές και μικρές επιχειρήσεις που ιδρύθηκαν έως το τέλος του 2024, 30 Ιουνίου 2027.",
        ],
      },
    ],
    keyTakeaways: [
      "Ο EUDR καλύπτει βοοειδή, κακάο, καφέ, φοινικέλαιο, καουτσούκ, σόγια, ξύλο και προϊόντα από αυτά.",
      "Τα προϊόντα πρέπει να μη συνδέονται με αποψίλωση (ημερομηνία αναφοράς 31/12/2020), να είναι νόμιμα και να καλύπτονται από δήλωση δέουσας επιμέλειας.",
      "Μετά την τροποποίηση του 2025, η κύρια υποχρέωση ανήκει στην εταιρεία που διαθέτει πρώτη το προϊόν στην αγορά της ΕΕ.",
      "Οι κατάντη φορείς και οι έμποροι κρατούν αρχείο και αριθμούς αναφοράς αντί να υποβάλλουν δικές τους δηλώσεις.",
      "Μεγάλες και μεσαίες εταιρείες: 30 Δεκεμβρίου 2026. Πολύ μικρές και μικρές που ιδρύθηκαν έως το τέλος του 2024: 30 Ιουνίου 2027.",
    ],
    faq: [
      {
        q: "Αναβλήθηκε ξανά ο EUDR;",
        a: "Αναβλήθηκε δύο φορές. Ο Κανονισμός (ΕΕ) 2025/2650 όρισε τις τρέχουσες ημερομηνίες: 30 Δεκεμβρίου 2026 για μεγάλες και μεσαίες εταιρείες και 30 Ιουνίου 2027 για πολύ μικρές και μικρές που ιδρύθηκαν έως τις 31 Δεκεμβρίου 2024. Ελέγχετε πάντα το EUR-Lex για μεταγενέστερες αλλαγές.",
      },
      {
        q: "Αγοράζουμε καφέ μόνο από διανομέα στην ΕΕ. Υποβάλλουμε κάτι;",
        a: "Συνήθως όχι. Ως κατάντη φορέας ή έμπορος δεν υποβάλλετε δική σας δήλωση. Κρατήστε αρχείο του προμηθευτή σας και των αριθμών αναφοράς των δηλώσεων για τον καφέ που αγοράζετε.",
      },
      {
        q: "Τι είναι τα στοιχεία γεωγραφικής θέσης;",
        a: "Οι συντεταγμένες των αγροτεμαχίων όπου παράχθηκε το προϊόν. Για μεγαλύτερα αγροτεμάχια πρόκειται για πολύγωνο. Οι φορείς πρέπει να τα συγκεντρώσουν από την αλυσίδα εφοδιασμού πριν υποβάλουν δήλωση.",
      },
      {
        q: "Αφορά ο EUDR υπηρεσίες ή μόνο αγαθά;",
        a: "Μόνο αγαθά του Παραρτήματος Ι. Οι εταιρείες υπηρεσιών επηρεάζονται μόνο μέσω των καλυπτόμενων προϊόντων που αγοράζουν, συνήθως ως κατάντη χρήστες και όχι ως φορείς.",
      },
      {
        q: "Ποιες είναι οι κυρώσεις;",
        a: "Τις ορίζουν τα κράτη μέλη, αλλά ο κανονισμός απαιτεί να είναι αποτελεσματικές και αποτρεπτικές, με πρόστιμα συνδεδεμένα με τον κύκλο εργασιών, κατάσχεση προϊόντων και προσωρινό αποκλεισμό από δημόσιες συμβάσεις.",
      },
    ],
    ctaHeading: "Μάθετε με μία ερώτηση αν σας αφορά ο EUDR",
    ctaBody:
      "Ο έλεγχος προθεσμιών του Vuneli ρωτά μόνο ό,τι χρειάζεται, όπως αν διαθέτετε καλυπτόμενο προϊόν στην αγορά, και δείχνει την ημερομηνία EUDR που ισχύει για την επιχείρησή σας, με τη νομική πηγή.",
  },
});
