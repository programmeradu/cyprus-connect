import { makePillar } from "./_factory";

export const cbamCyprus = makePillar({
  slug: "cbam-cyprus",
  category: "cyprus",
  primaryKeyword: "CBAM Cyprus",
  monthlyVolume: 0,
  readingMinutes: 11,
  updatedAt: "2026-10-01",
  relatedSlugs: ["cbam-explained", "csrd-reporting-cyprus", "esg-software-cyprus", "sustainability-reporting-eu"],
  en: {
    title: "CBAM in Cyprus: What Importers of Steel, Cement, Aluminium and Fertilisers Must Do in 2026–2027",
    metaTitle: "CBAM Cyprus 2026: Importer Guide and Deadlines",
    metaDescription:
      "CBAM for Cyprus importers: the 50-tonne threshold, authorised declarant status, who to contact locally, supplier data, and the 2027 certificate and declaration deadlines.",
    heroEyebrow: "Cyprus regulatory guide",
    heroSubtitle:
      "Since 1 January 2026 CBAM is no longer a reporting exercise. Cypriot businesses that import more than 50 tonnes a year of covered goods need authorised declarant status, supplier emissions data and a budget for certificates.",
    tocLabel: "On this page",
    introduction: [
      "Cyprus produces very little of its own steel, aluminium or fertiliser, so builders, merchants, manufacturers and distributors here depend on imports from Turkey, Egypt, China, Ukraine and other non-EU origins. Those are exactly the goods the EU Carbon Border Adjustment Mechanism (CBAM) puts a carbon price on.",
      "The transitional period (October 2023 to December 2025) only asked for quarterly reports. The definitive period started on 1 January 2026. The October 2025 simplification (Regulation (EU) 2025/2083) removed most small importers from scope, but for those still covered the obligations are now financial, not just administrative.",
      "This guide explains, in plain terms, whether your company is in scope, what you need to do and by when, and where the work usually gets stuck for Cypriot importers. It is not legal advice; check your own position with your customs broker or the competent authority.",
    ],
    sections: [
      {
        heading: "Which goods are covered",
        body: [
          "CBAM covers six sectors: cement, iron and steel, aluminium, fertilisers, hydrogen and electricity. Coverage is defined by customs (CN) codes in Annex I of Regulation (EU) 2023/956, and it reaches further than raw materials. Screws, bolts, steel tubes, rebar, aluminium profiles and many semi-finished products are included.",
          "Goods produced inside the EU, including those bought from Greece, Italy or any other Member State, are not subject to CBAM. What matters is the origin of the goods when they are released for free circulation in the EU, not the country you bought them from.",
          "The quickest check is to pull last year's import declarations from your broker and filter by the CN codes in Annex I. Many companies discover covered goods they did not expect, such as fixings, mesh and fertiliser blends.",
        ],
      },
      {
        heading: "The 50-tonne threshold: are you still in scope?",
        body: [
          "From 2026 an importer is exempt if the total net mass of CBAM goods it imports in a calendar year stays at or below 50 tonnes. Electricity and hydrogen are excluded from this threshold and stay covered regardless of volume.",
          "The threshold is cumulative across all covered goods and applies per importer, not per shipment or per product. Fifty tonnes is only two or three truckloads of rebar or cement. A small hardware merchant may stay under it, but a contractor or builders' merchant usually will not.",
          "If you cross 50 tonnes during the year, CBAM applies to all your covered imports that year, not just the tonnes above the line. Track your cumulative tonnage month by month so you do not cross it without warning.",
        ],
      },
      {
        heading: "Authorised CBAM declarant status",
        body: [
          "Above the threshold, only an authorised CBAM declarant may import covered goods. You apply through the EU CBAM Registry using EU Login, and the national competent authority decides. Under the 2025 amendments, an importer that applied by 31 March 2026 could keep importing while its application was being processed.",
          "In Cyprus, CBAM sits with the Department of Environment (Ministry of Agriculture, Rural Development and Environment) as competent authority. The Customs and Excise Department checks status at the border and supplies import data. In practice, your broker handles the customs side and you handle the Registry and the emissions data.",
          "Expect to supply company and EORI details, evidence that you have no serious customs or tax infringements, and proof of financial and operational capacity. A guarantee may be required for companies established for less than two financial years.",
        ],
      },
      {
        heading: "Deadlines that matter for 2026 imports",
        body: [
          "1 February 2027: sales of CBAM certificates begin on the common central platform. Certificates for 2026 imports are priced at the average EU ETS auction price for each quarter of 2026.",
          "30 September 2027: the first annual CBAM declaration is due. It covers all goods imported in 2026, their embedded emissions, and any carbon price already paid in the country of origin. You surrender the matching number of certificates at the same time.",
          "From 2027 onwards, authorised declarants must hold certificates covering at least 50% of the embedded emissions of goods imported so far in the year, checked quarterly. Build this into cash-flow planning now rather than discovering it in the first quarter of 2027.",
        ],
      },
      {
        heading: "Supplier data: default values vs actual emissions",
        body: [
          "For each covered product you can declare either actual embedded emissions, reported by the producing installation and verified by an accredited verifier, or the default values published by the European Commission for each country and product.",
          "Default values are designed to be cautious and include a mark-up that increases over time, so they usually mean paying for more certificates. Actual data from an efficient plant can lower the bill substantially. The difference only becomes clear once you have both figures for your main products.",
          "Start supplier requests early. Many mills in Turkey and Egypt already have monitoring plans for exports to the EU. Smaller traders and stockists often do not, and the gap is wider still when goods pass through intermediaries. Ask for installation identifiers, production route and verified emissions per tonne, and keep every reply.",
        ],
      },
      {
        heading: "A practical 90-day plan for a Cypriot importer",
        body: [
          "Days 1–30: pull 2026 import data from your broker, classify by CN code and calculate cumulative tonnage. If you are above or near 50 tonnes, confirm your declarant status in the CBAM Registry.",
          "Days 31–60: list your non-EU suppliers for each covered product, send structured data requests and record which suppliers can provide verified actual data. Estimate your 2026 certificate cost using default values as a worst case.",
          "Days 61–90: agree with finance on a certificate budget and quarterly holding plan for 2027, add CBAM clauses to new supply contracts (data delivery, verification, price adjustments), and decide who owns the September 2027 declaration.",
        ],
      },
    ],
    keyTakeaways: [
      "CBAM's definitive period started on 1 January 2026; importing covered goods is now a financial obligation, not only a reporting one.",
      "Importers of 50 tonnes or less of covered goods per year (excluding electricity and hydrogen) are exempt; the threshold is cumulative per importer.",
      "Above the threshold you need authorised CBAM declarant status, applied for through the EU CBAM Registry.",
      "The first annual declaration for 2026 imports is due 30 September 2027; certificate sales start 1 February 2027.",
      "Verified supplier data usually beats default values. Start collecting it now, product by product.",
    ],
    faq: [
      {
        q: "Who is the CBAM competent authority in Cyprus?",
        a: "The Department of Environment handles CBAM authorisation and supervision, while the Customs and Excise Department applies the border checks and provides import data. Confirm current contact points on gov.cy before you apply.",
      },
      {
        q: "We import less than 50 tonnes a year. Do we need to do anything?",
        a: "You are exempt from authorisation, certificates and declarations, but keep records showing your annual tonnage. If your volumes grow, monitor them monthly so you know before you cross the threshold.",
      },
      {
        q: "Are goods bought from a Greek supplier covered?",
        a: "Not if they were produced in the EU or already released for free circulation in the EU. If a Greek trader imports non-EU steel and sells it to you, the CBAM obligation sits with whoever imported it into the EU, normally the Greek company.",
      },
      {
        q: "Can our customs broker file the CBAM declaration for us?",
        a: "A customs representative can act for you in some cases, but the emissions data, supplier evidence and certificate purchases remain your responsibility. Agree in writing who does what.",
      },
      {
        q: "What happens if we use default values for everything?",
        a: "It is legal, but usually more expensive, because default values are deliberately cautious and include a rising mark-up. They are a reasonable fallback for minor products and a costly choice for your largest volumes.",
      },
    ],
    ctaHeading: "See where your company stands on CBAM",
    ctaBody:
      "Vuneli keeps your suppliers, import tonnage and emissions evidence in one place, uses the Commission's official default values where actual data is missing, and helps you prepare the declaration. You review and approve everything before it goes anywhere.",
  },
  el: {
    title: "CBAM στην Κύπρο: Τι Πρέπει να Κάνουν οι Εισαγωγείς Χάλυβα, Τσιμέντου, Αλουμινίου και Λιπασμάτων το 2026–2027",
    metaTitle: "CBAM Κύπρος 2026: Οδηγός και Προθεσμίες Εισαγωγέα",
    metaDescription:
      "CBAM για εισαγωγείς στην Κύπρο: όριο 50 τόνων, καθεστώς εγκεκριμένου δηλούντος, αρμόδιες αρχές, δεδομένα προμηθευτών και προθεσμίες 2027.",
    heroEyebrow: "Κυπριακός ρυθμιστικός οδηγός",
    heroSubtitle:
      "Από την 1η Ιανουαρίου 2026 ο CBAM δεν είναι πλέον απλή υποβολή εκθέσεων. Όσοι εισάγουν πάνω από 50 τόνους καλυπτόμενων αγαθών τον χρόνο χρειάζονται έγκριση, δεδομένα από προμηθευτές και προϋπολογισμό για πιστοποιητικά.",
    tocLabel: "Σε αυτή τη σελίδα",
    introduction: [
      "Η Κύπρος παράγει ελάχιστο χάλυβα, αλουμίνιο ή λιπάσματα. Κατασκευαστές, έμποροι, βιομηχανίες και διανομείς βασίζονται σε εισαγωγές από Τουρκία, Αίγυπτο, Κίνα, Ουκρανία και άλλες χώρες εκτός ΕΕ. Αυτά ακριβώς τα αγαθά επιβαρύνει με τιμή άνθρακα ο Μηχανισμός Συνοριακής Προσαρμογής Άνθρακα (CBAM).",
      "Η μεταβατική περίοδος (Οκτώβριος 2023 – Δεκέμβριος 2025) ζητούσε μόνο τριμηνιαίες εκθέσεις. Η οριστική περίοδος ξεκίνησε την 1η Ιανουαρίου 2026. Η απλοποίηση του Οκτωβρίου 2025 (Κανονισμός (ΕΕ) 2025/2083) εξαίρεσε τους περισσότερους μικρούς εισαγωγείς, όμως για όσους παραμένουν οι υποχρεώσεις είναι πλέον οικονομικές.",
      "Ο οδηγός εξηγεί αν η εταιρεία σας καλύπτεται, τι πρέπει να κάνει και πότε, και πού συνήθως κολλάει η δουλειά. Δεν αποτελεί νομική συμβουλή· επιβεβαιώστε τη θέση σας με τον εκτελωνιστή σας ή την αρμόδια αρχή.",
    ],
    sections: [
      {
        heading: "Ποια αγαθά καλύπτονται",
        body: [
          "Ο CBAM καλύπτει έξι τομείς: τσιμέντο, σίδηρο και χάλυβα, αλουμίνιο, λιπάσματα, υδρογόνο και ηλεκτρική ενέργεια. Η κάλυψη ορίζεται με κωδικούς ΣΟ στο Παράρτημα I του Κανονισμού (ΕΕ) 2023/956 και περιλαμβάνει βίδες, μπουλόνια, σωλήνες, οπλισμό σκυροδέματος, προφίλ αλουμινίου και πολλά ημικατεργασμένα προϊόντα.",
          "Αγαθά που παράγονται εντός ΕΕ, π.χ. από Ελλάδα ή Ιταλία, δεν υπόκεινται σε CBAM. Αυτό που μετρά είναι η καταγωγή κατά τη θέση σε ελεύθερη κυκλοφορία στην ΕΕ, όχι η χώρα του πωλητή.",
          "Ο γρηγορότερος έλεγχος: ζητήστε από τον εκτελωνιστή τις διασαφήσεις εισαγωγής του προηγούμενου έτους και φιλτράρετε με τους κωδικούς του Παραρτήματος I. Συχνά εμφανίζονται αγαθά που δεν περιμένατε, όπως στερεωτικά, πλέγματα και μείγματα λιπασμάτων.",
        ],
      },
      {
        heading: "Το όριο των 50 τόνων",
        body: [
          "Από το 2026 εξαιρείται ο εισαγωγέας του οποίου η συνολική καθαρή μάζα καλυπτόμενων αγαθών ανά ημερολογιακό έτος δεν ξεπερνά τους 50 τόνους. Η ηλεκτρική ενέργεια και το υδρογόνο δεν μετρούν στο όριο και καλύπτονται πάντα.",
          "Το όριο είναι αθροιστικό για όλα τα αγαθά και ισχύει ανά εισαγωγέα, όχι ανά αποστολή. Πενήντα τόνοι είναι δύο με τρία φορτηγά οπλισμού ή τσιμέντου· ένα μικρό κατάστημα σιδηρικών ίσως μείνει κάτω, ένας εργολάβος συνήθως όχι.",
          "Αν ξεπεράσετε τους 50 τόνους μέσα στο έτος, ο CBAM εφαρμόζεται σε όλες τις καλυπτόμενες εισαγωγές της χρονιάς. Παρακολουθείτε την αθροιστική ποσότητα κάθε μήνα.",
        ],
      },
      {
        heading: "Καθεστώς εγκεκριμένου δηλούντος CBAM",
        body: [
          "Πάνω από το όριο, μόνο εγκεκριμένος δηλών CBAM μπορεί να εισάγει καλυπτόμενα αγαθά. Η αίτηση γίνεται στο Μητρώο CBAM της ΕΕ μέσω EU Login και αποφασίζει η εθνική αρμόδια αρχή. Όποιος είχε υποβάλει αίτηση έως τις 31 Μαρτίου 2026 μπορούσε να συνεχίσει τις εισαγωγές μέχρι την απόφαση.",
          "Στην Κύπρο αρμόδια αρχή για τον CBAM είναι το Τμήμα Περιβάλλοντος (Υπουργείο Γεωργίας, Αγροτικής Ανάπτυξης και Περιβάλλοντος). Το Τμήμα Τελωνείων και Ειδικών Φόρων ελέγχει το καθεστώς στα σύνορα και παρέχει δεδομένα εισαγωγών.",
          "Θα χρειαστείτε στοιχεία εταιρείας και EORI, απόδειξη ότι δεν υπάρχουν σοβαρές τελωνειακές ή φορολογικές παραβάσεις και απόδειξη οικονομικής και επιχειρησιακής ικανότητας. Εταιρείες με λιγότερα από δύο οικονομικά έτη λειτουργίας ενδέχεται να χρειαστούν εγγύηση.",
        ],
      },
      {
        heading: "Προθεσμίες για τις εισαγωγές του 2026",
        body: [
          "1 Φεβρουαρίου 2027: ξεκινά η πώληση πιστοποιητικών CBAM στην κοινή κεντρική πλατφόρμα. Η τιμή για τις εισαγωγές του 2026 βασίζεται στη μέση τιμή δημοπρασιών του ΣΕΔΕ ανά τρίμηνο του 2026.",
          "30 Σεπτεμβρίου 2027: λήγει η πρώτη ετήσια δήλωση CBAM για όλα τα αγαθά που εισήχθησαν το 2026, τις ενσωματωμένες εκπομπές τους και τυχόν τιμή άνθρακα που καταβλήθηκε στη χώρα καταγωγής. Ταυτόχρονα παραδίδονται τα αντίστοιχα πιστοποιητικά.",
          "Από το 2027 οι εγκεκριμένοι δηλούντες πρέπει να κατέχουν πιστοποιητικά για τουλάχιστον το 50% των ενσωματωμένων εκπομπών των εισαγωγών του έτους, με τριμηνιαίο έλεγχο. Συμπεριλάβετέ το στον προγραμματισμό ταμειακών ροών από τώρα.",
        ],
      },
      {
        heading: "Δεδομένα προμηθευτών: προεπιλεγμένες τιμές ή πραγματικές εκπομπές",
        body: [
          "Για κάθε προϊόν μπορείτε να δηλώσετε πραγματικές ενσωματωμένες εκπομπές, επαληθευμένες από διαπιστευμένο επαληθευτή, ή τις προεπιλεγμένες τιμές που δημοσιεύει η Ευρωπαϊκή Επιτροπή ανά χώρα και προϊόν.",
          "Οι προεπιλεγμένες τιμές είναι συντηρητικές και περιλαμβάνουν προσαύξηση που αυξάνεται με τα χρόνια, οπότε συνήθως σημαίνουν περισσότερα πιστοποιητικά. Πραγματικά δεδομένα από αποδοτικό εργοστάσιο μπορούν να μειώσουν σημαντικά το κόστος.",
          "Ξεκινήστε νωρίς τα αιτήματα προς προμηθευτές. Πολλά χαλυβουργεία σε Τουρκία και Αίγυπτο έχουν ήδη σχέδια παρακολούθησης· μικρότεροι έμποροι συχνά όχι. Ζητήστε αναγνωριστικό εγκατάστασης, μέθοδο παραγωγής και επαληθευμένες εκπομπές ανά τόνο, και κρατήστε κάθε απάντηση.",
        ],
      },
      {
        heading: "Πρακτικό πλάνο 90 ημερών",
        body: [
          "Ημέρες 1–30: συγκεντρώστε τα δεδομένα εισαγωγών του 2026, ταξινομήστε τα ανά κωδικό ΣΟ και υπολογίστε την αθροιστική ποσότητα. Αν είστε πάνω ή κοντά στους 50 τόνους, επιβεβαιώστε το καθεστώς σας στο Μητρώο CBAM.",
          "Ημέρες 31–60: καταγράψτε τους προμηθευτές εκτός ΕΕ ανά προϊόν, στείλτε δομημένα αιτήματα δεδομένων και σημειώστε ποιοι μπορούν να δώσουν επαληθευμένα στοιχεία. Εκτιμήστε το κόστος του 2026 με τις προεπιλεγμένες τιμές ως χειρότερο σενάριο.",
          "Ημέρες 61–90: συμφωνήστε με το λογιστήριο προϋπολογισμό και τριμηνιαίο πλάνο κατοχής πιστοποιητικών για το 2027, προσθέστε όρους CBAM στις νέες συμβάσεις και ορίστε ποιος είναι υπεύθυνος για τη δήλωση του Σεπτεμβρίου 2027.",
        ],
      },
    ],
    keyTakeaways: [
      "Η οριστική περίοδος του CBAM ξεκίνησε την 1η Ιανουαρίου 2026· η εισαγωγή καλυπτόμενων αγαθών είναι πλέον οικονομική υποχρέωση.",
      "Εξαιρούνται εισαγωγείς έως 50 τόνων τον χρόνο (εκτός ηλεκτρικής ενέργειας και υδρογόνου)· το όριο είναι αθροιστικό ανά εισαγωγέα.",
      "Πάνω από το όριο χρειάζεται καθεστώς εγκεκριμένου δηλούντος μέσω του Μητρώου CBAM της ΕΕ.",
      "Η πρώτη ετήσια δήλωση για το 2026 λήγει 30 Σεπτεμβρίου 2027· τα πιστοποιητικά πωλούνται από 1 Φεβρουαρίου 2027.",
      "Τα επαληθευμένα δεδομένα προμηθευτών συνήθως κοστίζουν λιγότερο από τις προεπιλεγμένες τιμές. Ξεκινήστε τη συλλογή τώρα.",
    ],
    faq: [
      {
        q: "Ποια είναι η αρμόδια αρχή CBAM στην Κύπρο;",
        a: "Το Τμήμα Περιβάλλοντος είναι υπεύθυνο για την έγκριση και την εποπτεία, ενώ το Τμήμα Τελωνείων εφαρμόζει τους ελέγχους στα σύνορα. Επιβεβαιώστε τα τρέχοντα σημεία επαφής στο gov.cy πριν την αίτηση.",
      },
      {
        q: "Εισάγουμε λιγότερο από 50 τόνους τον χρόνο. Χρειάζεται να κάνουμε κάτι;",
        a: "Εξαιρείστε από έγκριση, πιστοποιητικά και δηλώσεις, αλλά κρατήστε αρχεία με την ετήσια ποσότητα και παρακολουθείτε την κάθε μήνα αν οι όγκοι αυξάνονται.",
      },
      {
        q: "Καλύπτονται αγαθά που αγοράζουμε από Έλληνα προμηθευτή;",
        a: "Όχι, αν παρήχθησαν στην ΕΕ ή έχουν ήδη τεθεί σε ελεύθερη κυκλοφορία στην ΕΕ. Αν Έλληνας έμπορος εισάγει χάλυβα εκτός ΕΕ, η υποχρέωση βαραίνει εκείνον που τον εισήγαγε.",
      },
      {
        q: "Μπορεί ο εκτελωνιστής να υποβάλει τη δήλωση CBAM;",
        a: "Ένας τελωνειακός αντιπρόσωπος μπορεί να ενεργεί για λογαριασμό σας σε ορισμένες περιπτώσεις, αλλά τα δεδομένα εκπομπών, τα στοιχεία προμηθευτών και η αγορά πιστοποιητικών παραμένουν δική σας ευθύνη. Συμφωνήστε γραπτώς ποιος κάνει τι.",
      },
      {
        q: "Τι γίνεται αν χρησιμοποιήσουμε μόνο προεπιλεγμένες τιμές;",
        a: "Είναι νόμιμο, αλλά συνήθως ακριβότερο, επειδή οι τιμές είναι σκόπιμα συντηρητικές με αυξανόμενη προσαύξηση. Ταιριάζουν σε μικρά προϊόντα, όχι στους μεγαλύτερους όγκους σας.",
      },
    ],
    ctaHeading: "Δείτε πού βρίσκεται η εταιρεία σας στον CBAM",
    ctaBody:
      "Η Vuneli κρατά σε ένα σημείο προμηθευτές, ποσότητες εισαγωγών και στοιχεία εκπομπών, χρησιμοποιεί τις επίσημες προεπιλεγμένες τιμές της Επιτροπής όπου λείπουν πραγματικά δεδομένα και σας βοηθά να ετοιμάσετε τη δήλωση. Εσείς ελέγχετε και εγκρίνετε τα πάντα.",
  },
});
