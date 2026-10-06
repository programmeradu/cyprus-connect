import { makePillar } from "./_factory";

export const cyprusElectricityEmissionFactor = makePillar({
  slug: "cyprus-electricity-emission-factor",
  category: "cyprus",
  primaryKeyword: "Cyprus electricity emission factor",
  readingMinutes: 8,
  publishedAt: "2026-10-01",
  updatedAt: "2026-10-01",
  relatedSlugs: ["scope-1-2-3-explained-simply", "carbon-accounting-for-smes", "vsme-reporting-guide", "green-loans-esg-data-smes"],
  en: {
    title: "The Cyprus Electricity Emission Factor: Turning an EAC Bill Into Scope 2 Emissions",
    metaTitle: "Cyprus Electricity Emission Factor: EAC Bills to Scope 2",
    metaDescription:
      "Why Cypriot electricity carries one of the highest carbon intensities in the EU, which factor to use for Scope 2, and how to turn EAC bills into a defensible figure.",
    heroEyebrow: "Cyprus guide",
    heroSubtitle:
      "For most Cypriot SMEs, electricity is the largest line in the carbon footprint. The number on your EAC bill is in kWh; the number a bank or customer wants is in tonnes of CO2e. This is how you get from one to the other.",
    tocLabel: "On this page",
    introduction: [
      "Cyprus runs an isolated island grid. It has no electricity interconnection with mainland Europe yet, and most of its power still comes from oil-fired plants at Vasilikos, Dhekelia and Moni. Solar has grown fast, but the grid as a whole remains one of the most carbon-intensive in the EU.",
      "That matters for every business that reports Scope 2 emissions: the emissions caused by the electricity you buy. The same 10,000 kWh used in an office in Nicosia produces several times the emissions it would in France or Sweden. If you apply an EU average factor to a Cypriot bill, you understate your footprint.",
      "This guide explains which factor to use, where it comes from, and how to read an Electricity Authority of Cyprus (EAC) bill so the result holds up when someone checks it.",
    ],
    sections: [
      {
        heading: "What an emission factor is",
        body: [
          "An electricity emission factor is the average amount of greenhouse gas released for each kilowatt-hour delivered by a grid, written as kilograms of CO2 equivalent per kWh (kg CO2e/kWh). Multiply your kWh by the factor and you have your location-based Scope 2 emissions.",
          "The factor changes every year as the generation mix changes. A year with more solar output or less oil burning gives a lower factor. That is why every factor must carry its year (its vintage) and its source.",
        ],
      },
      {
        heading: "Which number to use for Cyprus",
        body: [
          "Recent official verified figures for the Cyprus grid sit at 0.622 kg CO2e per kWh. Vuneli uses 0.622 kg CO2e/kWh for the 2024 vintage, based on the official European Environment Agency (EEA) greenhouse gas intensity indicator and Cyprus's National Inventory Report. Every figure Vuneli calculates shows this source and year next to it.",
          "For comparison, the EU-wide average is well under half of that. Using a generic EU factor for a Cypriot site is the most common Scope 2 error we see in supplier questionnaires.",
          "If your auditor, bank or customer asks for a different official source, use theirs and record which one you used. What matters most is that the factor is published, dated and applied the same way every year.",
        ],
      },
      {
        heading: "Location-based and market-based Scope 2",
        body: [
          "The GHG Protocol asks companies to report Scope 2 two ways. Location-based uses the average grid factor described above. Market-based reflects what you chose to buy, such as a renewable supply contract backed by guarantees of origin.",
          "If you have no such contract, your market-based figure is normally calculated with the residual mix, which in Cyprus is close to the grid average. Rooftop solar you produce and use yourself is not bought from the grid at all, so it lowers both figures through lower kWh.",
          "VSME asks for Scope 2 emissions; banks and larger customers increasingly ask for both methods. Report the location-based figure first, then add market-based only when you hold the evidence behind it.",
        ],
      },
      {
        heading: "Reading an EAC bill",
        body: [
          "The figure you need is consumption in kWh for the billing period, not the amount in euros. Euros move with fuel prices and tariffs; kWh is what the factor applies to. Note the start and end dates of the period, because bills rarely line up with calendar months.",
          "Keep the account number with each bill so you can show which premises it covers, and check that you have every bill for the year. A missing period is the second most common gap after a wrong factor.",
          "Old or scanned bills can be hard to read automatically. When Vuneli cannot read a figure with confidence, it asks for a clearer copy or a photo instead of guessing.",
        ],
      },
      {
        heading: "A worked example",
        body: [
          "A Limassol office uses 18,400 kWh in a year across six bills. Location-based Scope 2 is 18,400 × 0.622 = 11,445 kg, or about 11.4 tonnes CO2e.",
          "If the same office installs rooftop solar that covers 6,000 kWh of its own use, grid consumption falls to 12,400 kWh and Scope 2 to about 7.7 tonnes. The reduction is real and easy to evidence: the bills show it.",
        ],
      },
    ],
    keyTakeaways: [
      "Cyprus has an isolated, mostly oil-fired grid, so its electricity factor is among the highest in the EU.",
      "Vuneli uses 0.622 kg CO2e/kWh (2024 vintage, EEA / Cyprus National Inventory) and shows the source next to every figure.",
      "Use kWh from the bill, never euros, and keep every billing period for the year.",
      "Report location-based Scope 2 first; add market-based only with contracts and guarantees of origin to back it.",
      "Rooftop solar lowers Scope 2 directly because it reduces the kWh you buy.",
    ],
    faq: [
      {
        q: "Can I use the EU average factor for my Cyprus office?",
        a: "You can, but it will understate your emissions considerably. A Cyprus-specific factor is more accurate and is what a careful reviewer will expect.",
      },
      {
        q: "Does Vuneli update the factor every year?",
        a: "Yes. When a newer published vintage is available, it replaces the old one for new periods. Past figures keep the factor they were calculated with, so your history does not change silently.",
      },
      {
        q: "Do I need the bills or is my annual total enough?",
        a: "An annual total works for a first estimate. For anything a bank or customer will rely on, keep the bills: they are the evidence.",
      },
      {
        q: "Can I forward my EAC bills instead of uploading them?",
        a: "Yes. Each Vuneli account has its own bill inbox address. Bills sent there are read the same way as uploads.",
      },
    ],
    ctaHeading: "Turn your EAC bills into a Scope 2 figure",
    ctaBody:
      "Upload or forward your electricity bills. Vuneli reads the kWh and period, applies the published Cyprus factor and keeps the source with every number.",
  },
  el: {
    title: "Ο συντελεστής εκπομπών ηλεκτρισμού στην Κύπρο: από τον λογαριασμό της ΑΗΚ στις εκπομπές Scope 2",
    metaTitle: "Συντελεστής εκπομπών ηλεκτρισμού Κύπρου: ΑΗΚ και Scope 2",
    metaDescription:
      "Γιατί ο ηλεκτρισμός στην Κύπρο έχει από τις υψηλότερες εντάσεις άνθρακα στην ΕΕ, ποιον συντελεστή να χρησιμοποιήσετε και πώς να μετατρέψετε τους λογαριασμούς της ΑΗΚ σε Scope 2.",
    heroEyebrow: "Οδηγός Κύπρου",
    heroSubtitle:
      "Για τις περισσότερες κυπριακές ΜμΕ, ο ηλεκτρισμός είναι η μεγαλύτερη γραμμή στο αποτύπωμα άνθρακα. Ο λογαριασμός της ΑΗΚ γράφει kWh· η τράπεζα ή ο πελάτης ζητά τόνους CO2e. Δείτε πώς γίνεται η μετατροπή.",
    tocLabel: "Σε αυτή τη σελίδα",
    introduction: [
      "Η Κύπρος λειτουργεί απομονωμένο ηλεκτρικό σύστημα. Δεν έχει ακόμη ηλεκτρική διασύνδεση με την ηπειρωτική Ευρώπη και το μεγαλύτερο μέρος της ενέργειας παράγεται ακόμη σε σταθμούς πετρελαίου στο Βασιλικό, στη Δεκέλεια και στο Μονί. Τα φωτοβολταϊκά αυξάνονται γρήγορα, όμως το σύστημα παραμένει από τα πιο εντατικά σε άνθρακα στην ΕΕ.",
      "Αυτό αφορά κάθε επιχείρηση που δηλώνει εκπομπές Scope 2, δηλαδή τις εκπομπές από τον ηλεκτρισμό που αγοράζει. Οι ίδιες 10.000 kWh σε ένα γραφείο στη Λευκωσία προκαλούν πολλαπλάσιες εκπομπές απ' ό,τι στη Γαλλία ή στη Σουηδία. Αν εφαρμόσετε μέσο όρο ΕΕ σε κυπριακό λογαριασμό, υποτιμάτε το αποτύπωμά σας.",
      "Ο οδηγός εξηγεί ποιον συντελεστή να χρησιμοποιήσετε, από πού προέρχεται και πώς να διαβάσετε έναν λογαριασμό της Αρχής Ηλεκτρισμού Κύπρου (ΑΗΚ) ώστε το αποτέλεσμα να στέκει σε έλεγχο.",
    ],
    sections: [
      {
        heading: "Τι είναι ο συντελεστής εκπομπών",
        body: [
          "Ο συντελεστής εκπομπών ηλεκτρισμού είναι η μέση ποσότητα αερίων θερμοκηπίου ανά κιλοβατώρα που παραδίδει το δίκτυο, σε κιλά CO2 ισοδύναμου ανά kWh (kg CO2e/kWh). Πολλαπλασιάζετε τις kWh σας με τον συντελεστή και έχετε τις εκπομπές Scope 2 με βάση την τοποθεσία.",
          "Ο συντελεστής αλλάζει κάθε χρόνο, καθώς αλλάζει το μείγμα παραγωγής. Γι' αυτό κάθε συντελεστής πρέπει να αναφέρει το έτος και την πηγή του.",
        ],
      },
      {
        heading: "Ποιον αριθμό να χρησιμοποιήσετε για την Κύπρο",
        body: [
          "Οι επίσημες επαληθευμένες εκτιμήσεις για το κυπριακό δίκτυο ανέρχονται σε 0,622 kg CO2e ανά kWh. Η Vuneli χρησιμοποιεί 0,622 kg CO2e/kWh για το έτος 2024, με βάση τον δείκτη έντασης αερίων θερμοκηπίου του Ευρωπαϊκού Οργανισμού Περιβάλλοντος (ΕΟΠ) και την Εθνική Έκθεση Απογραφής της Κύπρου. Κάθε αριθμός στη Vuneli δείχνει δίπλα την πηγή και το έτος.",
          "Ο μέσος όρος της ΕΕ είναι αρκετά κάτω από το μισό. Η χρήση γενικού συντελεστή ΕΕ για κυπριακή εγκατάσταση είναι το πιο συχνό λάθος Scope 2 που βλέπουμε σε ερωτηματολόγια προμηθευτών.",
          "Αν ο ελεγκτής, η τράπεζα ή ο πελάτης σας ζητά άλλη επίσημη πηγή, χρησιμοποιήστε τη δική τους και καταγράψτε ποια χρησιμοποιήσατε. Το σημαντικό είναι ο συντελεστής να είναι δημοσιευμένος, χρονολογημένος και να εφαρμόζεται με τον ίδιο τρόπο κάθε χρόνο.",
        ],
      },
      {
        heading: "Scope 2 με βάση την τοποθεσία και την αγορά",
        body: [
          "Το GHG Protocol ζητά δύο τρόπους υπολογισμού. Ο τρόπος με βάση την τοποθεσία χρησιμοποιεί τον μέσο συντελεστή του δικτύου. Ο τρόπος με βάση την αγορά αντανακλά τι επιλέξατε να αγοράσετε, π.χ. σύμβαση ανανεώσιμης ενέργειας με εγγυήσεις προέλευσης.",
          "Χωρίς τέτοια σύμβαση, ο υπολογισμός με βάση την αγορά γίνεται συνήθως με το υπολειπόμενο μείγμα, που στην Κύπρο είναι κοντά στον μέσο όρο του δικτύου. Η ηλιακή ενέργεια που παράγετε και καταναλώνετε μόνοι σας δεν αγοράζεται από το δίκτυο, άρα μειώνει και τους δύο αριθμούς.",
          "Το VSME ζητά εκπομπές Scope 2· οι τράπεζες και οι μεγαλύτεροι πελάτες ζητούν όλο και συχνότερα και τους δύο τρόπους. Δηλώστε πρώτα τον αριθμό με βάση την τοποθεσία και προσθέστε τον αριθμό με βάση την αγορά μόνο όταν έχετε τα αποδεικτικά.",
        ],
      },
      {
        heading: "Πώς διαβάζετε τον λογαριασμό της ΑΗΚ",
        body: [
          "Χρειάζεστε την κατανάλωση σε kWh για την περίοδο χρέωσης, όχι το ποσό σε ευρώ. Τα ευρώ αλλάζουν με τις τιμές καυσίμων και τα τιμολόγια· οι kWh είναι αυτό στο οποίο εφαρμόζεται ο συντελεστής. Σημειώστε τις ημερομηνίες έναρξης και λήξης, γιατί οι λογαριασμοί σπάνια συμπίπτουν με ημερολογιακούς μήνες.",
          "Κρατήστε τον αριθμό λογαριασμού με κάθε λογαριασμό για να φαίνεται ποιο υποστατικό καλύπτει, και ελέγξτε ότι έχετε όλους τους λογαριασμούς της χρονιάς. Μια περίοδος που λείπει είναι το δεύτερο πιο συχνό κενό μετά τον λάθος συντελεστή.",
          "Παλιοί ή σκαναρισμένοι λογαριασμοί δύσκολα διαβάζονται αυτόματα. Όταν η Vuneli δεν μπορεί να διαβάσει έναν αριθμό με βεβαιότητα, ζητά πιο καθαρό αντίγραφο ή φωτογραφία αντί να μαντέψει.",
        ],
      },
      {
        heading: "Ένα παράδειγμα",
        body: [
          "Ένα γραφείο στη Λεμεσό καταναλώνει 18.400 kWh τον χρόνο σε έξι λογαριασμούς. Οι εκπομπές Scope 2 με βάση την τοποθεσία είναι 18.400 × 0,622 = 11.445 kg, δηλαδή περίπου 11,4 τόνοι CO2e.",
          "Αν το ίδιο γραφείο εγκαταστήσει φωτοβολταϊκά στη στέγη που καλύπτουν 6.000 kWh της δικής του κατανάλωσης, η κατανάλωση από το δίκτυο πέφτει στις 12.400 kWh και οι εκπομπές Scope 2 σε περίπου 7,7 τόνους. Η μείωση είναι πραγματική και αποδεικνύεται εύκολα από τους λογαριασμούς.",
        ],
      },
    ],
    keyTakeaways: [
      "Η Κύπρος έχει απομονωμένο δίκτυο που βασίζεται κυρίως στο πετρέλαιο, γι' αυτό ο συντελεστής της είναι από τους υψηλότερους στην ΕΕ.",
      "Η Vuneli χρησιμοποιεί 0,622 kg CO2e/kWh (έτος 2024, ΕΟΠ / Εθνική Απογραφή Κύπρου) και δείχνει την πηγή δίπλα σε κάθε αριθμό.",
      "Χρησιμοποιήστε kWh από τον λογαριασμό, ποτέ ευρώ, και κρατήστε όλες τις περιόδους της χρονιάς.",
      "Δηλώστε πρώτα Scope 2 με βάση την τοποθεσία· προσθέστε τον τρόπο με βάση την αγορά μόνο με συμβάσεις και εγγυήσεις προέλευσης.",
      "Τα φωτοβολταϊκά στη στέγη μειώνουν απευθείας το Scope 2, γιατί μειώνουν τις kWh που αγοράζετε.",
    ],
    faq: [
      {
        q: "Μπορώ να χρησιμοποιήσω τον μέσο συντελεστή ΕΕ για το γραφείο μου στην Κύπρο;",
        a: "Μπορείτε, αλλά θα υποτιμήσετε σημαντικά τις εκπομπές σας. Ο κυπριακός συντελεστής είναι ακριβέστερος και αυτόν περιμένει ένας προσεκτικός ελεγκτής.",
      },
      {
        q: "Ενημερώνει η Vuneli τον συντελεστή κάθε χρόνο;",
        a: "Ναι. Όταν δημοσιεύεται νεότερο έτος, αντικαθιστά το παλιό για τις νέες περιόδους. Οι παλαιότεροι αριθμοί κρατούν τον συντελεστή με τον οποίο υπολογίστηκαν, ώστε το ιστορικό σας να μην αλλάζει αθόρυβα.",
      },
      {
        q: "Χρειάζομαι τους λογαριασμούς ή αρκεί το ετήσιο σύνολο;",
        a: "Το ετήσιο σύνολο αρκεί για μια πρώτη εκτίμηση. Για ό,τι θα βασιστεί μια τράπεζα ή ένας πελάτης, κρατήστε τους λογαριασμούς: είναι τα αποδεικτικά.",
      },
      {
        q: "Μπορώ να προωθώ τους λογαριασμούς της ΑΗΚ αντί να τους ανεβάζω;",
        a: "Ναι. Κάθε λογαριασμός Vuneli έχει δική του διεύθυνση για λογαριασμούς. Ό,τι στέλνετε εκεί διαβάζεται όπως και τα αρχεία που ανεβάζετε.",
      },
    ],
    ctaHeading: "Μετατρέψτε τους λογαριασμούς της ΑΗΚ σε αριθμό Scope 2",
    ctaBody:
      "Ανεβάστε ή προωθήστε τους λογαριασμούς ηλεκτρισμού. Η Vuneli διαβάζει τις kWh και την περίοδο, εφαρμόζει τον δημοσιευμένο κυπριακό συντελεστή και κρατά την πηγή κάθε αριθμού.",
  },
});
