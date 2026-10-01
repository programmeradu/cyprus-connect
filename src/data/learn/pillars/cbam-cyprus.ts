import { makePillar } from "./_factory";

/**
 * Rewritten 1 Oct 2026. Facts checked against:
 * - Reg. (EU) 2023/956 as amended by Reg. (EU) 2025/2083 (50 t threshold, 30 Sep declaration)
 * - OJ C/2026/4231 (31.7.2026): Cyprus competent authority = Department of Environment
 * - EC CBAM Q&A (27 May 2026) and Registry pages
 * See docs/research/DEADLINES_2026-10-01.md.
 */
export const cbamCyprus = makePillar({
  slug: "cbam-cyprus",
  category: "cyprus",
  primaryKeyword: "CBAM Cyprus",
  monthlyVolume: 0,
  readingMinutes: 9,
  publishedAt: "2026-07-08",
  updatedAt: "2026-10-01",
  relatedSlugs: ["cbam-explained", "eudr-guide", "eu-greenwashing-rules-2026", "csrd-reporting-cyprus"],
  en: {
    title: "CBAM in Cyprus: A Practical Guide for Importers in 2026 and 2027",
    metaTitle: "CBAM Cyprus: Importer Guide for 2026-2027",
    metaDescription:
      "Who must comply with CBAM in Cyprus, the 50-tonne threshold, the Department of Environment's role, and the 30 September 2027 first declaration.",
    heroEyebrow: "Cyprus regulation",
    heroSubtitle:
      "Since 1 January 2026, Cypriot companies importing more than 50 tonnes a year of steel, aluminium, cement, fertilisers or hydrogen need to be authorised CBAM declarants. The first annual declaration is due on 30 September 2027.",
    tocLabel: "On this page",
    introduction: [
      "The Carbon Border Adjustment Mechanism (CBAM) puts a carbon price on certain goods entering the EU, so that imports pay roughly what an EU producer would pay under the EU Emissions Trading System. The pilot phase ended on 31 December 2025. From 2026, CBAM is a real cost and a legal permission to import.",
      "For Cyprus this matters more than for most member states. The island produces very little steel, aluminium or fertiliser itself, so construction, metal trading and agriculture rely on imported goods, and a share of those come from outside the EU.",
      "This guide covers what a Cypriot importer actually has to do, which local authority is responsible, the dates that matter, and where most companies get stuck.",
    ],
    sections: [
      {
        heading: "Does CBAM apply to your company?",
        body: [
          "CBAM covers six groups of goods: iron and steel, aluminium, cement, fertilisers, hydrogen and electricity. It also covers some products made from them, such as screws, bolts, tubes and certain steel structures. Whether a product is covered depends on its customs (CN) code, not on how you describe it.",
          "Since the 2025 simplification (Regulation (EU) 2025/2083), there is a single yearly threshold. If the total mass of CBAM goods you import in a calendar year stays at or below 50 tonnes, you are exempt from the CBAM obligations for those goods. Electricity and hydrogen do not benefit from this exemption.",
          "The 50 tonnes are counted per importer across all covered goods combined, not per shipment or per product. A builders' merchant bringing in 30 tonnes of rebar and 25 tonnes of cement from outside the EU is over the threshold.",
          "Goods produced in the EU, or in countries linked to the EU carbon market (Iceland, Liechtenstein, Norway and Switzerland), are outside CBAM. Goods from Turkey, Egypt, China, India, Ukraine or the UK are inside it.",
        ],
      },
      {
        heading: "Who is in charge in Cyprus",
        body: [
          "The CBAM competent authority for Cyprus is the Department of Environment of the Ministry of Agriculture, Rural Development and Environment, at 20-22 October 28th Avenue, Engomi, Nicosia. This appears in the official list published in the EU Official Journal on 31 July 2026 (C/2026/4231). The contact address is cbam@environment.moa.gov.cy.",
          "The Customs and Excise Department still plays its usual role at the border: it checks that whoever declares CBAM goods for import is authorised, and it shares import data with the CBAM Registry. But authorisation, checks on declarations and penalties sit with the Department of Environment.",
          "If you use a customs broker as an indirect customs representative, the broker can apply for authorisation and file on your behalf. You stay responsible for the accuracy of the emissions data.",
        ],
      },
      {
        heading: "The dates that matter",
        body: [
          "1 January 2026: the definitive period started. Importing more than 50 tonnes a year of CBAM goods requires authorised-declarant status. Companies that applied by 31 March 2026 could keep importing while their application was being processed.",
          "February 2027: CBAM certificates go on sale on the EU's common central platform. Their price follows the EU carbon price. The Commission published quarterly prices for 2026, and our CBAM tool uses them.",
          "30 September 2027: the first annual CBAM declaration is due, covering everything imported in 2026. In the same declaration you surrender the matching number of certificates. After that the deadline repeats every 30 September for the previous year.",
          "31 October each year: the last day to ask your authority to buy back certificates you bought but did not need, within the limits in the regulation.",
        ],
      },
      {
        heading: "What the declaration needs",
        body: [
          "For each covered good: the CN code, the quantity, the country of origin and the installation where it was made, plus the embedded emissions, both direct and, for some goods, indirect.",
          "Embedded emissions should come from your supplier's installation, calculated with the EU method and, from 2026, checked by an accredited verifier. If you cannot get real data, you may use the default values published by the Commission. These are set per country and per product and include a mark-up, so they usually cost more than real data.",
          "If a carbon price has already been paid in the country of production, you can deduct it, but only with documentary evidence.",
        ],
      },
      {
        heading: "Where Cypriot importers get stuck",
        body: [
          "Supplier data. Most non-EU mills and traders still send a generic certificate rather than installation-level emissions. Ask early and ask in writing. Make each purchase order conditional on the CBAM data.",
          "Counting tonnes. Companies under-count because covered goods hide inside mixed shipments or under unexpected CN codes. Check last year's import declarations line by line against the covered CN list.",
          "Cash flow. Certificates bought in 2027 pay for 2026 imports. A trading company with thin margins should put money aside each quarter, priced at the current certificate price.",
          "Ownership. CBAM touches purchasing, customs, finance and sustainability. Name one person responsible, or it falls between departments.",
        ],
      },
      {
        heading: "A short action plan",
        body: [
          "1. Pull your 2025 and 2026 import declarations and total the covered tonnage by CN code and origin.",
          "2. If you are over 50 tonnes, or likely to be, make sure you or your broker are authorised in the CBAM Registry. Signing in needs an EU Login account with two-step verification.",
          "3. Write to every non-EU supplier of covered goods asking for installation-level embedded emissions and any carbon price paid.",
          "4. Estimate your certificate cost for 2026 with default values as a worst case, then improve it as real data arrives.",
          "5. Put 30 September 2027 and 31 October 2027 in the calendar of whoever will file.",
        ],
      },
    ],
    keyTakeaways: [
      "The 50-tonne yearly threshold is per importer, across all covered goods combined.",
      "In Cyprus the CBAM authority is the Department of Environment; Customs checks authorisation at the border.",
      "The first declaration and certificate surrender are due on 30 September 2027, for 2026 imports.",
      "Certificates go on sale in February 2027 and follow the EU carbon price.",
      "Real supplier data is almost always cheaper than default values, so ask for it now.",
    ],
    faq: [
      {
        q: "We imported 40 tonnes of steel in 2026. Do we need to do anything?",
        a: "If your total covered imports for the year stay at or below 50 tonnes, you are exempt for those goods. Keep the records that show this, and watch your 2027 volumes, because the threshold applies again each calendar year.",
      },
      {
        q: "Is Cyprus Customs the CBAM authority?",
        a: "No. The competent authority is the Department of Environment. Customs checks at the border that the person importing covered goods is authorised.",
      },
      {
        q: "Can my customs broker handle CBAM?",
        a: "Yes. An indirect customs representative can become an authorised CBAM declarant and file for you. You remain responsible for the emissions data you give them.",
      },
      {
        q: "What happens if a supplier will not share emissions data?",
        a: "You can use the Commission's default values, which usually cost more because they include a mark-up. Record your requests to the supplier in case the authority asks.",
      },
      {
        q: "Where do I find the official CBAM Registry?",
        a: "On the European Commission's CBAM Registry page. You sign in with an EU Login account that has two-step verification turned on.",
      },
    ],
    ctaHeading: "Know your CBAM position in minutes",
    ctaBody:
      "Vuneli checks your imports against the 50-tonne threshold, applies the official default values and certificate prices, and drafts supplier data requests for you to approve.",
  },
  el: {
    title: "CBAM στην Κύπρο: Πρακτικός οδηγός για εισαγωγείς το 2026 και το 2027",
    metaTitle: "CBAM Κύπρος: Οδηγός εισαγωγέα 2026-2027",
    metaDescription:
      "Ποιοι πρέπει να συμμορφωθούν με τον CBAM στην Κύπρο, το όριο των 50 τόνων, ο ρόλος του Τμήματος Περιβάλλοντος και η πρώτη δήλωση στις 30 Σεπτεμβρίου 2027.",
    heroEyebrow: "Κυπριακή νομοθεσία",
    heroSubtitle:
      "Από την 1η Ιανουαρίου 2026, οι κυπριακές εταιρείες που εισάγουν πάνω από 50 τόνους τον χρόνο χάλυβα, αλουμίνιο, τσιμέντο, λιπάσματα ή υδρογόνο πρέπει να είναι εξουσιοδοτημένοι διασαφιστές CBAM. Η πρώτη ετήσια δήλωση οφείλεται στις 30 Σεπτεμβρίου 2027.",
    tocLabel: "Σε αυτή τη σελίδα",
    introduction: [
      "Ο Μηχανισμός Συνοριακής Προσαρμογής Άνθρακα (CBAM) βάζει τιμή άνθρακα σε ορισμένα αγαθά που εισέρχονται στην ΕΕ, ώστε οι εισαγωγές να πληρώνουν περίπου ό,τι θα πλήρωνε ένας ευρωπαίος παραγωγός στο Σύστημα Εμπορίας Εκπομπών της ΕΕ. Η πιλοτική φάση έληξε στις 31 Δεκεμβρίου 2025. Από το 2026, ο CBAM είναι πραγματικό κόστος και νόμιμη προϋπόθεση για την εισαγωγή.",
      "Για την Κύπρο αυτό έχει μεγαλύτερη σημασία από ό,τι για τα περισσότερα κράτη μέλη. Το νησί παράγει ελάχιστο χάλυβα, αλουμίνιο ή λιπάσματα, οπότε οι κατασκευές, το εμπόριο μετάλλων και η γεωργία βασίζονται σε εισαγόμενα αγαθά, μέρος των οποίων προέρχεται από χώρες εκτός ΕΕ.",
      "Αυτός ο οδηγός εξηγεί τι πρέπει πραγματικά να κάνει ένας κύπριος εισαγωγέας, ποια τοπική αρχή είναι αρμόδια, ποιες ημερομηνίες μετράνε και πού κολλούν οι περισσότερες εταιρείες.",
    ],
    sections: [
      {
        heading: "Σας αφορά ο CBAM;",
        body: [
          "Ο CBAM καλύπτει έξι ομάδες αγαθών: σίδηρο και χάλυβα, αλουμίνιο, τσιμέντο, λιπάσματα, υδρογόνο και ηλεκτρική ενέργεια. Καλύπτει επίσης ορισμένα προϊόντα από αυτά, όπως βίδες, μπουλόνια, σωλήνες και ορισμένες χαλύβδινες κατασκευές. Το αν καλύπτεται ένα προϊόν εξαρτάται από τον δασμολογικό του κωδικό (CN), όχι από την περιγραφή του.",
          "Μετά την απλοποίηση του 2025 (Κανονισμός (ΕΕ) 2025/2083), ισχύει ένα ενιαίο ετήσιο όριο. Αν η συνολική μάζα των αγαθών CBAM που εισάγετε σε ένα ημερολογιακό έτος δεν ξεπερνά τους 50 τόνους, εξαιρείστε από τις υποχρεώσεις CBAM για αυτά τα αγαθά. Η ηλεκτρική ενέργεια και το υδρογόνο δεν καλύπτονται από αυτή την εξαίρεση.",
          "Οι 50 τόνοι μετρώνται ανά εισαγωγέα, για όλα τα καλυπτόμενα αγαθά μαζί, όχι ανά φορτίο ή ανά προϊόν. Ένα κατάστημα οικοδομικών υλικών που εισάγει 30 τόνους οπλισμού και 25 τόνους τσιμέντου από χώρες εκτός ΕΕ είναι πάνω από το όριο.",
          "Τα αγαθά που παράγονται στην ΕΕ ή σε χώρες συνδεδεμένες με την αγορά άνθρακα της ΕΕ (Ισλανδία, Λιχτενστάιν, Νορβηγία, Ελβετία) είναι εκτός CBAM. Τα αγαθά από Τουρκία, Αίγυπτο, Κίνα, Ινδία, Ουκρανία ή Ηνωμένο Βασίλειο είναι εντός.",
        ],
      },
      {
        heading: "Ποιος είναι αρμόδιος στην Κύπρο",
        body: [
          "Αρμόδια αρχή CBAM για την Κύπρο είναι το Τμήμα Περιβάλλοντος του Υπουργείου Γεωργίας, Αγροτικής Ανάπτυξης και Περιβάλλοντος, Λεωφόρος 28ης Οκτωβρίου 20-22, Έγκωμη, Λευκωσία. Αυτό αναφέρεται στον επίσημο κατάλογο που δημοσιεύθηκε στην Επίσημη Εφημερίδα της ΕΕ στις 31 Ιουλίου 2026 (C/2026/4231). Διεύθυνση επικοινωνίας: cbam@environment.moa.gov.cy.",
          "Το Τμήμα Τελωνείων διατηρεί τον συνήθη ρόλο του στα σύνορα: ελέγχει ότι όποιος διασαφίζει αγαθά CBAM για εισαγωγή είναι εξουσιοδοτημένος και διαβιβάζει στοιχεία εισαγωγών στο Μητρώο CBAM. Η εξουσιοδότηση, ο έλεγχος των δηλώσεων και οι κυρώσεις ανήκουν όμως στο Τμήμα Περιβάλλοντος.",
          "Αν χρησιμοποιείτε εκτελωνιστή ως έμμεσο τελωνειακό αντιπρόσωπο, μπορεί εκείνος να ζητήσει εξουσιοδότηση και να υποβάλλει για λογαριασμό σας. Η ευθύνη για την ακρίβεια των στοιχείων εκπομπών παραμένει δική σας.",
        ],
      },
      {
        heading: "Οι ημερομηνίες που μετράνε",
        body: [
          "1 Ιανουαρίου 2026: ξεκίνησε η οριστική περίοδος. Η εισαγωγή πάνω από 50 τόνων τον χρόνο αγαθών CBAM απαιτεί καθεστώς εξουσιοδοτημένου διασαφιστή. Όσοι υπέβαλαν αίτηση έως τις 31 Μαρτίου 2026 μπορούσαν να συνεχίσουν τις εισαγωγές όσο εξεταζόταν η αίτησή τους.",
          "Φεβρουάριος 2027: τα πιστοποιητικά CBAM διατίθενται προς πώληση στην κοινή κεντρική πλατφόρμα της ΕΕ. Η τιμή τους ακολουθεί την τιμή άνθρακα της ΕΕ. Η Επιτροπή δημοσίευσε τριμηνιαίες τιμές για το 2026 και το εργαλείο CBAM μας τις χρησιμοποιεί.",
          "30 Σεπτεμβρίου 2027: λήγει η πρώτη ετήσια δήλωση CBAM, για όλες τις εισαγωγές του 2026. Στην ίδια δήλωση παραδίδετε τον αντίστοιχο αριθμό πιστοποιητικών. Στη συνέχεια η προθεσμία επαναλαμβάνεται κάθε 30 Σεπτεμβρίου για το προηγούμενο έτος.",
          "31 Οκτωβρίου κάθε έτους: τελευταία μέρα για να ζητήσετε από την αρχή σας την επαναγορά πιστοποιητικών που αγοράσατε αλλά δεν χρειαστήκατε, εντός των ορίων του κανονισμού.",
        ],
      },
      {
        heading: "Τι χρειάζεται η δήλωση",
        body: [
          "Για κάθε καλυπτόμενο αγαθό: τον κωδικό CN, την ποσότητα, τη χώρα καταγωγής και την εγκατάσταση παραγωγής, καθώς και τις ενσωματωμένες εκπομπές, άμεσες και, για ορισμένα αγαθά, έμμεσες.",
          "Οι ενσωματωμένες εκπομπές πρέπει να προέρχονται από την εγκατάσταση του προμηθευτή σας, να υπολογίζονται με τη μέθοδο της ΕΕ και, από το 2026, να ελέγχονται από διαπιστευμένο επαληθευτή. Αν δεν μπορείτε να πάρετε πραγματικά στοιχεία, μπορείτε να χρησιμοποιήσετε τις προκαθορισμένες τιμές της Επιτροπής. Αυτές ορίζονται ανά χώρα και προϊόν και περιλαμβάνουν προσαύξηση, οπότε συνήθως κοστίζουν περισσότερο από τα πραγματικά στοιχεία.",
          "Αν έχει ήδη πληρωθεί τιμή άνθρακα στη χώρα παραγωγής, μπορείτε να την αφαιρέσετε, αλλά μόνο με αποδεικτικά έγγραφα.",
        ],
      },
      {
        heading: "Πού κολλούν οι κύπριοι εισαγωγείς",
        body: [
          "Στοιχεία προμηθευτών. Τα περισσότερα χαλυβουργεία και οι έμποροι εκτός ΕΕ στέλνουν ακόμη γενικό πιστοποιητικό αντί για εκπομπές ανά εγκατάσταση. Ζητήστε τα νωρίς και γραπτώς. Βάλτε τα στοιχεία CBAM ως όρο σε κάθε παραγγελία.",
          "Μέτρηση τόνων. Οι εταιρείες υπολογίζουν λιγότερους τόνους επειδή τα καλυπτόμενα αγαθά κρύβονται σε μικτά φορτία ή σε απρόσμενους κωδικούς CN. Ελέγξτε τις περσινές διασαφήσεις εισαγωγής γραμμή προς γραμμή με τον κατάλογο κωδικών.",
          "Ταμειακή ροή. Τα πιστοποιητικά που αγοράζονται το 2027 πληρώνουν τις εισαγωγές του 2026. Μια εμπορική εταιρεία με μικρά περιθώρια πρέπει να βάζει χρήματα στην άκρη κάθε τρίμηνο, με βάση την τρέχουσα τιμή πιστοποιητικού.",
          "Ευθύνη. Ο CBAM αφορά αγορές, τελωνεία, λογιστήριο και βιωσιμότητα. Ορίστε έναν υπεύθυνο, αλλιώς πέφτει ανάμεσα στα τμήματα.",
        ],
      },
      {
        heading: "Σύντομο σχέδιο δράσης",
        body: [
          "1. Συγκεντρώστε τις διασαφήσεις εισαγωγής του 2025 και του 2026 και αθροίστε τους καλυπτόμενους τόνους ανά κωδικό CN και χώρα καταγωγής.",
          "2. Αν είστε ή πιθανόν να είστε πάνω από 50 τόνους, βεβαιωθείτε ότι εσείς ή ο εκτελωνιστής σας είστε εξουσιοδοτημένοι στο Μητρώο CBAM. Η είσοδος γίνεται με λογαριασμό EU Login και επαλήθευση δύο βημάτων.",
          "3. Γράψτε σε κάθε προμηθευτή εκτός ΕΕ καλυπτόμενων αγαθών και ζητήστε ενσωματωμένες εκπομπές ανά εγκατάσταση και τυχόν τιμή άνθρακα που πληρώθηκε.",
          "4. Υπολογίστε το κόστος πιστοποιητικών του 2026 με τις προκαθορισμένες τιμές ως χειρότερο σενάριο και βελτιώστε το καθώς έρχονται πραγματικά στοιχεία.",
          "5. Σημειώστε τις 30 Σεπτεμβρίου 2027 και 31 Οκτωβρίου 2027 στο ημερολόγιο του υπευθύνου υποβολής.",
        ],
      },
    ],
    keyTakeaways: [
      "Το ετήσιο όριο των 50 τόνων ισχύει ανά εισαγωγέα, για όλα τα καλυπτόμενα αγαθά μαζί.",
      "Στην Κύπρο αρμόδια αρχή CBAM είναι το Τμήμα Περιβάλλοντος· τα Τελωνεία ελέγχουν την εξουσιοδότηση στα σύνορα.",
      "Η πρώτη δήλωση και η παράδοση πιστοποιητικών λήγουν στις 30 Σεπτεμβρίου 2027, για τις εισαγωγές του 2026.",
      "Τα πιστοποιητικά διατίθενται από τον Φεβρουάριο 2027 και ακολουθούν την τιμή άνθρακα της ΕΕ.",
      "Τα πραγματικά στοιχεία προμηθευτών είναι σχεδόν πάντα φθηνότερα από τις προκαθορισμένες τιμές, γι' αυτό ζητήστε τα τώρα.",
    ],
    faq: [
      {
        q: "Εισαγάγαμε 40 τόνους χάλυβα το 2026. Πρέπει να κάνουμε κάτι;",
        a: "Αν οι συνολικές καλυπτόμενες εισαγωγές σας για το έτος δεν ξεπερνούν τους 50 τόνους, εξαιρείστε για αυτά τα αγαθά. Κρατήστε τα στοιχεία που το αποδεικνύουν και παρακολουθείτε τις ποσότητες του 2027, γιατί το όριο ισχύει ξανά κάθε ημερολογιακό έτος.",
      },
      {
        q: "Είναι τα Τελωνεία η αρχή CBAM στην Κύπρο;",
        a: "Όχι. Αρμόδια αρχή είναι το Τμήμα Περιβάλλοντος. Τα Τελωνεία ελέγχουν στα σύνορα ότι όποιος εισάγει καλυπτόμενα αγαθά είναι εξουσιοδοτημένος.",
      },
      {
        q: "Μπορεί ο εκτελωνιστής μου να αναλάβει τον CBAM;",
        a: "Ναι. Ένας έμμεσος τελωνειακός αντιπρόσωπος μπορεί να γίνει εξουσιοδοτημένος διασαφιστής CBAM και να υποβάλλει για εσάς. Η ευθύνη για τα στοιχεία εκπομπών που του δίνετε παραμένει δική σας.",
      },
      {
        q: "Τι γίνεται αν ο προμηθευτής δεν δίνει στοιχεία εκπομπών;",
        a: "Μπορείτε να χρησιμοποιήσετε τις προκαθορισμένες τιμές της Επιτροπής, που συνήθως κοστίζουν περισσότερο λόγω προσαύξησης. Κρατήστε αρχείο των αιτημάτων σας προς τον προμηθευτή σε περίπτωση που το ζητήσει η αρχή.",
      },
      {
        q: "Πού βρίσκω το επίσημο Μητρώο CBAM;",
        a: "Στη σελίδα του Μητρώου CBAM της Ευρωπαϊκής Επιτροπής. Η είσοδος γίνεται με λογαριασμό EU Login με ενεργή επαλήθευση δύο βημάτων.",
      },
    ],
    ctaHeading: "Μάθετε τη θέση σας στον CBAM σε λίγα λεπτά",
    ctaBody:
      "Το Vuneli ελέγχει τις εισαγωγές σας με βάση το όριο των 50 τόνων, εφαρμόζει τις επίσημες προκαθορισμένες τιμές και τιμές πιστοποιητικών και ετοιμάζει αιτήματα στοιχείων προς προμηθευτές για έγκρισή σας.",
  },
});
