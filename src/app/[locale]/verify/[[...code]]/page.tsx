import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { findIssuedDocument, normaliseCode } from "@/lib/document-verify.server";

export const dynamic = "force-dynamic";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://vuneli.com").replace(/\/$/, "");

type Params = Promise<{ locale: string; code?: string[] }>;
type Search = Promise<{ code?: string }>;

const T = {
  en: {
    title: "Check a Vuneli document",
    intro: "Every PDF Vuneli issues carries a fingerprint and a QR code. Scan the code or type the fingerprint to confirm the document came from Vuneli and that its figures have not been changed.",
    label: "Fingerprint or QR code",
    placeholder: "e.g. 3f9a 1c02 … or the full 64-character fingerprint",
    check: "Check",
    found: "Issued by Vuneli",
    foundBody: "This document is in Vuneli’s register. Compare the full fingerprint below with the one printed on the last page — every character must match.",
    notFound: "Not in our register",
    notFoundBody: "We have no document with this fingerprint. Check for typing mistakes. If you scanned the QR code and still see this, the document was not issued by Vuneli or its contents were changed.",
    bad: "A fingerprint has 64 characters (0–9, a–f); the QR code holds the first 16. Spaces are ignored.",
    doc: "Document", type: "Type", company: "Company", issued: "Issued", full: "Full fingerprint",
    kinds: { "board-summary": "Board summary", report: "Sustainability report", cbam: "CBAM declaration" },
    what: "What this proves",
    whatBody: "The fingerprint is a SHA-256 digest of exactly the data printed in the document. Matching fingerprints show the figures are the ones Vuneli produced on the issue date. It is not a qualified electronic signature and does not mean the figures were audited.",
    privacy: "This page shows only details printed on the document itself.",
  },
  el: {
    title: "Έλεγχος εγγράφου Vuneli",
    intro: "Κάθε PDF της Vuneli φέρει ψηφιακό αποτύπωμα και κωδικό QR. Σαρώστε τον κωδικό ή πληκτρολογήστε το αποτύπωμα για να επιβεβαιώσετε ότι το έγγραφο εκδόθηκε από τη Vuneli και ότι τα στοιχεία του δεν άλλαξαν.",
    label: "Αποτύπωμα ή κωδικός QR",
    placeholder: "π.χ. 3f9a 1c02 … ή ολόκληρο το αποτύπωμα 64 χαρακτήρων",
    check: "Έλεγχος",
    found: "Εκδόθηκε από τη Vuneli",
    foundBody: "Το έγγραφο υπάρχει στο μητρώο της Vuneli. Συγκρίνετε το πλήρες αποτύπωμα παρακάτω με αυτό που είναι τυπωμένο στην τελευταία σελίδα — κάθε χαρακτήρας πρέπει να ταιριάζει.",
    notFound: "Δεν υπάρχει στο μητρώο μας",
    notFoundBody: "Δεν βρέθηκε έγγραφο με αυτό το αποτύπωμα. Ελέγξτε για λάθη πληκτρολόγησης. Αν σαρώσατε τον κωδικό QR και βλέπετε αυτό το μήνυμα, το έγγραφο δεν εκδόθηκε από τη Vuneli ή το περιεχόμενό του άλλαξε.",
    bad: "Το αποτύπωμα έχει 64 χαρακτήρες (0–9, a–f)· ο κωδικός QR περιέχει τους πρώτους 16. Τα κενά αγνοούνται.",
    doc: "Έγγραφο", type: "Τύπος", company: "Εταιρεία", issued: "Έκδοση", full: "Πλήρες αποτύπωμα",
    kinds: { "board-summary": "Σύνοψη διοικητικού συμβουλίου", report: "Έκθεση βιωσιμότητας", cbam: "Δήλωση CBAM" },
    what: "Τι αποδεικνύει",
    whatBody: "Το αποτύπωμα είναι σύνοψη SHA-256 ακριβώς των στοιχείων που τυπώνονται στο έγγραφο. Αν ταιριάζει, τα στοιχεία είναι αυτά που παρήγαγε η Vuneli την ημερομηνία έκδοσης. Δεν είναι εγκεκριμένη ηλεκτρονική υπογραφή και δεν σημαίνει ότι τα στοιχεία ελέγχθηκαν από ελεγκτή.",
    privacy: "Η σελίδα δείχνει μόνο στοιχεία που είναι ήδη τυπωμένα στο έγγραφο.",
  },
} as const;

const safeLocale = (l: string) => (routing.locales.includes(l as Locale) ? (l as Locale) : routing.defaultLocale) as "en" | "el";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const l = safeLocale((await params).locale);
  const t = T[l];
  const languages: Record<string, string> = { "x-default": `${SITE_URL}/en/verify` };
  for (const x of routing.locales) languages[x === "el" ? "el-CY" : x] = `${SITE_URL}/${x}/verify`;
  const title = `${t.title} - Vuneli`;
  return {
    title,
    description: t.intro.slice(0, 155),
    alternates: { canonical: `${SITE_URL}/${l}/verify`, languages },
    // Result pages are per-document; only the empty form is worth indexing.
    robots: { index: true, follow: false },
    openGraph: { title, description: t.intro.slice(0, 155), url: `${SITE_URL}/${l}/verify`, siteName: "Vuneli", type: "website" },
    twitter: { card: "summary", title, description: t.intro.slice(0, 155) },
  };
}

const group = (h: string) => h.match(/.{1,4}/g)!.join(" ");

export default async function VerifyPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { locale, code: seg } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  const l = safeLocale(locale);
  const t = T[l];
  const raw = (seg?.[0] ?? (await searchParams).code ?? "").slice(0, 200);
  const code = normaliseCode(raw);
  const valid = code.length === 16 || code.length === 64;
  const doc = valid ? await findIssuedDocument(code).catch(() => null) : null;
  const issued = doc ? new Intl.DateTimeFormat(l === "el" ? "el-CY" : "en-GB", { dateStyle: "long", timeZone: "Europe/Nicosia" }).format(doc.issuedAt) : "";

  return (
    <div className="min-h-screen bg-background text-foreground antialiased" style={{ fontFamily: "var(--editorial-sans)" }}>
      <MarketingHeader />
      {/* Dark masthead, as on the trust pages, so the floating header stays legible. */}
      <section className="bg-[oklch(0.19_0.02_150)] text-white">
        <div className="mx-auto max-w-3xl px-5 pb-12 pt-28 sm:px-8 sm:pb-14 sm:pt-36">
          <h1 className="text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[2.8rem]" style={{ fontFamily: "var(--editorial-display)", textWrap: "balance" }}>
            {t.title}
          </h1>
          <p className="mt-5 max-w-2xl text-[16.5px] leading-[1.62] text-white/80">{t.intro}</p>
        </div>
      </section>
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-2 sm:px-8">
        <form action={`/${l}/verify`} method="get" className="mt-10">
          <label htmlFor="code" className="text-[14px] font-semibold">{t.label}</label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="code" name="code" defaultValue={raw} placeholder={t.placeholder} autoComplete="off" spellCheck={false} maxLength={200}
              className="min-w-0 flex-1 rounded-lg border border-border bg-card px-4 py-3 font-mono text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button type="submit" className="rounded-lg bg-primary px-6 py-3 text-[15px] font-semibold text-primary-foreground hover:opacity-90">{t.check}</button>
          </div>
          {raw && !valid && <p role="alert" className="mt-3 text-[14px] text-destructive">{t.bad}</p>}
        </form>

        {valid && (
          <section aria-live="polite" className={`mt-10 rounded-xl border p-6 sm:p-8 ${doc ? "border-primary/40 bg-primary/5" : "border-destructive/40 bg-destructive/5"}`}>
            <h2 className={`text-[1.35rem] font-semibold ${doc ? "text-primary" : "text-destructive"}`}>{doc ? `✓ ${t.found}` : t.notFound}</h2>
            <p className="mt-2 text-[15.5px] leading-[1.6] text-muted-foreground">{doc ? t.foundBody : t.notFoundBody}</p>
            {doc && (
              <dl className="mt-6 grid gap-x-8 gap-y-4 border-t border-border pt-6 sm:grid-cols-2">
                {[[t.doc, `${doc.title}`], [t.type, t.kinds[doc.kind] ?? doc.kind], [t.company, doc.company], [t.issued, `${issued} · ${doc.docId}`]].map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <dt className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{k}</dt>
                    <dd className="mt-1 break-words text-[15.5px] font-medium">{v}</dd>
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <dt className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t.full}</dt>
                  <dd className="mt-1 break-all font-mono text-[14px] leading-[1.7]">{group(doc.hash)}</dd>
                </div>
              </dl>
            )}
          </section>
        )}

        <section className="mt-14 border-t border-border pt-8">
          <h2 className="text-[1.1rem] font-semibold">{t.what}</h2>
          <p className="mt-2 text-[15px] leading-[1.65] text-muted-foreground">{t.whatBody}</p>
          <p className="mt-3 text-[13.5px] text-muted-foreground">{t.privacy}</p>
        </section>
      </main>
    </div>
  );
}
