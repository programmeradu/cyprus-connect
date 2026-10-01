import { makePillar } from "./_factory";

export const sustainabilityDocumentRequestsSmes = makePillar({
  slug: "sustainability-document-requests-smes",
  category: "sme",
  primaryKeyword: "sustainability data request SME",
  readingMinutes: 7,
  publishedAt: "2026-10-01",
  updatedAt: "2026-10-01",
  relatedSlugs: ["vsme-reporting-guide", "green-loans-esg-data-smes", "cyprus-electricity-emission-factor", "carbon-accounting-for-smes"],
  en: {
    title: "Which Documents Does an SME Actually Need for Sustainability Reporting? A Consultant's Checklist",
    metaTitle: "Sustainability Reporting Documents: An SME Checklist",
    metaDescription:
      "The bills, invoices and records a small business needs for VSME, bank ESG questions and CBAM, and how Vuneli's assistant Verde asks only for what is missing.",
    heroEyebrow: "Product update",
    heroSubtitle:
      "A good consultant does not hand you a 200-question form. They look at what you already have, then ask for the two or three documents that would change the answer. We built Verde, Vuneli's assistant, to work the same way.",
    tocLabel: "On this page",
    introduction: [
      "Most small businesses already hold the evidence a sustainability report needs. It is spread across electricity bills, fuel receipts, supplier invoices, payroll and the company registry. The hard part is knowing which pieces matter for the question in front of you.",
      "This guide lists the documents that come up most often for VSME reports, bank green-loan questions and CBAM, and explains how Verde decides what to ask for. Verde is in active development; we describe what it does today and mark what is still coming.",
    ],
    sections: [
      {
        heading: "The short list most SMEs need",
        body: [
          "Electricity bills for every premises, for the full reporting year. They give kWh and dates, which become Scope 2 emissions.",
          "Fuel records: diesel or petrol for company vehicles and generators, and LPG or heating oil. They become Scope 1 emissions.",
          "Water bills, where water use matters for your sector or your customer asks.",
          "Headcount and basic workforce data from payroll: employees by gender, contract type and country.",
          "Company registry details: legal name, registration number, address and sector code. These anchor the report to the right entity.",
        ],
      },
      {
        heading: "What changes by goal",
        body: [
          "For a VSME Basic report, the list above covers most of the environmental and workforce disclosures. Governance is usually a short statement.",
          "For a bank green-loan conversation, the bank typically wants a credible footprint, the project's expected savings and evidence behind them, such as an energy audit or supplier quote for solar panels.",
          "For CBAM, you need customs declarations for imported steel, aluminium, cement, fertilisers, hydrogen or electricity, the quantity in tonnes, the country of origin and, where available, emissions data from the producing installation.",
        ],
      },
      {
        heading: "How Verde decides what to ask for",
        body: [
          "Verde starts from what Vuneli already holds: your company details, connected bank payments, uploaded bills and supplier list. It compares that against what the goal needs and names the gaps.",
          "When a gap would change the result, Verde asks one specific question, such as the number of employees or last year's revenue, or asks for one document, such as the missing March and April electricity bill. It does not ask for things it already has.",
          "When a document cannot be read with confidence, Verde says so and asks for a clearer copy. It never fills a gap with a guessed number.",
        ],
      },
      {
        heading: "People stay in charge",
        body: [
          "Verde proposes; a person approves. Changes to company details, new tasks and report drafts each wait for your approval, and every approved action is recorded with who approved it and when.",
          "Approved drafts appear in Deliverables, where you can review, correct and download them. Each downloaded PDF carries a fingerprint that anyone can check on Vuneli's public verification page.",
        ],
      },
      {
        heading: "What is still in development",
        body: [
          "Today Verde asks for missing facts and documents inside the app. Continuous background checks that notice a missing bill on their own, and introductions to local experts when a question needs a professional, are being built and are not yet available to all accounts.",
        ],
      },
    ],
    keyTakeaways: [
      "Most SMEs already hold the evidence: bills, fuel records, payroll and registry details.",
      "The documents you need depend on the goal: VSME, a green loan or CBAM.",
      "Verde compares what Vuneli holds with what the goal needs and asks only for the gaps.",
      "Nothing is guessed: unreadable documents trigger a request for a clearer copy.",
      "Every change and draft waits for a person to approve it, and approved drafts land in Deliverables.",
    ],
    faq: [
      {
        q: "Do I need all of these documents before I start?",
        a: "No. Start with what you have. Vuneli shows which figures are complete and which are missing, and Verde asks for the rest when it matters.",
      },
      {
        q: "Where do approved drafts go?",
        a: "To Deliverables in the app. After you approve a draft, a message with a direct link appears, and the draft stays in Deliverables for review and download.",
      },
      {
        q: "Can Verde change my data without asking?",
        a: "No. Verde can read your workspace and propose changes. Anything that changes data or produces a document waits for your approval.",
      },
      {
        q: "Is Verde available in Greek?",
        a: "Yes. Verde answers in English or Greek, matching the language you use in the app.",
      },
    ],
    ctaHeading: "See what is missing from your report",
    ctaBody:
      "Add your company details and a few bills. Vuneli shows what is complete, and Verde asks only for what would change the answer.",
  },
  el: {
    title: "Ποια έγγραφα χρειάζεται πραγματικά μια ΜμΕ για αναφορές βιωσιμότητας; Η λίστα ενός συμβούλου",
    metaTitle: "Έγγραφα για αναφορές βιωσιμότητας: λίστα για ΜμΕ",
    metaDescription:
      "Οι λογαριασμοί, τα τιμολόγια και τα αρχεία που χρειάζεται μια μικρή επιχείρηση για VSME, ερωτήσεις τραπεζών και CBAM, και πώς η Verde ζητά μόνο ό,τι λείπει.",
    heroEyebrow: "Νέα του προϊόντος",
    heroSubtitle:
      "Ένας καλός σύμβουλος δεν σας δίνει φόρμα 200 ερωτήσεων. Βλέπει τι έχετε ήδη και ζητά τα δύο ή τρία έγγραφα που θα άλλαζαν την απάντηση. Έτσι σχεδιάσαμε τη Verde, τη βοηθό της Vuneli.",
    tocLabel: "Σε αυτή τη σελίδα",
    introduction: [
      "Οι περισσότερες μικρές επιχειρήσεις έχουν ήδη τα στοιχεία που χρειάζεται μια αναφορά βιωσιμότητας. Είναι σκορπισμένα σε λογαριασμούς ηλεκτρισμού, αποδείξεις καυσίμων, τιμολόγια προμηθευτών, μισθοδοσία και στο μητρώο εταιρειών. Το δύσκολο είναι να ξέρετε ποια μετρούν για την ερώτηση που έχετε μπροστά σας.",
      "Ο οδηγός παραθέτει τα έγγραφα που ζητούνται πιο συχνά για αναφορές VSME, ερωτήσεις τραπεζών για πράσινα δάνεια και τον CBAM, και εξηγεί πώς αποφασίζει η Verde τι να ζητήσει. Η Verde βρίσκεται σε ενεργή ανάπτυξη· περιγράφουμε τι κάνει σήμερα και σημειώνουμε τι έρχεται.",
    ],
    sections: [
      {
        heading: "Η σύντομη λίστα που χρειάζονται οι περισσότερες ΜμΕ",
        body: [
          "Λογαριασμοί ηλεκτρισμού για κάθε υποστατικό, για όλο το έτος αναφοράς. Δίνουν kWh και ημερομηνίες, που γίνονται εκπομπές Scope 2.",
          "Αρχεία καυσίμων: πετρέλαιο ή βενζίνη για εταιρικά οχήματα και γεννήτριες, υγραέριο ή πετρέλαιο θέρμανσης. Γίνονται εκπομπές Scope 1.",
          "Λογαριασμοί νερού, όπου η χρήση νερού μετρά για τον κλάδο σας ή τη ζητά ο πελάτης.",
          "Αριθμός και βασικά στοιχεία προσωπικού από τη μισθοδοσία: εργαζόμενοι ανά φύλο, είδος σύμβασης και χώρα.",
          "Στοιχεία μητρώου εταιρειών: επωνυμία, αριθμός εγγραφής, διεύθυνση και κωδικός κλάδου. Συνδέουν την αναφορά με τη σωστή οντότητα.",
        ],
      },
      {
        heading: "Τι αλλάζει ανάλογα με τον στόχο",
        body: [
          "Για μια βασική αναφορά VSME, η παραπάνω λίστα καλύπτει τις περισσότερες περιβαλλοντικές γνωστοποιήσεις και όσες αφορούν το προσωπικό. Η διακυβέρνηση είναι συνήθως μια σύντομη δήλωση.",
          "Για συζήτηση με τράπεζα για πράσινο δάνειο, η τράπεζα θέλει συνήθως αξιόπιστο αποτύπωμα, την αναμενόμενη εξοικονόμηση του έργου και αποδεικτικά, όπως ενεργειακό έλεγχο ή προσφορά για φωτοβολταϊκά.",
          "Για τον CBAM χρειάζεστε τις τελωνειακές διασαφήσεις για εισαγόμενο χάλυβα, αλουμίνιο, τσιμέντο, λιπάσματα, υδρογόνο ή ηλεκτρισμό, την ποσότητα σε τόνους, τη χώρα προέλευσης και, όπου υπάρχουν, στοιχεία εκπομπών από την εγκατάσταση παραγωγής.",
        ],
      },
      {
        heading: "Πώς αποφασίζει η Verde τι να ζητήσει",
        body: [
          "Η Verde ξεκινά από όσα έχει ήδη η Vuneli: τα στοιχεία της εταιρείας, τις συνδεδεμένες τραπεζικές πληρωμές, τους λογαριασμούς που ανεβάσατε και τη λίστα προμηθευτών. Τα συγκρίνει με όσα χρειάζεται ο στόχος και ονομάζει τα κενά.",
          "Όταν ένα κενό θα άλλαζε το αποτέλεσμα, η Verde κάνει μία συγκεκριμένη ερώτηση, όπως τον αριθμό εργαζομένων ή τον περσινό κύκλο εργασιών, ή ζητά ένα έγγραφο, όπως τον λογαριασμό ηλεκτρισμού Μαρτίου και Απριλίου που λείπει. Δεν ζητά ό,τι έχει ήδη.",
          "Όταν ένα έγγραφο δεν διαβάζεται με βεβαιότητα, η Verde το λέει και ζητά πιο καθαρό αντίγραφο. Δεν συμπληρώνει ποτέ ένα κενό με αριθμό που μάντεψε.",
        ],
      },
      {
        heading: "Οι άνθρωποι αποφασίζουν",
        body: [
          "Η Verde προτείνει· ένας άνθρωπος εγκρίνει. Αλλαγές στα στοιχεία της εταιρείας, νέες εργασίες και προσχέδια αναφορών περιμένουν την έγκρισή σας, και κάθε εγκεκριμένη ενέργεια καταγράφεται με το ποιος την ενέκρινε και πότε.",
          "Τα εγκεκριμένα προσχέδια εμφανίζονται στα Παραδοτέα, όπου μπορείτε να τα ελέγξετε, να τα διορθώσετε και να τα κατεβάσετε. Κάθε PDF φέρει ένα αποτύπωμα που μπορεί να ελέγξει οποιοσδήποτε στη δημόσια σελίδα επαλήθευσης της Vuneli.",
        ],
      },
      {
        heading: "Τι βρίσκεται ακόμη σε ανάπτυξη",
        body: [
          "Σήμερα η Verde ζητά στοιχεία και έγγραφα που λείπουν μέσα στην εφαρμογή. Οι συνεχείς έλεγχοι στο παρασκήνιο που εντοπίζουν μόνοι τους έναν λογαριασμό που λείπει, και οι συστάσεις σε τοπικούς ειδικούς όταν μια ερώτηση χρειάζεται επαγγελματία, βρίσκονται υπό κατασκευή και δεν είναι ακόμη διαθέσιμα σε όλους τους λογαριασμούς.",
        ],
      },
    ],
    keyTakeaways: [
      "Οι περισσότερες ΜμΕ έχουν ήδη τα στοιχεία: λογαριασμούς, αρχεία καυσίμων, μισθοδοσία και στοιχεία μητρώου.",
      "Τα έγγραφα που χρειάζεστε εξαρτώνται από τον στόχο: VSME, πράσινο δάνειο ή CBAM.",
      "Η Verde συγκρίνει όσα έχει η Vuneli με όσα χρειάζεται ο στόχος και ζητά μόνο τα κενά.",
      "Τίποτα δεν μαντεύεται: ένα δυσανάγνωστο έγγραφο οδηγεί σε αίτημα για πιο καθαρό αντίγραφο.",
      "Κάθε αλλαγή και προσχέδιο περιμένει έγκριση από άνθρωπο, και τα εγκεκριμένα προσχέδια πηγαίνουν στα Παραδοτέα.",
    ],
    faq: [
      {
        q: "Χρειάζομαι όλα αυτά τα έγγραφα πριν ξεκινήσω;",
        a: "Όχι. Ξεκινήστε με ό,τι έχετε. Η Vuneli δείχνει ποιοι αριθμοί είναι πλήρεις και ποιοι λείπουν, και η Verde ζητά τα υπόλοιπα όταν χρειάζεται.",
      },
      {
        q: "Πού πηγαίνουν τα εγκεκριμένα προσχέδια;",
        a: "Στα Παραδοτέα της εφαρμογής. Μόλις εγκρίνετε ένα προσχέδιο, εμφανίζεται μήνυμα με απευθείας σύνδεσμο, και το προσχέδιο μένει στα Παραδοτέα για έλεγχο και λήψη.",
      },
      {
        q: "Μπορεί η Verde να αλλάξει τα δεδομένα μου χωρίς να ρωτήσει;",
        a: "Όχι. Η Verde διαβάζει τον χώρο εργασίας σας και προτείνει αλλαγές. Ό,τι αλλάζει δεδομένα ή δημιουργεί έγγραφο περιμένει την έγκρισή σας.",
      },
      {
        q: "Είναι διαθέσιμη η Verde στα ελληνικά;",
        a: "Ναι. Η Verde απαντά στα αγγλικά ή στα ελληνικά, ανάλογα με τη γλώσσα που χρησιμοποιείτε στην εφαρμογή.",
      },
    ],
    ctaHeading: "Δείτε τι λείπει από την αναφορά σας",
    ctaBody:
      "Προσθέστε τα στοιχεία της εταιρείας και μερικούς λογαριασμούς. Η Vuneli δείχνει τι είναι πλήρες και η Verde ζητά μόνο ό,τι θα άλλαζε την απάντηση.",
  },
});
