import { makePillar } from "./_factory";

export const cbamAuthorisationDeclarantPortal = makePillar({
  slug: "cbam-authorisation-declarant-portal",
  category: "cbam",
  primaryKeyword: "CBAM authorised declarant application",
  readingMinutes: 8,
  publishedAt: "2026-10-01",
  updatedAt: "2026-10-01",
  relatedSlugs: ["cbam-cyprus", "cbam-default-values-explained", "cbam-explained", "esg-software-cyprus"],
  en: {
    title: "How to Apply for CBAM Authorised Declarant Status in the EU Declarant Portal",
    metaTitle: "CBAM Authorised Declarant: Declarant Portal Guide",
    metaDescription:
      "A plain-English walkthrough of the EU CBAM Declarant Portal: access with EU Login, submitting the authorisation application, guarantees, answering the authority, and what the account screens show.",
    heroEyebrow: "CBAM how-to",
    heroSubtitle:
      "Importers of more than 50 tonnes of CBAM goods a year need an authorisation before they import. This guide walks through the Declarant Portal as described in the Commission's own user manual (version 6.00, June 2026).",
    tocLabel: "On this page",
    introduction: [
      "The CBAM Declarant Portal is the European Commission's web interface where importers apply for and manage their CBAM authorisation, receive messages from their national competent authority and, from 2027, follow certificates and declarations.",
      "This guide summarises the publicly available user manual published by DG TAXUD (reference DLV-984-7.3-202-1-15, version 6.00 EN of 16 June 2026). Screens change between releases, so check the latest manual if something looks different.",
    ],
    sections: [
      {
        heading: "Before you start",
        body: [
          "You need an EU Login account and the right permissions for your company, set up through the access arrangements described in the manual. Check you know your company's EORI number; the portal can look up name and address data from an EORI (or a TIN for EFTA importers) to prefill forms.",
          "Gather supporting documents in advance: company registration, evidence of no serious customs or tax infringements, and financial and operational information. Attachments can be dragged into the upload area, with a maximum size of 20 MB per file.",
        ],
      },
      {
        heading: "Submitting the application",
        body: [
          "In the Authorisations block of the menu, choose New application. The application form is split into tabs covering stakeholders, activity details and financial and operational details. Each tab must be completed before you submit.",
          "The portal checks forms in two stages: syntactic validation (format and required fields) and semantic validation (consistency against rules). Errors are shown next to the fields concerned. You can save an unfinished application and return to it from My drafts; drafts remain until you submit or delete them.",
          "After submission you land on the View application page, where you can follow the status and export a PDF copy in your chosen language. Exported files are named by date and reference number; attachments are not included in the export.",
        ],
      },
      {
        heading: "After you apply",
        body: [
          "Your national competent authority may send requests for additional information through the portal's notifications. Answer them from the notification itself, and adjust your email preferences so you do not miss them.",
          "The authorisation module also covers amendments, guarantee registration, adjustment and release, re-assessment, revocation and your right to appeal. Companies established for less than two financial years may be asked to provide a guarantee.",
        ],
      },
      {
        heading: "The account and monitoring screens",
        body: [
          "Once authorised, the portal shows your CBAM declarant account, an overview of quantifiable assets (goods in tonnes or MWh, emissions in tCO2 and certificates in number and euros), and financial liabilities.",
          "Certificate purchases start on 1 February 2027 and the first declaration is submitted in 2027, so certificate and declaration screens contain no data until then. The monitoring screens will later show goods and emissions, coverage, certificates and the quarterly holding-rule checks.",
        ],
      },
      {
        heading: "Where Vuneli fits",
        body: [
          "The portal is where the legal steps happen, and only an authorised declarant can submit. Vuneli helps with the work before that: totalling your covered imports against the 50-tonne threshold, collecting supplier data, applying official default values and preparing the figures you will need.",
        ],
      },
    ],
    keyTakeaways: [
      "Above 50 tonnes a year of CBAM goods, you need an authorisation from your national competent authority, applied for in the Declarant Portal.",
      "You need EU Login access and your EORI; the portal can prefill company data from it.",
      "Forms are validated for format and consistency; unfinished applications can be saved as drafts.",
      "Authorities contact you through portal notifications. Answer them there and set email preferences.",
      "Certificate and declaration screens fill from 2027, when purchases and the first declaration begin.",
    ],
    faq: [
      {
        q: "Who decides on my CBAM authorisation in Cyprus?",
        a: "The national competent authority. In Cyprus, CBAM sits with the Department of Environment, working with the Customs and Excise Department.",
      },
      {
        q: "Can I save an application and finish it later?",
        a: "Yes. Use Save for later; the draft appears under My drafts until you submit or delete it.",
      },
      {
        q: "What is the maximum attachment size?",
        a: "20 MB per file, according to the Commission's user manual version 6.00.",
      },
      {
        q: "Why are my certificate screens empty?",
        a: "Certificate purchases begin on 1 February 2027 and the first declaration is submitted in 2027, so those screens hold no data before then.",
      },
    ],
    ctaHeading: "Arrive at the portal with your numbers ready",
    ctaBody:
      "Vuneli totals your covered imports, collects supplier evidence and applies official default values, so the figures you need for authorisation and your first declaration are ready and sourced.",
  },
  el: {
    title: "Πώς να Υποβάλετε Αίτηση για Καθεστώς Εγκεκριμένου Δηλούντος CBAM στην Πύλη Δηλούντων της ΕΕ",
    metaTitle: "Εγκεκριμένος Δηλών CBAM: Οδηγός Πύλης Δηλούντων",
    metaDescription:
      "Απλός οδηγός για την Πύλη Δηλούντων CBAM της ΕΕ: πρόσβαση με EU Login, αίτηση έγκρισης, εγγυήσεις, απαντήσεις στην αρχή και τι δείχνουν οι οθόνες λογαριασμού.",
    heroEyebrow: "Οδηγός CBAM",
    heroSubtitle:
      "Όσοι εισάγουν πάνω από 50 τόνους αγαθών CBAM τον χρόνο χρειάζονται έγκριση πριν την εισαγωγή. Ο οδηγός περιγράφει την Πύλη Δηλούντων με βάση το επίσημο εγχειρίδιο της Επιτροπής (έκδοση 6.00, Ιούνιος 2026).",
    tocLabel: "Σε αυτή τη σελίδα",
    introduction: [
      "Η Πύλη Δηλούντων CBAM είναι η διαδικτυακή εφαρμογή της Ευρωπαϊκής Επιτροπής όπου οι εισαγωγείς υποβάλλουν και διαχειρίζονται την έγκρισή τους, λαμβάνουν μηνύματα από την εθνική αρμόδια αρχή και, από το 2027, παρακολουθούν πιστοποιητικά και δηλώσεις.",
      "Ο οδηγός συνοψίζει το δημόσια διαθέσιμο εγχειρίδιο χρήσης της ΓΔ TAXUD (αναφορά DLV-984-7.3-202-1-15, έκδοση 6.00 EN της 16ης Ιουνίου 2026). Οι οθόνες αλλάζουν μεταξύ εκδόσεων· ελέγξτε το πιο πρόσφατο εγχειρίδιο αν κάτι διαφέρει.",
    ],
    sections: [
      {
        heading: "Πριν ξεκινήσετε",
        body: [
          "Χρειάζεστε λογαριασμό EU Login και τα κατάλληλα δικαιώματα για την εταιρεία σας. Έχετε έτοιμο τον αριθμό EORI· η πύλη μπορεί να αντλήσει όνομα και διεύθυνση από τον EORI (ή TIN για εισαγωγείς ΕΖΕΣ) για να συμπληρώσει αυτόματα τις φόρμες.",
          "Συγκεντρώστε εκ των προτέρων τα δικαιολογητικά: εγγραφή εταιρείας, απόδειξη ότι δεν υπάρχουν σοβαρές τελωνειακές ή φορολογικές παραβάσεις, οικονομικά και επιχειρησιακά στοιχεία. Τα συνημμένα σύρονται στην περιοχή μεταφόρτωσης, με μέγιστο μέγεθος 20 MB ανά αρχείο.",
        ],
      },
      {
        heading: "Υποβολή της αίτησης",
        body: [
          "Στην ενότητα Authorisations του μενού επιλέξτε New application. Η φόρμα χωρίζεται σε καρτέλες για ενδιαφερόμενα μέρη, δραστηριότητα και οικονομικά-επιχειρησιακά στοιχεία. Κάθε καρτέλα πρέπει να συμπληρωθεί πριν την υποβολή.",
          "Η πύλη ελέγχει τις φόρμες σε δύο στάδια: συντακτικός έλεγχος (μορφή και υποχρεωτικά πεδία) και σημασιολογικός έλεγχος (συνέπεια με τους κανόνες). Τα σφάλματα εμφανίζονται δίπλα στα πεδία. Μπορείτε να αποθηκεύσετε μισοτελειωμένη αίτηση και να επιστρέψετε από το My drafts· τα προσχέδια μένουν μέχρι να τα υποβάλετε ή να τα διαγράψετε.",
          "Μετά την υποβολή μεταφέρεστε στη σελίδα View application, όπου παρακολουθείτε την κατάσταση και εξάγετε αντίγραφο PDF στη γλώσσα που επιλέγετε. Τα συνημμένα δεν περιλαμβάνονται στην εξαγωγή.",
        ],
      },
      {
        heading: "Μετά την αίτηση",
        body: [
          "Η εθνική αρμόδια αρχή μπορεί να ζητήσει επιπλέον πληροφορίες μέσω των ειδοποιήσεων της πύλης. Απαντάτε από την ίδια την ειδοποίηση και ρυθμίζετε τις προτιμήσεις email ώστε να μη χάνετε μηνύματα.",
          "Η ενότητα έγκρισης καλύπτει επίσης τροποποιήσεις, καταχώριση, προσαρμογή και αποδέσμευση εγγύησης, επανεκτίμηση, ανάκληση και δικαίωμα προσφυγής. Εταιρείες με λιγότερα από δύο οικονομικά έτη λειτουργίας μπορεί να χρειαστούν εγγύηση.",
        ],
      },
      {
        heading: "Οθόνες λογαριασμού και παρακολούθησης",
        body: [
          "Μετά την έγκριση, η πύλη δείχνει τον λογαριασμό δηλούντος CBAM, επισκόπηση ποσοτικοποιήσιμων στοιχείων (αγαθά σε τόνους ή MWh, εκπομπές σε tCO2, πιστοποιητικά σε αριθμό και ευρώ) και οικονομικές υποχρεώσεις.",
          "Οι αγορές πιστοποιητικών ξεκινούν την 1η Φεβρουαρίου 2027 και η πρώτη δήλωση υποβάλλεται το 2027, οπότε οι σχετικές οθόνες δεν έχουν δεδομένα μέχρι τότε.",
        ],
      },
      {
        heading: "Πού βοηθά η Vuneli",
        body: [
          "Η πύλη είναι το σημείο των νομικών βημάτων και μόνο εγκεκριμένος δηλών μπορεί να υποβάλει. Η Vuneli βοηθά στη δουλειά πριν από αυτό: άθροιση των καλυπτόμενων εισαγωγών έναντι του ορίου των 50 τόνων, συλλογή δεδομένων προμηθευτών, εφαρμογή επίσημων προεπιλεγμένων τιμών και προετοιμασία των αριθμών που θα χρειαστείτε.",
        ],
      },
    ],
    keyTakeaways: [
      "Πάνω από 50 τόνους αγαθών CBAM τον χρόνο χρειάζεστε έγκριση της εθνικής αρμόδιας αρχής μέσω της Πύλης Δηλούντων.",
      "Χρειάζεστε πρόσβαση EU Login και τον EORI σας· η πύλη συμπληρώνει από αυτόν στοιχεία εταιρείας.",
      "Οι φόρμες ελέγχονται για μορφή και συνέπεια· οι μισοτελειωμένες αιτήσεις αποθηκεύονται ως προσχέδια.",
      "Οι αρχές επικοινωνούν μέσω ειδοποιήσεων της πύλης. Απαντάτε εκεί και ρυθμίζετε τις προτιμήσεις email.",
      "Οι οθόνες πιστοποιητικών και δηλώσεων γεμίζουν από το 2027.",
    ],
    faq: [
      {
        q: "Ποιος αποφασίζει για την έγκριση CBAM στην Κύπρο;",
        a: "Η εθνική αρμόδια αρχή. Στην Κύπρο ο CBAM ανήκει στο Τμήμα Περιβάλλοντος, σε συνεργασία με το Τμήμα Τελωνείων και Ειδικών Φόρων.",
      },
      {
        q: "Μπορώ να αποθηκεύσω την αίτηση και να την ολοκληρώσω αργότερα;",
        a: "Ναι. Με το Save for later το προσχέδιο εμφανίζεται στο My drafts μέχρι να το υποβάλετε ή να το διαγράψετε.",
      },
      {
        q: "Ποιο είναι το μέγιστο μέγεθος συνημμένου;",
        a: "20 MB ανά αρχείο, σύμφωνα με το εγχειρίδιο χρήσης της Επιτροπής, έκδοση 6.00.",
      },
      {
        q: "Γιατί είναι κενές οι οθόνες πιστοποιητικών;",
        a: "Οι αγορές πιστοποιητικών ξεκινούν την 1η Φεβρουαρίου 2027 και η πρώτη δήλωση υποβάλλεται το 2027.",
      },
    ],
    ctaHeading: "Φτάστε στην πύλη με έτοιμους αριθμούς",
    ctaBody:
      "Η Vuneli αθροίζει τις καλυπτόμενες εισαγωγές σας, συλλέγει στοιχεία προμηθευτών και εφαρμόζει επίσημες προεπιλεγμένες τιμές, ώστε οι αριθμοί για την έγκριση και την πρώτη δήλωση να είναι έτοιμοι και τεκμηριωμένοι.",
  },
});
