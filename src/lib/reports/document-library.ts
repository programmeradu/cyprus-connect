/**
 * The built-in library Verde drafts general documents from.
 *
 * Each document type has a fixed outline and the official sources a careful
 * consultant would open first. The drafter quotes these by name and link; it
 * never browses the open web and never takes a company figure from a source.
 * A request outside sustainability work matches no type and is declined.
 */

export interface LibrarySource {
  label: string;
  url: string;
  /** What the source is used for in this document. */
  use: string;
}

export interface DocumentType {
  key: string;
  label: string;
  /** Who usually receives it. */
  audience: string;
  outline: string[];
  sources: LibrarySource[];
}

const EFRAG_VSME: LibrarySource = {
  label: "Commission Recommendation (EU) 2025/1710 on the voluntary SME standard (VSME)",
  url: "https://eur-lex.europa.eu/eli/reco/2025/1710/oj",
  use: "Disclosure names and structure buyers and banks recognise",
};
const GHG_PROTOCOL: LibrarySource = {
  label: "GHG Protocol Corporate Standard",
  url: "https://ghgprotocol.org/corporate-standard",
  use: "Scope 1, 2 and 3 definitions and boundaries",
};
const GREEN_CLAIMS: LibrarySource = {
  label: "Directive (EU) 2024/825 on empowering consumers for the green transition",
  url: "https://eur-lex.europa.eu/eli/dir/2024/825/oj",
  use: "Rules on generic environmental claims and offsets",
};
const CBAM_REG: LibrarySource = {
  label: "Regulation (EU) 2023/956 establishing CBAM",
  url: "https://eur-lex.europa.eu/eli/reg/2023/956/oj",
  use: "What importers must collect from suppliers",
};
const EUDR_REG: LibrarySource = {
  label: "Regulation (EU) 2023/1115 on deforestation-free products",
  url: "https://eur-lex.europa.eu/eli/reg/2023/1115/oj",
  use: "Due diligence information and geolocation duties",
};
const EU_SANCTIONS: LibrarySource = {
  label: "EU consolidated financial sanctions list",
  url: "https://data.europa.eu/data/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions",
  use: "Screening suppliers for asset freezes",
};
const UN_GUIDING: LibrarySource = {
  label: "OECD Due Diligence Guidance for Responsible Business Conduct",
  url: "https://www.oecd.org/en/publications/oecd-due-diligence-guidance-for-responsible-business-conduct_15f5f4b3-en.html",
  use: "Recognised supplier expectations and due diligence steps",
};
const LMA_GLP: LibrarySource = {
  label: "LMA Green Loan Principles",
  url: "https://www.lma.eu.com/sustainable-lending/documents",
  use: "What banks ask for in a green loan application",
};
const EU_TAXONOMY: LibrarySource = {
  label: "EU Taxonomy Navigator (European Commission)",
  url: "https://ec.europa.eu/sustainable-finance-taxonomy/",
  use: "Activity criteria a lender may check",
};
const ENERGY_EFF: LibrarySource = {
  label: "Directive (EU) 2023/1791 on energy efficiency",
  url: "https://eur-lex.europa.eu/eli/dir/2023/1791/oj",
  use: "Energy audit and management expectations",
};
const CY_ENERGY: LibrarySource = {
  label: "Cyprus Energy Service, Ministry of Energy, Commerce and Industry",
  url: "https://www.mcit.gov.cy/mcit/energyse.nsf/index_en/index_en",
  use: "Cyprus energy programmes and audit rules",
};

export const DOCUMENT_TYPES: DocumentType[] = [
  {
    key: "sustainability_policy",
    label: "Sustainability policy",
    audience: "Staff, customers and buyers",
    outline: ["Purpose and scope", "Commitments", "Energy and emissions", "Resources and waste", "People and conduct", "Responsibilities", "Review"],
    sources: [EFRAG_VSME, GHG_PROTOCOL, GREEN_CLAIMS],
  },
  {
    key: "supplier_code",
    label: "Supplier code of conduct",
    audience: "Suppliers",
    outline: ["Purpose and scope", "Legal compliance and sanctions", "Human and labour rights", "Environment", "Business ethics", "Information we may ask for", "Monitoring and breaches"],
    sources: [UN_GUIDING, EU_SANCTIONS, CBAM_REG, EUDR_REG],
  },
  {
    key: "supplier_data_request",
    label: "Supplier data request letter",
    audience: "A supplier",
    outline: ["Why we are writing", "What we need", "Format and deadline", "How we use the data", "Contact"],
    sources: [CBAM_REG, EUDR_REG, GHG_PROTOCOL],
  },
  {
    key: "buyer_questionnaire",
    label: "Answers to a buyer sustainability questionnaire",
    audience: "A customer or buyer",
    outline: ["Company overview", "Energy and emissions", "Environmental management", "Workforce", "Governance and conduct", "Open items"],
    sources: [EFRAG_VSME, GHG_PROTOCOL],
  },
  {
    key: "green_loan_memo",
    label: "Green loan application memo",
    audience: "A bank",
    outline: ["Borrower overview", "Use of proceeds", "Expected environmental benefit", "Current footprint", "Measurement and reporting", "Open items"],
    sources: [LMA_GLP, EU_TAXONOMY, GHG_PROTOCOL],
  },
  {
    key: "energy_plan",
    label: "Energy and emissions reduction plan",
    audience: "Management",
    outline: ["Baseline", "Where energy is used", "Measures", "Targets", "Funding options", "Owners and timeline"],
    sources: [GHG_PROTOCOL, ENERGY_EFF, CY_ENERGY],
  },
  {
    key: "environmental_claims_review",
    label: "Environmental claims review",
    audience: "Marketing and management",
    outline: ["Claims in use", "What the rules require", "Evidence held", "Claims to change or drop", "Next steps"],
    sources: [GREEN_CLAIMS],
  },
  {
    key: "other_sustainability",
    label: "Sustainability document",
    audience: "As stated in the request",
    outline: [],
    sources: [EFRAG_VSME, GHG_PROTOCOL],
  },
];

export function documentType(key: string | null | undefined): DocumentType {
  return DOCUMENT_TYPES.find((t) => t.key === key) ?? DOCUMENT_TYPES[DOCUMENT_TYPES.length - 1];
}

export const DOCUMENT_TYPE_KEYS = DOCUMENT_TYPES.map((t) => t.key) as [string, ...string[]];
