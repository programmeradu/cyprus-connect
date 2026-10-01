import { makePillar } from "./_factory";

export const eudrGuide = makePillar({
  slug: "eudr-guide",
  category: "esg",
  primaryKeyword: "EUDR",
  readingMinutes: 10,
  publishedAt: "2026-10-01",
  updatedAt: "2026-10-01",
  relatedSlugs: ["scope-3-emissions-calculation", "cbam-cyprus", "sustainability-reporting-eu", "double-materiality-assessment"],
  en: {
    title: "EUDR Explained: The EU Deforestation Regulation for Importers, Traders and SMEs",
    metaTitle: "EUDR Guide 2026: Deadlines, Scope and Due Diligence",
    metaDescription:
      "The EU Deforestation Regulation in plain English: covered products, the December 2026 and June 2027 deadlines, due diligence statements and what SMEs in Cyprus should prepare.",
    heroEyebrow: "EU regulation guide",
    heroSubtitle:
      "Coffee, cocoa, wood, rubber, soya, palm oil and cattle products sold in the EU must be deforestation-free and traceable to the plot of land. Large operators apply from 30 December 2026; micro and small enterprises from 30 June 2027.",
    tocLabel: "On this page",
    introduction: [
      "The EU Deforestation Regulation (Regulation (EU) 2023/1115, usually called the EUDR) bans placing certain commodities and products on the EU market, or exporting them, unless they are deforestation-free, produced legally in the country of origin and covered by a due diligence statement.",
      "Application has been postponed twice. After the December 2025 amendment, the obligations apply from 30 December 2026 for large and medium operators and from 30 June 2027 for micro and small enterprises. The same amendment narrowed what downstream companies have to do.",
      "For a Cypriot coffee roaster, furniture importer, chocolate maker or timber merchant, this is a supply-chain data problem more than a sustainability one: can you prove where your product was grown, down to geographic coordinates?",
    ],
    sections: [
      {
        heading: "What the EUDR covers",
        body: [
          "Seven commodities are in scope: cattle, cocoa, coffee, oil palm, rubber, soya and wood. Annex I lists the derived products by customs code, including leather, chocolate, roasted coffee, furniture, printed paper, charcoal, tyres and many wood packaging materials.",
          "A product is deforestation-free if the land it came from was not deforested after 31 December 2020 (and, for wood, if the forest was not degraded after that date). It must also be produced in line with the relevant laws of the producing country, including land-use rights, labour rights and tax rules.",
          "There is no volume threshold. One pallet of coffee is covered just like a container.",
        ],
      },
      {
        heading: "Operators, traders and who files what",
        body: [
          "An operator places a relevant product on the EU market for the first time, or exports it. In practice that is usually the importer. Operators must run due diligence and submit a due diligence statement in the EU information system (TRACES) before the goods are placed on the market or exported.",
          "Following the 2025 simplification, downstream operators and traders who buy products already placed on the EU market no longer submit their own due diligence statements. They must still keep the reference numbers of the statements covering their goods and pass them along the chain.",
          "Micro and small primary operators in low-risk countries can submit a simplified one-off declaration instead of repeated statements. Check whether your situation qualifies before you build a heavier process than you need.",
        ],
      },
      {
        heading: "What due diligence actually involves",
        body: [
          "Information collection: product description, quantity, supplier and customer, country of production, and geolocation of every plot where the commodity was produced (coordinates for small plots, polygons for plots over four hectares for most commodities), plus the production date or range.",
          "Risk assessment: consider the country benchmark published by the Commission (low, standard or high risk), how complex the supply chain is, the risk of mixing with products of unknown origin, and relevant reports from authorities and civil society.",
          "Risk mitigation: if the risk is not negligible, gather more evidence, such as independent audits, satellite checks or supplier documentation, or do not place the product on the market. Keep records for five years and review your system at least once a year.",
        ],
      },
      {
        heading: "Penalties and enforcement",
        body: [
          "Member States must set penalties that include fines of up to at least 4% of total annual EU turnover for the most serious breaches, confiscation of products and revenues, and temporary exclusion from public procurement and funding.",
          "Competent authorities run risk-based checks each year, with higher check rates for products from high-risk countries. Customs can stop goods at the border if no valid due diligence statement reference is provided.",
        ],
      },
      {
        heading: "How the EUDR fits with CSRD, VSME and CBAM",
        body: [
          "The EUDR is a product-access rule, not a reporting standard. You may never publish a sustainability report and still be fully covered. CBAM, by contrast, prices the carbon in specific industrial imports. Some companies, such as builders' merchants importing both steel and timber, will face both.",
          "The same supplier data can serve several purposes. Plot geolocation and supplier legality evidence for the EUDR also support land-use and biodiversity disclosures in a VSME or CSRD report and help banks assess green loan eligibility.",
        ],
      },
      {
        heading: "Preparation checklist for SMEs in Cyprus",
        body: [
          "Map your products to Annex I customs codes and mark which ones you import directly from outside the EU (you are the operator) and which you buy from EU suppliers (you are downstream).",
          "For directly imported goods, ask each supplier now for geolocation data, production dates and legality evidence in a consistent format. Expect gaps from smallholder supply chains in coffee and cocoa, and plan for them.",
          "Register in TRACES, decide who in the company submits statements, and keep a register linking each shipment to its statement reference. For goods from EU suppliers, require statement references on invoices or delivery notes.",
        ],
      },
    ],
    keyTakeaways: [
      "The EUDR covers cattle, cocoa, coffee, oil palm, rubber, soya, wood and their derived products, with no volume threshold.",
      "Obligations apply from 30 December 2026 for large and medium operators and 30 June 2027 for micro and small enterprises.",
      "Products must be deforestation-free since 31 December 2020, legally produced and traceable to plot-level geolocation.",
      "Operators submit due diligence statements in TRACES; downstream traders now mainly keep and pass on statement references.",
      "Fines can reach at least 4% of EU turnover. Start supplier data collection well before your deadline.",
    ],
    faq: [
      {
        q: "When does the EUDR start applying?",
        a: "From 30 December 2026 for large and medium operators and traders, and from 30 June 2027 for micro and small enterprises, following the amendment adopted in December 2025.",
      },
      {
        q: "We buy coffee from a roaster in Greece. Are we covered?",
        a: "You are a downstream operator or trader. You do not submit your own due diligence statement, but you must collect and keep the statement reference numbers from your supplier and pass them on if you sell to other businesses.",
      },
      {
        q: "Does recycled paper or wood fall under the EUDR?",
        a: "Products made entirely from material that has completed its lifecycle and would otherwise have been discarded as waste are excluded. Mixed or virgin content remains in scope.",
      },
      {
        q: "What is a due diligence statement?",
        a: "A declaration submitted in the EU's TRACES system confirming that due diligence was carried out and that no or only negligible risk was found. It includes the geolocation of the plots of production and generates a reference number that follows the goods.",
      },
      {
        q: "Is the EUDR the same as a carbon footprint requirement?",
        a: "No. It concerns land use and legality, not greenhouse gas emissions. The data overlaps with other reporting, but the obligation is separate.",
      },
    ],
    ctaHeading: "Keep supplier evidence in one place",
    ctaBody:
      "Vuneli keeps each supplier, its documents and the requests you send in one shared list, so EUDR, CBAM and reporting evidence are not scattered across inboxes. Requests to suppliers are only sent after you approve them.",
  },
  el: {
    title: "Ο EUDR με Απλά Λόγια: Ο Κανονισμός της ΕΕ για την Αποψίλωση για Εισαγωγείς, Εμπόρους και ΜμΕ",
    metaTitle: "Οδηγός EUDR 2026: Προθεσμίες, Πεδίο και Δέουσα Επιμέλεια",
    metaDescription:
      "Ο Κανονισμός της ΕΕ για την αποψίλωση απλά: καλυπτόμενα προϊόντα, προθεσμίες Δεκεμβρίου 2026 και Ιουνίου 2027, δηλώσεις δέουσας επιμέλειας και τι να προετοιμάσουν οι ΜμΕ στην Κύπρο.",
    heroEyebrow: "Οδηγός κανονισμού ΕΕ",
    heroSubtitle:
      "Καφές, κακάο, ξυλεία, καουτσούκ, σόγια, φοινικέλαιο και προϊόντα βοοειδών που πωλούνται στην ΕΕ πρέπει να είναι απαλλαγμένα από αποψίλωση και ιχνηλάσιμα μέχρι το αγροτεμάχιο. Ισχύει από 30 Δεκεμβρίου 2026 για μεγάλους φορείς και από 30 Ιουνίου 2027 για πολύ μικρές και μικρές επιχειρήσεις.",
    tocLabel: "Σε αυτή τη σελίδα",
    introduction: [
      "Ο Κανονισμός (ΕΕ) 2023/1115 για την αποψίλωση (EUDR) απαγορεύει τη διάθεση στην αγορά της ΕΕ ή την εξαγωγή ορισμένων βασικών προϊόντων, εκτός αν είναι απαλλαγμένα από αποψίλωση, έχουν παραχθεί νόμιμα και καλύπτονται από δήλωση δέουσας επιμέλειας.",
      "Η εφαρμογή αναβλήθηκε δύο φορές. Μετά την τροποποίηση του Δεκεμβρίου 2025, οι υποχρεώσεις ισχύουν από 30 Δεκεμβρίου 2026 για μεγάλους και μεσαίους φορείς και από 30 Ιουνίου 2027 για πολύ μικρές και μικρές επιχειρήσεις. Η ίδια τροποποίηση περιόρισε τις υποχρεώσεις των επόμενων κρίκων της αλυσίδας.",
      "Για έναν Κύπριο καφεκόπτη, εισαγωγέα επίπλων, σοκολατοποιό ή έμπορο ξυλείας, πρόκειται κυρίως για θέμα δεδομένων εφοδιαστικής αλυσίδας: μπορείτε να αποδείξετε πού καλλιεργήθηκε το προϊόν σας, με γεωγραφικές συντεταγμένες;",
    ],
    sections: [
      {
        heading: "Τι καλύπτει ο EUDR",
        body: [
          "Επτά βασικά προϊόντα: βοοειδή, κακάο, καφές, ελαιοφοίνικας, καουτσούκ, σόγια και ξυλεία. Το Παράρτημα I απαριθμεί τα παράγωγα ανά δασμολογικό κωδικό, όπως δέρμα, σοκολάτα, καβουρδισμένος καφές, έπιπλα, έντυπα, ξυλάνθρακας, ελαστικά και ξύλινες συσκευασίες.",
          "Ένα προϊόν είναι απαλλαγμένο από αποψίλωση αν η γη από την οποία προήλθε δεν αποψιλώθηκε μετά τις 31 Δεκεμβρίου 2020 (και, για την ξυλεία, αν το δάσος δεν υποβαθμίστηκε μετά από αυτή την ημερομηνία). Πρέπει επίσης να έχει παραχθεί σύμφωνα με τη νομοθεσία της χώρας παραγωγής.",
          "Δεν υπάρχει όριο ποσότητας. Μία παλέτα καφέ καλύπτεται όπως ένα κοντέινερ.",
        ],
      },
      {
        heading: "Φορείς, έμποροι και ποιος υποβάλλει τι",
        body: [
          "Φορέας είναι όποιος διαθέτει για πρώτη φορά ένα προϊόν στην αγορά της ΕΕ ή το εξάγει, συνήθως ο εισαγωγέας. Οι φορείς διενεργούν δέουσα επιμέλεια και υποβάλλουν δήλωση στο σύστημα πληροφοριών της ΕΕ (TRACES) πριν τη διάθεση ή την εξαγωγή.",
          "Μετά την απλοποίηση του 2025, οι επόμενοι φορείς και έμποροι που αγοράζουν προϊόντα ήδη διατεθειμένα στην αγορά της ΕΕ δεν υποβάλλουν δική τους δήλωση. Πρέπει όμως να κρατούν τους αριθμούς αναφοράς των δηλώσεων και να τους μεταβιβάζουν.",
          "Πολύ μικροί και μικροί πρωτογενείς φορείς σε χώρες χαμηλού κινδύνου μπορούν να υποβάλουν απλοποιημένη εφάπαξ δήλωση. Ελέγξτε αν σας αφορά πριν στήσετε βαρύτερη διαδικασία από όση χρειάζεστε.",
        ],
      },
      {
        heading: "Τι περιλαμβάνει η δέουσα επιμέλεια",
        body: [
          "Συλλογή πληροφοριών: περιγραφή και ποσότητα προϊόντος, προμηθευτής και πελάτης, χώρα παραγωγής και γεωεντοπισμός κάθε αγροτεμαχίου (συντεταγμένες για μικρά, πολύγωνα για αγροτεμάχια άνω των τεσσάρων εκταρίων στα περισσότερα προϊόντα), καθώς και ημερομηνία ή διάστημα παραγωγής.",
          "Αξιολόγηση κινδύνου: λάβετε υπόψη την κατάταξη χωρών της Επιτροπής (χαμηλός, κανονικός, υψηλός κίνδυνος), την πολυπλοκότητα της αλυσίδας, τον κίνδυνο ανάμειξης με προϊόντα άγνωστης προέλευσης και σχετικές εκθέσεις.",
          "Μετριασμός κινδύνου: αν ο κίνδυνος δεν είναι αμελητέος, συγκεντρώστε επιπλέον στοιχεία, όπως ανεξάρτητους ελέγχους, δορυφορικούς ελέγχους ή έγγραφα προμηθευτών, ή μη διαθέσετε το προϊόν. Τηρείτε αρχεία για πέντε χρόνια και επανεξετάζετε το σύστημα τουλάχιστον ετησίως.",
        ],
      },
      {
        heading: "Κυρώσεις και επιβολή",
        body: [
          "Τα κράτη μέλη ορίζουν κυρώσεις που περιλαμβάνουν πρόστιμα τουλάχιστον έως 4% του συνολικού ετήσιου κύκλου εργασιών στην ΕΕ για τις σοβαρότερες παραβάσεις, κατάσχεση προϊόντων και εσόδων και προσωρινό αποκλεισμό από δημόσιες συμβάσεις και χρηματοδότηση.",
          "Οι αρμόδιες αρχές κάνουν ετήσιους ελέγχους βάσει κινδύνου, με υψηλότερα ποσοστά για προϊόντα από χώρες υψηλού κινδύνου. Το τελωνείο μπορεί να σταματήσει εμπορεύματα χωρίς έγκυρο αριθμό αναφοράς δήλωσης.",
        ],
      },
      {
        heading: "Πώς συνδέεται με CSRD, VSME και CBAM",
        body: [
          "Ο EUDR είναι κανόνας πρόσβασης στην αγορά, όχι πρότυπο αναφοράς. Μπορεί να μην δημοσιεύετε ποτέ έκθεση βιωσιμότητας και να καλύπτεστε πλήρως. Ο CBAM, αντίθετα, τιμολογεί τον άνθρακα σε συγκεκριμένες βιομηχανικές εισαγωγές. Ένας έμπορος οικοδομικών υλικών που εισάγει χάλυβα και ξυλεία θα αντιμετωπίσει και τα δύο.",
          "Τα ίδια δεδομένα προμηθευτών εξυπηρετούν πολλούς σκοπούς: ο γεωεντοπισμός και τα στοιχεία νομιμότητας για τον EUDR στηρίζουν και γνωστοποιήσεις για χρήση γης και βιοποικιλότητα σε έκθεση VSME ή CSRD, και βοηθούν τις τράπεζες στην αξιολόγηση πράσινων δανείων.",
        ],
      },
      {
        heading: "Λίστα προετοιμασίας για ΜμΕ στην Κύπρο",
        body: [
          "Αντιστοιχίστε τα προϊόντα σας στους κωδικούς του Παραρτήματος I και σημειώστε ποια εισάγετε απευθείας από χώρες εκτός ΕΕ (είστε φορέας) και ποια αγοράζετε από προμηθευτές της ΕΕ (είστε επόμενος κρίκος).",
          "Για τις άμεσες εισαγωγές, ζητήστε από τώρα από κάθε προμηθευτή γεωεντοπισμό, ημερομηνίες παραγωγής και στοιχεία νομιμότητας σε ενιαία μορφή. Περιμένετε κενά από μικροκαλλιεργητές καφέ και κακάο και σχεδιάστε πώς θα τα καλύψετε.",
          "Εγγραφείτε στο TRACES, ορίστε ποιος υποβάλλει τις δηλώσεις και τηρείτε μητρώο που συνδέει κάθε αποστολή με τον αριθμό αναφοράς της. Για αγορές από την ΕΕ, ζητήστε τους αριθμούς αναφοράς στα τιμολόγια ή στα δελτία αποστολής.",
        ],
      },
    ],
    keyTakeaways: [
      "Ο EUDR καλύπτει βοοειδή, κακάο, καφέ, ελαιοφοίνικα, καουτσούκ, σόγια, ξυλεία και τα παράγωγά τους, χωρίς όριο ποσότητας.",
      "Ισχύει από 30 Δεκεμβρίου 2026 για μεγάλους και μεσαίους φορείς και από 30 Ιουνίου 2027 για πολύ μικρές και μικρές επιχειρήσεις.",
      "Τα προϊόντα πρέπει να είναι απαλλαγμένα από αποψίλωση μετά τις 31 Δεκεμβρίου 2020, νόμιμα και ιχνηλάσιμα σε επίπεδο αγροτεμαχίου.",
      "Οι φορείς υποβάλλουν δηλώσεις στο TRACES· οι επόμενοι κρίκοι κυρίως κρατούν και μεταβιβάζουν αριθμούς αναφοράς.",
      "Τα πρόστιμα φτάνουν τουλάχιστον το 4% του κύκλου εργασιών στην ΕΕ. Ξεκινήστε τη συλλογή δεδομένων νωρίς.",
    ],
    faq: [
      {
        q: "Πότε αρχίζει να ισχύει ο EUDR;",
        a: "Από 30 Δεκεμβρίου 2026 για μεγάλους και μεσαίους φορείς και εμπόρους, και από 30 Ιουνίου 2027 για πολύ μικρές και μικρές επιχειρήσεις, μετά την τροποποίηση του Δεκεμβρίου 2025.",
      },
      {
        q: "Αγοράζουμε καφέ από καφεκόπτη στην Ελλάδα. Μας αφορά;",
        a: "Είστε επόμενος φορέας ή έμπορος. Δεν υποβάλλετε δική σας δήλωση, αλλά πρέπει να συλλέγετε και να κρατάτε τους αριθμούς αναφοράς των δηλώσεων του προμηθευτή σας και να τους μεταβιβάζετε αν πουλάτε σε άλλες επιχειρήσεις.",
      },
      {
        q: "Καλύπτεται το ανακυκλωμένο χαρτί ή ξύλο;",
        a: "Προϊόντα φτιαγμένα εξ ολοκλήρου από υλικό που έχει ολοκληρώσει τον κύκλο ζωής του και θα απορριπτόταν ως απόβλητο εξαιρούνται. Μικτό ή παρθένο περιεχόμενο καλύπτεται.",
      },
      {
        q: "Τι είναι η δήλωση δέουσας επιμέλειας;",
        a: "Δήλωση στο σύστημα TRACES της ΕΕ ότι έγινε δέουσα επιμέλεια και ο κίνδυνος είναι μηδενικός ή αμελητέος. Περιλαμβάνει τον γεωεντοπισμό των αγροτεμαχίων και παράγει αριθμό αναφοράς που ακολουθεί τα εμπορεύματα.",
      },
      {
        q: "Είναι ο EUDR απαίτηση για αποτύπωμα άνθρακα;",
        a: "Όχι. Αφορά τη χρήση γης και τη νομιμότητα, όχι τις εκπομπές αερίων θερμοκηπίου. Τα δεδομένα επικαλύπτονται με άλλες αναφορές, αλλά η υποχρέωση είναι ξεχωριστή.",
      },
    ],
    ctaHeading: "Κρατήστε τα στοιχεία προμηθευτών σε ένα σημείο",
    ctaBody:
      "Η Vuneli κρατά κάθε προμηθευτή, τα έγγραφά του και τα αιτήματα που στέλνετε σε μία κοινή λίστα, ώστε τα στοιχεία για EUDR, CBAM και αναφορές να μην είναι σκορπισμένα σε email. Τα αιτήματα στέλνονται μόνο αφού τα εγκρίνετε.",
  },
});
