// App-owned trust content for VerdeIQ. Maintained by the app owner (Verde IQ,
// Strovolos, Cyprus). Not independent legal advice — legal review recommended
// before commercial launch.

import type { Locale } from "@/i18n/routing";

export type TrustPageKey = "privacy" | "terms" | "security" | "dpa";

export type TrustSection = {
  heading: string;
  body: string[]; // paragraphs
  list?: string[]; // optional bullet list appended after body
};

export type TrustPageContent = {
  eyebrow: string;
  title: string;
  intro: string;
  lastUpdated: string; // human-readable
  ownerNote: string;
  sections: TrustSection[];
};

const LAST_UPDATED_EN = "8 July 2026";
const LAST_UPDATED_EL = "8 Ιουλίου 2026";

const OWNER_EN =
  "This page is maintained by Verde IQ (operated from Strovolos, Cyprus) to answer common privacy, security, and compliance questions about VerdeIQ. Contact: samuel@stauniverse.tech.";
const OWNER_EL =
  "Η σελίδα αυτή συντηρείται από τη Verde IQ (με έδρα λειτουργίας τον Στρόβολο, Κύπρος) και απαντά σε συνήθεις ερωτήσεις για την ιδιωτικότητα, την ασφάλεια και τη συμμόρφωση του VerdeIQ. Επικοινωνία: samuel@stauniverse.tech.";

const CONTENT: Record<Locale, Record<TrustPageKey, TrustPageContent>> = {
  en: {
    privacy: {
      eyebrow: "Legal",
      title: "Privacy Policy",
      intro:
        "This Privacy Policy explains what personal data VerdeIQ collects, why we collect it, and the rights you have under the EU General Data Protection Regulation (GDPR) and the Cyprus Data Protection Law (Law 125(I)/2018).",
      lastUpdated: LAST_UPDATED_EN,
      ownerNote: OWNER_EN,
      sections: [
        {
          heading: "Data controller",
          body: [
            "Verde IQ, operating from Strovolos, Cyprus, is the data controller for personal data processed through the VerdeIQ platform. For any privacy question, request, or complaint, contact samuel@stauniverse.tech.",
          ],
        },
        {
          heading: "What we collect",
          body: [
            "We collect only the data needed to operate the service:",
          ],
          list: [
            "Account data: name, email, hashed password or OAuth identifier, preferred language and currency.",
            "Billing data: subscription plan, payment status and invoice metadata (card details are handled by Stripe / Paystack — VerdeIQ never sees full card numbers).",
            "Sustainability data you enter: emissions inputs, uploaded documents, energy usage, benchmarks, and generated reports.",
            "Product telemetry: pages viewed, errors, feature usage — used to improve reliability. No advertising trackers.",
          ],
        },
        {
          heading: "Legal bases (GDPR Art. 6)",
          body: [
            "We rely on: (a) contract performance to deliver the service you sign up for; (b) legitimate interest to keep the service secure and prevent abuse; (c) legal obligation for tax and accounting records; and (d) consent for optional cookies and email marketing, which you can withdraw at any time.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "Under GDPR you may request access, rectification, erasure, restriction, portability, and objection. To exercise these rights, email samuel@stauniverse.tech — we respond within 30 days.",
            "You may also lodge a complaint with the Cyprus Commissioner for Personal Data Protection (dataprotection.gov.cy).",
          ],
        },
        {
          heading: "International transfers",
          body: [
            "Personal data is processed in the EU / EEA where possible. When a sub-processor operates outside the EEA, transfers rely on the European Commission's Standard Contractual Clauses (SCCs).",
          ],
        },
        {
          heading: "Retention",
          body: [
            "Account data is kept while your account is active and for 12 months after deletion in encrypted backups. Invoices are retained for 7 years to meet Cyprus tax law. You may request earlier erasure of non-mandatory data.",
          ],
        },
        {
          heading: "Cookies",
          body: [
            "VerdeIQ uses strictly-necessary cookies for authentication and language preference (no consent required under ePrivacy) and optional analytics cookies only after you accept the cookie banner. You can change your choice at any time from the footer.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "Questions or requests: samuel@stauniverse.tech. Security disclosures may be sent to the same address.",
          ],
        },
      ],
    },
    terms: {
      eyebrow: "Legal",
      title: "Terms of Service",
      intro:
        "These Terms govern your use of VerdeIQ. By creating an account you agree to them. Cyprus law applies and the courts of Nicosia have exclusive jurisdiction, without prejudice to consumer rights under EU law.",
      lastUpdated: LAST_UPDATED_EN,
      ownerNote: OWNER_EN,
      sections: [
        {
          heading: "The service",
          body: [
            "VerdeIQ is an AI-assisted sustainability platform for SMEs. Outputs (emissions estimates, reports, benchmarks) are informational and do not constitute regulatory, legal, or audit-grade assurance. You are responsible for verifying figures before submitting them to authorities.",
          ],
        },
        {
          heading: "Accounts and eligibility",
          body: [
            "You must be at least 18 and authorized to bind your organization. Keep your credentials confidential. You are responsible for all activity under your account.",
          ],
        },
        {
          heading: "Subscriptions and billing",
          body: [
            "Paid plans are billed in EUR via Stripe (or Paystack for non-EU customers). Prices for Cyprus customers include 19% VAT calculated by Stripe Tax from your billing address. Subscriptions renew automatically until cancelled from the billing portal.",
            "You may cancel at any time; access continues until the end of the paid period. Refunds are handled per EU consumer law and Cyprus consumer protection rules.",
          ],
        },
        {
          heading: "Acceptable use",
          body: [
            "Do not: (a) reverse-engineer the service; (b) submit unlawful content; (c) attempt to bypass rate limits, authentication, or tenancy isolation; (d) use the AI features to generate misleading regulatory disclosures.",
          ],
        },
        {
          heading: "Intellectual property",
          body: [
            "You own the data you upload. You grant Verde IQ a limited licence to process it solely to deliver the service. VerdeIQ software, branding, and generated benchmarks are owned by Verde IQ.",
          ],
        },
        {
          heading: "Liability",
          body: [
            "To the maximum extent permitted by law, Verde IQ's aggregate liability for any claim is capped at the fees paid in the 12 months preceding the claim. Nothing in these Terms limits liability that cannot be limited under Cyprus or EU law.",
          ],
        },
        {
          heading: "Changes",
          body: [
            "We may update these Terms; material changes will be notified at least 30 days in advance by email or in-app notice. Continued use after the effective date constitutes acceptance.",
          ],
        },
        {
          heading: "Contact",
          body: ["Legal / commercial: samuel@stauniverse.tech."],
        },
      ],
    },
    security: {
      eyebrow: "Trust",
      title: "Security & Platform",
      intro:
        "This page describes the security controls currently enabled in VerdeIQ and the shared responsibility between Verde IQ (app owner), the underlying Lovable Cloud platform, and you (customer). This is not a certification.",
      lastUpdated: LAST_UPDATED_EN,
      ownerNote: OWNER_EN,
      sections: [
        {
          heading: "Hosting and platform",
          body: [
            "VerdeIQ runs on Lovable Cloud, which provides managed PostgreSQL, authentication, storage, and serverless functions. Traffic is served over HTTPS with TLS terminated at the edge. Data is stored in EU regions where offered by the underlying provider.",
          ],
        },
        {
          heading: "Authentication and access",
          body: [
            "Accounts use email + password with bcrypt-hashed credentials, or OAuth (Google, Apple) when enabled. Session tokens are issued as short-lived bearer tokens. Roles are stored in a dedicated user_roles table and checked server-side; admin actions require an explicit role grant.",
          ],
        },
        {
          heading: "Data isolation",
          body: [
            "Every user-facing table has PostgreSQL Row-Level Security enabled with policies scoped to auth.uid(). Sub-processors do not have direct read access to customer data outside their processing purpose.",
          ],
        },
        {
          heading: "Payments",
          body: [
            "Card data never touches VerdeIQ servers — it is handled by Stripe (PCI-DSS Level 1) or Paystack. Webhooks are HMAC-verified before any state change.",
          ],
        },
        {
          heading: "Backups and availability",
          body: [
            "The database is backed up daily by the platform provider with point-in-time recovery. We do not currently publish an availability SLA; contact us for enterprise commitments.",
          ],
        },
        {
          heading: "Sub-processors",
          body: [
            "Current sub-processors:",
          ],
          list: [
            "Lovable Cloud — hosting, database, authentication, storage (EU where available).",
            "Stripe Payments Europe, Ltd. — card processing and tax calculation for EU/EEA customers.",
            "Paystack Payments Limited — card processing for non-EU customers.",
            "Resend — transactional email delivery.",
            "Lovable AI Gateway — AI inference for insights and document parsing.",
          ],
        },
        {
          heading: "Reporting a vulnerability",
          body: [
            "Please email samuel@stauniverse.tech with a description and reproduction steps. We aim to acknowledge within 3 business days. Please do not run automated scans against production or access data that is not your own.",
          ],
        },
        {
          heading: "Shared responsibility",
          body: [
            "Verde IQ maintains application code, access controls, and vendor selection. Lovable Cloud maintains platform-level security. You are responsible for account credential hygiene, choosing who has access inside your organization, and the accuracy of the data you upload.",
          ],
        },
      ],
    },
    dpa: {
      eyebrow: "Legal",
      title: "Data Processing Agreement",
      intro:
        "This page summarises the Data Processing Agreement (DPA) between Verde IQ (processor) and you (controller) for personal data processed through VerdeIQ. A signed copy is available on request for customers who need one for their own GDPR records.",
      lastUpdated: LAST_UPDATED_EN,
      ownerNote: OWNER_EN,
      sections: [
        {
          heading: "Roles",
          body: [
            "For personal data you enter into VerdeIQ about your employees, suppliers, or customers, you act as the controller and Verde IQ acts as the processor under GDPR Art. 28. For account data (name, email, billing), Verde IQ is an independent controller as described in the Privacy Policy.",
          ],
        },
        {
          heading: "Scope and purpose",
          body: [
            "Verde IQ processes personal data solely to (a) provide the VerdeIQ service, (b) prevent abuse and secure the platform, and (c) meet legal obligations. Data is not sold, rented, or used for advertising.",
          ],
        },
        {
          heading: "Sub-processors",
          body: [
            "The current list is published on the Security page. We will notify you by email or in-app notice of any additions with a 30-day objection window.",
          ],
        },
        {
          heading: "Security measures",
          body: [
            "Encryption in transit (TLS 1.2+), encryption at rest for database and backups (managed by the platform), Row-Level Security policies, role-based admin access, HMAC-verified webhooks, and least-privilege service accounts.",
          ],
        },
        {
          heading: "International transfers",
          body: [
            "Where a sub-processor operates outside the EEA, transfers rely on the European Commission's Standard Contractual Clauses (SCCs, 2021/914).",
          ],
        },
        {
          heading: "Data subject requests",
          body: [
            "When we receive a data subject request that concerns your controller data, we forward it to you and support you in responding within GDPR timelines.",
          ],
        },
        {
          heading: "Breach notification",
          body: [
            "In the event of a personal data breach affecting your data, Verde IQ will notify you without undue delay and, in any case, within 72 hours of becoming aware, with the information required by GDPR Art. 33(3).",
          ],
        },
        {
          heading: "Return and deletion",
          body: [
            "On termination, controller data is deleted from live systems within 30 days and from backups within 12 months, unless retention is required by law. A structured export can be requested before termination.",
          ],
        },
        {
          heading: "Requesting a signed DPA",
          body: [
            "Email samuel@stauniverse.tech with your legal entity name and address. We will return a signed counterpart within 5 business days.",
          ],
        },
      ],
    },
  },
  el: {
    privacy: {
      eyebrow: "Νομικά",
      title: "Πολιτική Απορρήτου",
      intro:
        "Η παρούσα Πολιτική Απορρήτου εξηγεί ποια προσωπικά δεδομένα συλλέγει το VerdeIQ, γιατί τα συλλέγουμε και τα δικαιώματά σας βάσει του Γενικού Κανονισμού Προστασίας Δεδομένων (GDPR) και του Κυπριακού Νόμου 125(Ι)/2018.",
      lastUpdated: LAST_UPDATED_EL,
      ownerNote: OWNER_EL,
      sections: [
        {
          heading: "Υπεύθυνος επεξεργασίας",
          body: [
            "Η Verde IQ, με έδρα λειτουργίας τον Στρόβολο Κύπρου, είναι ο υπεύθυνος επεξεργασίας για τα προσωπικά δεδομένα που επεξεργάζονται μέσω της πλατφόρμας VerdeIQ. Για κάθε ερώτημα, αίτημα ή παράπονο επικοινωνήστε στο samuel@stauniverse.tech.",
          ],
        },
        {
          heading: "Τι συλλέγουμε",
          body: ["Συλλέγουμε μόνο τα δεδομένα που είναι απαραίτητα για τη λειτουργία της υπηρεσίας:"],
          list: [
            "Δεδομένα λογαριασμού: όνομα, email, κρυπτογραφημένος κωδικός ή αναγνωριστικό OAuth, γλώσσα και νόμισμα προτίμησης.",
            "Δεδομένα χρέωσης: πλάνο συνδρομής, κατάσταση πληρωμών και μεταδεδομένα τιμολογίων (τα στοιχεία κάρτας τα χειρίζονται αποκλειστικά η Stripe / Paystack — το VerdeIQ δεν βλέπει ποτέ πλήρεις αριθμούς καρτών).",
            "Δεδομένα βιωσιμότητας που καταχωρείτε: υπολογισμοί εκπομπών, φορτωμένα έγγραφα, κατανάλωση ενέργειας, benchmarks και παραγόμενες αναφορές.",
            "Τηλεμετρία προϊόντος: προβολές σελίδων, σφάλματα, χρήση λειτουργιών — για βελτίωση αξιοπιστίας. Χωρίς διαφημιστικά cookies.",
          ],
        },
        {
          heading: "Νομική βάση (Άρθρο 6 GDPR)",
          body: [
            "Βασιζόμαστε σε: (α) εκτέλεση σύμβασης για την παροχή της υπηρεσίας· (β) έννομο συμφέρον για ασφάλεια και πρόληψη κατάχρησης· (γ) νομική υποχρέωση για φορολογικά και λογιστικά αρχεία· και (δ) συγκατάθεση για προαιρετικά cookies και email marketing, την οποία μπορείτε να ανακαλέσετε ανά πάσα στιγμή.",
          ],
        },
        {
          heading: "Τα δικαιώματά σας",
          body: [
            "Βάσει του GDPR έχετε δικαίωμα πρόσβασης, διόρθωσης, διαγραφής, περιορισμού, φορητότητας και εναντίωσης. Για να ασκήσετε αυτά τα δικαιώματα, στείλτε email στο samuel@stauniverse.tech — απαντάμε εντός 30 ημερών.",
            "Έχετε επίσης δικαίωμα καταγγελίας στην Επίτροπο Προστασίας Δεδομένων Προσωπικού Χαρακτήρα Κύπρου (dataprotection.gov.cy).",
          ],
        },
        {
          heading: "Διεθνείς διαβιβάσεις",
          body: [
            "Τα δεδομένα επεξεργάζονται εντός ΕΕ/ΕΟΧ όπου είναι εφικτό. Όταν υπεργολάβος λειτουργεί εκτός ΕΟΧ, οι διαβιβάσεις βασίζονται στις Τυποποιημένες Συμβατικές Ρήτρες (SCCs) της Ευρωπαϊκής Επιτροπής.",
          ],
        },
        {
          heading: "Διατήρηση",
          body: [
            "Τα δεδομένα λογαριασμού διατηρούνται όσο ο λογαριασμός σας είναι ενεργός και για 12 μήνες σε κρυπτογραφημένα αντίγραφα ασφαλείας μετά τη διαγραφή. Τα τιμολόγια διατηρούνται για 7 έτη βάσει κυπριακής φορολογικής νομοθεσίας. Μπορείτε να ζητήσετε νωρίτερη διαγραφή μη υποχρεωτικών δεδομένων.",
          ],
        },
        {
          heading: "Cookies",
          body: [
            "Το VerdeIQ χρησιμοποιεί απολύτως αναγκαία cookies για ταυτοποίηση και γλώσσα (χωρίς συγκατάθεση, βάσει ePrivacy) και προαιρετικά analytics cookies μόνο μετά την αποδοχή του banner. Μπορείτε να αλλάξετε την επιλογή σας ανά πάσα στιγμή από το footer.",
          ],
        },
        {
          heading: "Επικοινωνία",
          body: [
            "Ερωτήσεις ή αιτήματα: samuel@stauniverse.tech. Αναφορές ασφάλειας μπορούν να αποσταλούν στην ίδια διεύθυνση.",
          ],
        },
      ],
    },
    terms: {
      eyebrow: "Νομικά",
      title: "Όροι Χρήσης",
      intro:
        "Οι παρόντες Όροι διέπουν τη χρήση του VerdeIQ. Δημιουργώντας λογαριασμό συμφωνείτε με αυτούς. Εφαρμόζεται το κυπριακό δίκαιο και αποκλειστική δικαιοδοσία έχουν τα δικαστήρια Λευκωσίας, με την επιφύλαξη των καταναλωτικών δικαιωμάτων βάσει του ενωσιακού δικαίου.",
      lastUpdated: LAST_UPDATED_EL,
      ownerNote: OWNER_EL,
      sections: [
        {
          heading: "Η υπηρεσία",
          body: [
            "Το VerdeIQ είναι μια πλατφόρμα βιωσιμότητας με υποστήριξη AI για ΜμΕ. Τα αποτελέσματα (εκτιμήσεις εκπομπών, αναφορές, benchmarks) είναι πληροφοριακά και δεν αποτελούν κανονιστική, νομική ή ελεγκτική βεβαίωση. Είστε υπεύθυνοι για την επαλήθευση των στοιχείων πριν την υποβολή τους σε αρχές.",
          ],
        },
        {
          heading: "Λογαριασμοί και επιλεξιμότητα",
          body: [
            "Πρέπει να είστε τουλάχιστον 18 ετών και εξουσιοδοτημένοι να δεσμεύσετε τον οργανισμό σας. Κρατήστε εμπιστευτικά τα διαπιστευτήρια σας. Είστε υπεύθυνοι για κάθε δραστηριότητα στον λογαριασμό σας.",
          ],
        },
        {
          heading: "Συνδρομές και χρέωση",
          body: [
            "Οι πληρωμένες συνδρομές χρεώνονται σε EUR μέσω Stripe (ή Paystack για πελάτες εκτός ΕΕ). Οι τιμές για πελάτες Κύπρου περιλαμβάνουν ΦΠΑ 19% υπολογισμένο από το Stripe Tax βάσει της διεύθυνσης χρέωσης. Οι συνδρομές ανανεώνονται αυτόματα μέχρι την ακύρωση από το billing portal.",
            "Μπορείτε να ακυρώσετε οποτεδήποτε· η πρόσβαση συνεχίζεται μέχρι το τέλος της πληρωμένης περιόδου. Οι επιστροφές διέπονται από το ενωσιακό δίκαιο καταναλωτή και τους κυπριακούς κανόνες προστασίας καταναλωτή.",
          ],
        },
        {
          heading: "Αποδεκτή χρήση",
          body: [
            "Απαγορεύεται: (α) η αντίστροφη μηχανική· (β) η υποβολή παράνομου περιεχομένου· (γ) η παράκαμψη ορίων χρήσης, ταυτοποίησης ή απομόνωσης μισθωτών· (δ) η χρήση των AI λειτουργιών για παραπλανητικές κανονιστικές δημοσιεύσεις.",
          ],
        },
        {
          heading: "Πνευματική ιδιοκτησία",
          body: [
            "Παραμένετε ιδιοκτήτης των δεδομένων που φορτώνετε. Παρέχετε στη Verde IQ περιορισμένη άδεια επεξεργασίας τους αποκλειστικά για την παροχή της υπηρεσίας. Το λογισμικό, το branding και τα benchmarks του VerdeIQ ανήκουν στη Verde IQ.",
          ],
        },
        {
          heading: "Ευθύνη",
          body: [
            "Στον μέγιστο βαθμό που επιτρέπει ο νόμος, η συνολική ευθύνη της Verde IQ για οποιαδήποτε αξίωση περιορίζεται στα ποσά που καταβλήθηκαν κατά τους 12 μήνες πριν την αξίωση. Καμία διάταξη δεν περιορίζει ευθύνη που δεν μπορεί να περιοριστεί κατά το κυπριακό ή ενωσιακό δίκαιο.",
          ],
        },
        {
          heading: "Αλλαγές",
          body: [
            "Μπορούμε να επικαιροποιήσουμε τους Όρους· ουσιώδεις αλλαγές γνωστοποιούνται τουλάχιστον 30 ημέρες πριν με email ή ειδοποίηση εντός εφαρμογής. Η συνέχιση της χρήσης μετά την ημερομηνία ισχύος συνιστά αποδοχή.",
          ],
        },
        {
          heading: "Επικοινωνία",
          body: ["Νομικά / εμπορικά: samuel@stauniverse.tech."],
        },
      ],
    },
    security: {
      eyebrow: "Εμπιστοσύνη",
      title: "Ασφάλεια & Πλατφόρμα",
      intro:
        "Η σελίδα αυτή περιγράφει τους ενεργοποιημένους ελέγχους ασφάλειας στο VerdeIQ και την κοινή ευθύνη μεταξύ Verde IQ (κάτοχος εφαρμογής), της υποκείμενης πλατφόρμας Lovable Cloud και εσάς (πελάτης). Δεν αποτελεί πιστοποίηση.",
      lastUpdated: LAST_UPDATED_EL,
      ownerNote: OWNER_EL,
      sections: [
        {
          heading: "Φιλοξενία και πλατφόρμα",
          body: [
            "Το VerdeIQ εκτελείται στο Lovable Cloud, το οποίο παρέχει διαχειριζόμενη PostgreSQL, ταυτοποίηση, αποθήκευση και serverless λειτουργίες. Η κίνηση εξυπηρετείται μέσω HTTPS με TLS. Τα δεδομένα αποθηκεύονται σε περιοχές ΕΕ όπου προσφέρεται από τον πάροχο.",
          ],
        },
        {
          heading: "Ταυτοποίηση και πρόσβαση",
          body: [
            "Οι λογαριασμοί χρησιμοποιούν email + κωδικό με bcrypt hashing ή OAuth (Google, Apple) όπου είναι ενεργοποιημένο. Τα session tokens είναι βραχύβια bearer tokens. Οι ρόλοι αποθηκεύονται σε ξεχωριστό πίνακα user_roles και ελέγχονται server-side· οι διαχειριστικές ενέργειες απαιτούν ρητή εκχώρηση ρόλου.",
          ],
        },
        {
          heading: "Απομόνωση δεδομένων",
          body: [
            "Κάθε πίνακας δεδομένων χρήστη έχει ενεργοποιημένο PostgreSQL Row-Level Security με πολιτικές που περιορίζονται στο auth.uid(). Οι υπεργολάβοι δεν έχουν άμεση πρόσβαση σε δεδομένα πελατών εκτός του σκοπού επεξεργασίας τους.",
          ],
        },
        {
          heading: "Πληρωμές",
          body: [
            "Τα στοιχεία κάρτας δεν φθάνουν ποτέ στους διακομιστές του VerdeIQ — χειρίζονται από τη Stripe (PCI-DSS Level 1) ή την Paystack. Τα webhooks επαληθεύονται με HMAC πριν από οποιαδήποτε αλλαγή κατάστασης.",
          ],
        },
        {
          heading: "Αντίγραφα ασφαλείας και διαθεσιμότητα",
          body: [
            "Η βάση δεδομένων λαμβάνει καθημερινά αντίγραφα από τον πάροχο πλατφόρμας με point-in-time recovery. Δεν δημοσιεύουμε επί του παρόντος SLA διαθεσιμότητας· επικοινωνήστε μαζί μας για εταιρικές δεσμεύσεις.",
          ],
        },
        {
          heading: "Υπεργολάβοι",
          body: ["Τρέχοντες υπεργολάβοι:"],
          list: [
            "Lovable Cloud — φιλοξενία, βάση, ταυτοποίηση, αποθήκευση (ΕΕ όπου διαθέσιμο).",
            "Stripe Payments Europe, Ltd. — επεξεργασία καρτών και φόρου για πελάτες ΕΕ/ΕΟΧ.",
            "Paystack Payments Limited — επεξεργασία καρτών για πελάτες εκτός ΕΕ.",
            "Resend — παράδοση transactional email.",
            "Lovable AI Gateway — AI inference για insights και ανάλυση εγγράφων.",
          ],
        },
        {
          heading: "Αναφορά ευπάθειας",
          body: [
            "Στείλτε email στο samuel@stauniverse.tech με περιγραφή και βήματα αναπαραγωγής. Στόχος μας είναι απάντηση εντός 3 εργάσιμων ημερών. Παρακαλούμε μην εκτελείτε αυτοματοποιημένα scans σε παραγωγή ούτε να αποκτάτε πρόσβαση σε δεδομένα που δεν σας ανήκουν.",
          ],
        },
        {
          heading: "Κοινή ευθύνη",
          body: [
            "Η Verde IQ διατηρεί τον κώδικα, τους ελέγχους πρόσβασης και την επιλογή προμηθευτών. Το Lovable Cloud διατηρεί την ασφάλεια σε επίπεδο πλατφόρμας. Εσείς είστε υπεύθυνοι για την υγιεινή των διαπιστευτηρίων, την επιλογή προσώπων με πρόσβαση εντός του οργανισμού σας και την ακρίβεια των δεδομένων που φορτώνετε.",
          ],
        },
      ],
    },
    dpa: {
      eyebrow: "Νομικά",
      title: "Συμφωνία Επεξεργασίας Δεδομένων",
      intro:
        "Η σελίδα συνοψίζει τη Συμφωνία Επεξεργασίας Δεδομένων (DPA) μεταξύ Verde IQ (εκτελών επεξεργασία) και εσάς (υπεύθυνος επεξεργασίας) για προσωπικά δεδομένα που επεξεργάζονται μέσω του VerdeIQ. Υπογεγραμμένο αντίγραφο παρέχεται κατόπιν αιτήματος.",
      lastUpdated: LAST_UPDATED_EL,
      ownerNote: OWNER_EL,
      sections: [
        {
          heading: "Ρόλοι",
          body: [
            "Για προσωπικά δεδομένα που καταχωρείτε στο VerdeIQ σχετικά με υπαλλήλους, προμηθευτές ή πελάτες σας, εσείς ενεργείτε ως υπεύθυνος επεξεργασίας και η Verde IQ ως εκτελών επεξεργασία βάσει του Άρθρου 28 GDPR. Για δεδομένα λογαριασμού (όνομα, email, χρέωση), η Verde IQ είναι ανεξάρτητος υπεύθυνος επεξεργασίας όπως περιγράφεται στην Πολιτική Απορρήτου.",
          ],
        },
        {
          heading: "Πεδίο και σκοπός",
          body: [
            "Η Verde IQ επεξεργάζεται προσωπικά δεδομένα αποκλειστικά για: (α) την παροχή της υπηρεσίας VerdeIQ, (β) την πρόληψη κατάχρησης και ασφάλεια της πλατφόρμας, και (γ) την εκπλήρωση νομικών υποχρεώσεων. Τα δεδομένα δεν πωλούνται, δεν ενοικιάζονται και δεν χρησιμοποιούνται για διαφήμιση.",
          ],
        },
        {
          heading: "Υπεργολάβοι",
          body: [
            "Η τρέχουσα λίστα δημοσιεύεται στη σελίδα Ασφάλειας. Θα σας ειδοποιήσουμε με email ή εντός εφαρμογής για κάθε προσθήκη, με παράθυρο εναντίωσης 30 ημερών.",
          ],
        },
        {
          heading: "Μέτρα ασφάλειας",
          body: [
            "Κρυπτογράφηση κατά τη μεταφορά (TLS 1.2+), κρυπτογράφηση κατά την αποθήκευση για βάση και αντίγραφα (μέσω πλατφόρμας), πολιτικές Row-Level Security, ρόλοι διαχειριστή, webhooks με HMAC, και service accounts ελάχιστων προνομίων.",
          ],
        },
        {
          heading: "Διεθνείς διαβιβάσεις",
          body: [
            "Όπου υπεργολάβος λειτουργεί εκτός ΕΟΧ, οι διαβιβάσεις βασίζονται στις Τυποποιημένες Συμβατικές Ρήτρες (SCCs, 2021/914) της Ευρωπαϊκής Επιτροπής.",
          ],
        },
        {
          heading: "Αιτήματα υποκειμένων",
          body: [
            "Όταν λαμβάνουμε αίτημα υποκειμένου που αφορά τα δεδομένα σας ως υπεύθυνου επεξεργασίας, το προωθούμε σε εσάς και σας υποστηρίζουμε στην απάντηση εντός των προθεσμιών του GDPR.",
          ],
        },
        {
          heading: "Γνωστοποίηση παραβίασης",
          body: [
            "Σε περίπτωση παραβίασης προσωπικών δεδομένων που αφορά τα δεδομένα σας, η Verde IQ θα σας ειδοποιήσει χωρίς αδικαιολόγητη καθυστέρηση και σε κάθε περίπτωση εντός 72 ωρών από τη στιγμή που έλαβε γνώση, με τις πληροφορίες του Άρθρου 33(3) GDPR.",
          ],
        },
        {
          heading: "Επιστροφή και διαγραφή",
          body: [
            "Κατά τη λήξη, τα δεδομένα διαγράφονται από τα ενεργά συστήματα εντός 30 ημερών και από τα αντίγραφα εντός 12 μηνών, εκτός εάν η διατήρηση απαιτείται από τον νόμο. Δομημένη εξαγωγή μπορεί να ζητηθεί πριν τη λήξη.",
          ],
        },
        {
          heading: "Αίτημα υπογεγραμμένης DPA",
          body: [
            "Στείλτε email στο samuel@stauniverse.tech με την επωνυμία και τη διεύθυνση της εταιρείας σας. Θα σας επιστρέψουμε υπογεγραμμένο αντίτυπο εντός 5 εργάσιμων ημερών.",
          ],
        },
      ],
    },
  },
};

export function getTrustContent(locale: Locale, page: TrustPageKey): TrustPageContent {
  return CONTENT[locale][page];
}

export const TRUST_PAGE_KEYS: TrustPageKey[] = ["privacy", "terms", "security", "dpa"];
