/**
 * Accounting and ERP systems offered through Nango. Client-safe: the modal
 * renders it and the connect route validates `integrationId` against it.
 *
 * `id` is the integration key set up in the Nango dashboard. Every accounting
 * system, QuickBooks and Xero included, links through Nango only.
 *
 * Logos are the vendors' official marks, each with a light and a dark cut.
 * `markHeight` evens out optical size, because wordmarks differ in shape.
 */

export interface ErpSystem {
  id: string;
  name: string;
  /** Who it is for, in plain words. */
  fit: { en: string; el: string };
  light: string;
  dark: string;
  markHeight: number;
}

export const ERP_SYSTEMS: ErpSystem[] = [
  {
    id: "sage-intacct",
    name: "Sage Intacct",
    fit: { en: "Cloud finance for growing firms", el: "Οικονομική διαχείριση για εταιρείες σε ανάπτυξη" },
    light: "/integrations/erp/sage-light.svg",
    dark: "/integrations/erp/sage-dark.svg",
    markHeight: 24,
  },
  {
    id: "sap-business-one",
    name: "SAP Business One",
    fit: { en: "ERP for small and mid-size firms", el: "ERP για μικρές και μεσαίες εταιρείες" },
    light: "/integrations/erp/sap-light.svg",
    dark: "/integrations/erp/sap-dark.svg",
    markHeight: 26,
  },
  {
    id: "netsuite",
    name: "Oracle NetSuite",
    fit: { en: "Cloud ERP for multi-entity groups", el: "Cloud ERP για ομίλους εταιρειών" },
    light: "/integrations/erp/netsuite-light.png",
    dark: "/integrations/erp/netsuite-dark.png",
    markHeight: 26,
  },
  {
    id: "microsoft-dynamics-365",
    name: "Microsoft Dynamics 365 Business Central",
    fit: { en: "ERP in the Microsoft 365 stack", el: "ERP στο περιβάλλον Microsoft 365" },
    light: "/integrations/erp/dynamics-light.svg",
    dark: "/integrations/erp/dynamics-dark.svg",
    markHeight: 30,
  },
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    fit: { en: "Accounting for small businesses", el: "Λογιστική για μικρές επιχειρήσεις" },
    light: "/integrations/erp/quickbooks-brand.svg",
    dark: "/integrations/erp/quickbooks-brand.svg",
    markHeight: 32,
  },
  {
    id: "xero",
    name: "Xero",
    fit: { en: "Accounting for small firms and their accountants", el: "Λογιστική για μικρές εταιρείες και λογιστές" },
    light: "/integrations/erp/xero-brand.svg",
    dark: "/integrations/erp/xero-brand.svg",
    markHeight: 32,
  },
  {
    id: "zoho-books",
    name: "Zoho Books",
    fit: { en: "Accounting in the Zoho suite", el: "Λογιστική στη σουίτα Zoho" },
    light: "/integrations/erp/zoho-light.svg",
    dark: "/integrations/erp/zoho-dark.svg",
    markHeight: 30,
  },
  {
    id: "freshbooks",
    name: "FreshBooks",
    fit: { en: "Invoicing and expenses for service firms", el: "Τιμολόγηση και έξοδα για εταιρείες υπηρεσιών" },
    light: "/integrations/erp/freshbooks-light.svg",
    dark: "/integrations/erp/freshbooks-dark.svg",
    markHeight: 22,
  },
];

export const ERP_SYSTEM_IDS = ERP_SYSTEMS.map((s) => s.id) as [string, ...string[]];
