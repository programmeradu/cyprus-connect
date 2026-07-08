import { makePillar } from "./_factory";

export const cbamExplained = makePillar({
  slug: "cbam-explained",
  category: "cbam",
  primaryKeyword: "CBAM",
  monthlyVolume: 3600,
  readingMinutes: 11,
  relatedSlugs: ["csrd-reporting-guide","cbam-cyprus","sustainability-reporting-eu","scope-1-2-3-emissions"],
  en: {
  "title": "CBAM Explained: The EU Carbon Border Adjustment Mechanism in Practice",
  "metaTitle": "CBAM Explained 2026 — Reporting, Certificates, Timeline",
  "metaDescription": "How CBAM works: covered goods, reporting during the transitional phase, certificate purchase from 2026, and what importers must do now.",
  "heroEyebrow": "Regulatory Guide",
  "heroSubtitle": "The Carbon Border Adjustment Mechanism prices the carbon embedded in imports of steel, cement, aluminium, fertilisers, electricity and hydrogen — starting with reporting today and financial obligations from 2026.",
  "tocLabel": "On this page",
  "introduction": [
    "CBAM is the EU's tool to prevent 'carbon leakage' — the phenomenon of production shifting to jurisdictions with weaker climate rules. It puts a carbon price on imports of the most emission-intensive goods, matching what EU producers pay under the ETS.",
    "The transitional phase runs from October 2023 to end-2025 with reporting-only obligations. From 1 January 2026, importers must buy and surrender CBAM certificates covering the embedded emissions of imported goods.",
    "This guide walks through what's covered, who is responsible, how emissions are calculated, and the practical steps EU importers should take now."
  ],
  "sections": [
    {
      "heading": "Covered goods and scope",
      "body": [
        "Six sectors: cement, iron & steel, aluminium, fertilisers, electricity, and hydrogen. Downstream products containing these materials (screws, tubes, structural sections, etc.) are included via specific CN codes.",
        "The obligation falls on the EU importer of record. Non-EU producers are not directly regulated but must supply verified emissions data if they want their goods to remain competitive after 2026."
      ]
    },
    {
      "heading": "Emissions calculation methodology",
      "body": [
        "Actual emissions are preferred: direct emissions from the production process, indirect (electricity) emissions where relevant, and precursor material emissions embedded upstream. Default values are available during transition but from mid-2026 they carry a penalty premium — using verified actuals will be cheaper.",
        "Verification must come from an accredited third party using the EU CBAM methodology; national verification schemes are being harmonized."
      ]
    },
    {
      "heading": "The 2026 certificate mechanism",
      "body": [
        "Importers register as authorised CBAM declarants, submit an annual CBAM declaration by 31 May of the following year, and surrender certificates equal to embedded emissions × (ETS price − any effective carbon price already paid in the country of origin).",
        "Certificates are sold at the weekly average ETS auction price. Free allocation to EU producers phases out in parallel with CBAM phase-in through 2034."
      ]
    }
  ],
  "keyTakeaways": [
    "CBAM applies today (reporting) and financially from 1 January 2026.",
    "Six sectors covered; obligation on the EU importer of record.",
    "Verified actual emissions beat default values on cost.",
    "Certificate cost tracks the ETS price — factor it into 2026 procurement contracts."
  ],
  "faq": [
    {
      "q": "Who reports CBAM?",
      "a": "The EU importer of record. Non-EU producers can register in the CBAM Registry to make it easier for their customers."
    },
    {
      "q": "What's the deadline for the annual declaration?",
      "a": "31 May of the year following the import (first full declaration: 31 May 2027 for 2026 imports)."
    },
    {
      "q": "Can I use default emission values?",
      "a": "During the transitional phase, yes. From mid-2026 defaults will carry a penalty; verified actuals are cheaper."
    },
    {
      "q": "Does CBAM affect exports from the EU?",
      "a": "No, CBAM applies to imports only. There is ongoing debate about export rebates but nothing enacted."
    }
  ],
  "ctaHeading": "Automate CBAM emissions collection from your suppliers",
  "ctaBody": "VerdeIQ collects verified embedded-emissions data directly from your non-EU suppliers and generates the CBAM declaration your customs broker needs."
},
  el: {
  "title": "Ο Μηχανισμός CBAM: Πρακτικός Οδηγός για τον Ευρωπαϊκό Συνοριακό Ρύθμιση Άνθρακα",
  "metaTitle": "CBAM 2026 — Αναφορές, Πιστοποιητικά, Χρονοδιάγραμμα",
  "metaDescription": "Πώς λειτουργεί το CBAM: καλυπτόμενα αγαθά, αναφορές μεταβατικής φάσης, αγορά πιστοποιητικών από 2026, τι πρέπει να κάνουν οι εισαγωγείς σήμερα.",
  "heroEyebrow": "Ρυθμιστικός Οδηγός",
  "heroSubtitle": "Το CBAM τιμολογεί τον άνθρακα ενσωματωμένο σε εισαγωγές χάλυβα, τσιμέντου, αλουμινίου, λιπασμάτων, ηλεκτρικής ενέργειας και υδρογόνου.",
  "tocLabel": "Σε αυτή τη σελίδα",
  "introduction": [
    "Το CBAM είναι το εργαλείο της ΕΕ κατά της 'διαρροής άνθρακα'. Επιβάλλει τιμή άνθρακα σε εισαγωγές των πιο εντατικών αγαθών.",
    "Η μεταβατική φάση διαρκεί από Οκτ 2023 έως τέλος 2025 με υποχρεώσεις αναφοράς. Από 1 Ιαν 2026, οι εισαγωγείς αγοράζουν πιστοποιητικά CBAM.",
    "Αυτός ο οδηγός καλύπτει τι εμπίπτει, ποιος ευθύνεται, πώς υπολογίζονται οι εκπομπές και ποια βήματα να κάνετε τώρα."
  ],
  "sections": [
    {
      "heading": "Καλυπτόμενα αγαθά",
      "body": [
        "Έξι τομείς: τσιμέντο, σίδηρος & χάλυβας, αλουμίνιο, λιπάσματα, ηλεκτρική ενέργεια, υδρογόνο. Downstream προϊόντα μέσω CN κωδικών.",
        "Η υποχρέωση βαρύνει τον εισαγωγέα-εγγραφή στην ΕΕ."
      ]
    },
    {
      "heading": "Μεθοδολογία εκπομπών",
      "body": [
        "Προτιμώνται πραγματικές εκπομπές: άμεσες από παραγωγή, έμμεσες (ηλεκτρική), και υλικών-πρόδρομων. Οι default τιμές θα φέρουν premium από μέσα 2026.",
        "Η επαλήθευση από διαπιστευμένο τρίτο φορέα."
      ]
    },
    {
      "heading": "Ο μηχανισμός πιστοποιητικών 2026",
      "body": [
        "Οι εισαγωγείς εγγράφονται ως εγκεκριμένοι δηλούντες, υποβάλλουν ετήσια δήλωση CBAM έως 31 Μαΐου, και παραδίδουν πιστοποιητικά ίσα με τις ενσωματωμένες εκπομπές × (τιμή ETS − τυχόν καταβληθείσα τιμή άνθρακα στη χώρα προέλευσης)."
      ]
    }
  ],
  "keyTakeaways": [
    "Το CBAM εφαρμόζεται σήμερα (αναφορές) και οικονομικά από 1 Ιαν 2026.",
    "Έξι τομείς, υποχρέωση στον εισαγωγέα.",
    "Οι πραγματικές εκπομπές είναι φθηνότερες από τις default.",
    "Το κόστος πιστοποιητικού ακολουθεί την τιμή ETS."
  ],
  "faq": [
    {
      "q": "Ποιος αναφέρει CBAM;",
      "a": "Ο εισαγωγέας-εγγραφή στην ΕΕ."
    },
    {
      "q": "Πότε είναι η προθεσμία;",
      "a": "31 Μαΐου του επόμενου έτους."
    },
    {
      "q": "Μπορώ να χρησιμοποιήσω default τιμές;",
      "a": "Στη μεταβατική φάση, ναι. Από μέσα 2026 θα φέρουν premium."
    },
    {
      "q": "Επηρεάζει τις εξαγωγές από την ΕΕ;",
      "a": "Όχι, μόνο τις εισαγωγές."
    }
  ],
  "ctaHeading": "Αυτοματοποιήστε τη συλλογή εκπομπών CBAM",
  "ctaBody": "Η VerdeIQ συλλέγει επαληθευμένα δεδομένα από τους μη-ΕΕ προμηθευτές σας και παράγει τη δήλωση CBAM."
},
});
