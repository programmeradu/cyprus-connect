import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import Image from "next/image";
import heroPhoto from "@/assets/verify-hero-boardroom.jpg";
import footerPhoto from "@/assets/verify-document-footer.jpg";
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
    eyebrow: "Document register",
    how: "How to check a document",
    steps: [
      ["Find the footer", "Every page of a Vuneli PDF ends with a short fingerprint. The last page carries the QR code and the full 64-character fingerprint."],
      ["Scan or type", "Scan the QR code with any phone camera, or type the fingerprint here. Spaces and capital letters do not matter."],
      ["Compare every character", "A match confirms the document is in our register. Compare the full fingerprint shown here with the one printed on the paper."],
    ],
    meta: [["Method", "SHA-256 of the printed data"], ["Register", "Every PDF issued from Vuneli"], ["Shown here", "Only what is on the paper"]],
    imgAlt: "The footer of a printed report showing a fingerprint and a QR code",
    heroAlt: "A reviewer scanning the QR code on a printed sustainability report in a Nicosia boardroom",
    questions: "Questions about a document?",
    questionsBody: "Write to hello@vuneli.com with the document ID. Lenders, auditors and public bodies are welcome to contact us directly.",
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
    eyebrow: "Μητρώο εγγράφων",
    how: "Πώς ελέγχετε ένα έγγραφο",
    steps: [
      ["Βρείτε το υποσέλιδο", "Κάθε σελίδα PDF της Vuneli κλείνει με σύντομο αποτύπωμα. Η τελευταία σελίδα φέρει τον κωδικό QR και το πλήρες αποτύπωμα 64 χαρακτήρων."],
      ["Σαρώστε ή πληκτρολογήστε", "Σαρώστε τον κωδικό QR με την κάμερα του κινητού ή πληκτρολογήστε το αποτύπωμα εδώ. Κενά και κεφαλαία δεν έχουν σημασία."],
      ["Συγκρίνετε κάθε χαρακτήρα", "Η αντιστοιχία επιβεβαιώνει ότι το έγγραφο υπάρχει στο μητρώο μας. Συγκρίνετε το πλήρες αποτύπωμα εδώ με αυτό στο χαρτί."],
    ],
    meta: [["Μέθοδος", "SHA-256 των τυπωμένων στοιχείων"], ["Μητρώο", "Κάθε PDF που εκδίδει η Vuneli"], ["Εμφανίζονται", "Μόνο όσα είναι στο χαρτί"]],
    imgAlt: "Το υποσέλιδο τυπωμένης έκθεσης με αποτύπωμα και κωδικό QR",
    heroAlt: "Ελεγκτής σαρώνει τον κωδικό QR τυπωμένης έκθεσης βιωσιμότητας σε αίθουσα συσκέψεων στη Λευκωσία",
    questions: "Ερωτήσεις για ένα έγγραφο;",
    questionsBody: "Γράψτε στο hello@vuneli.com με τον κωδικό του εγγράφου. Τράπεζες, ελεγκτές και δημόσιοι φορείς μπορούν να επικοινωνήσουν απευθείας μαζί μας.",
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

const LIME_BUTTON =
  "inline-flex h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[var(--accent-lime)] px-7 text-[15px] font-semibold tracking-[-0.01em] text-[var(--accent-lime-foreground)] shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--accent-lime)_55%,transparent)] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

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
    <div className="relative min-h-screen bg-background text-foreground antialiased" style={{ fontFamily: "var(--editorial-sans)" }}>
      <MarketingHeader />

      {/* Hero: context photograph, check form in the first view. */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src={heroPhoto} alt={t.heroAlt} fill priority sizes="100vw" placeholder="blur" className="object-cover object-[70%_center]" />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
        </div>
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-40">
          <div className="max-w-2xl">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/75">{t.eyebrow}</p>
            <h1 className="mt-5 font-[family-name:var(--editorial-display)] text-[2.4rem] font-semibold leading-[1.03] tracking-[-0.025em] text-white sm:text-[3.6rem]" style={{ textWrap: "balance" }}>
              {t.title}
            </h1>
            <p className="mt-6 text-[16.5px] font-medium leading-[1.62] text-white/85 sm:text-[18px]">{t.intro}</p>

            <form action={`/${l}/verify`} method="get" className="mt-9">
              <label htmlFor="code" className="text-[13.5px] font-semibold text-white/80">{t.label}</label>
              <div className="mt-2.5 flex flex-col gap-3 sm:flex-row">
                <input
                  id="code" name="code" defaultValue={raw} placeholder={t.placeholder} autoComplete="off" spellCheck={false} maxLength={200} inputMode="text"
                  className="h-12 min-w-0 flex-1 rounded-full border border-white/25 bg-white/10 px-5 text-[15.5px] tabular-nums tracking-[0.02em] text-white placeholder:text-white/50 outline-none backdrop-blur-md focus:border-white/60 focus:bg-white/15"
                />
                <button type="submit" className={LIME_BUTTON}>{t.check}</button>
              </div>
              {raw && !valid && <p role="alert" className="mt-3 text-[14px] font-medium text-[var(--accent-lime)]">{t.bad}</p>}
            </form>
          </div>

          <dl className="mt-14 grid max-w-3xl grid-cols-1 gap-x-10 gap-y-5 border-t border-white/20 pt-6 sm:grid-cols-3">
            {t.meta.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-white/55">{k}</dt>
                <dd className="mt-1.5 text-[15.5px] font-semibold text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        {valid && (
          <section aria-live="polite" className="py-14 sm:py-16">
            <div className={`rounded-2xl border bg-card p-6 shadow-[0_30px_60px_-40px_rgba(0,0,0,0.35)] sm:p-10 ${doc ? "border-primary/35" : "border-destructive/35"}`}>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-xl">
                  <p className={`text-[12.5px] font-semibold uppercase tracking-[0.14em] ${doc ? "text-primary" : "text-destructive"}`}>{doc ? doc.docId : code.slice(0, 16)}</p>
                  <h2 className="mt-3 font-[family-name:var(--editorial-display)] text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.3rem]">
                    {doc ? t.found : t.notFound}
                  </h2>
                  <p className="mt-3 text-[15.5px] leading-[1.65] text-muted-foreground">{doc ? t.foundBody : t.notFoundBody}</p>
                </div>
                {doc && (
                  <div aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  </div>
                )}
              </div>
              {doc && (
                <dl className="mt-8 grid gap-x-10 gap-y-6 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-4">
                  {[[t.doc, doc.title], [t.type, t.kinds[doc.kind] ?? doc.kind], [t.company, doc.company], [t.issued, issued]].map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <dt className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{k}</dt>
                      <dd className="mt-1.5 break-words text-[16px] font-semibold">{v}</dd>
                    </div>
                  ))}
                  <div className="sm:col-span-2 lg:col-span-4">
                    <dt className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t.full}</dt>
                    <dd className="mt-2 grid grid-cols-4 gap-x-4 gap-y-1.5 text-[15px] font-medium tabular-nums tracking-[0.04em] sm:grid-cols-8">
                      {group(doc.hash).split(" ").map((g, i) => <span key={i}>{g}</span>)}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </section>
        )}

        {/* How it works: numerals and hairlines, one context photograph. */}
        <section className="grid gap-12 border-t border-border py-16 sm:py-20 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-6">
            <h2 className="font-[family-name:var(--editorial-display)] text-[2rem] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[2.6rem]" style={{ textWrap: "balance" }}>{t.how}</h2>
            <ol className="mt-10">
              {t.steps.map(([title, body], i) => (
                <li key={title} className="grid grid-cols-[3rem_1fr] gap-4 border-t border-border py-6 last:border-b">
                  <span className="font-[family-name:var(--editorial-display)] text-[1.5rem] font-semibold text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-[17px] font-semibold">{title}</h3>
                    <p className="mt-1.5 text-[15.5px] leading-[1.65] text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <figure className="lg:col-span-6">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Image src={footerPhoto} alt={t.imgAlt} fill sizes="(min-width: 1024px) 50vw, 100vw" placeholder="blur" className="object-cover" loading="lazy" />
            </div>
          </figure>
        </section>

        <section className="grid gap-10 border-t border-border py-16 sm:py-20 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="font-[family-name:var(--editorial-display)] text-[1.7rem] font-semibold tracking-[-0.02em]">{t.what}</h2>
            <p className="mt-4 text-[16px] leading-[1.7] text-muted-foreground">{t.whatBody}</p>
            <p className="mt-4 text-[14px] font-medium text-muted-foreground">{t.privacy}</p>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <h2 className="font-[family-name:var(--editorial-display)] text-[1.7rem] font-semibold tracking-[-0.02em]">{t.questions}</h2>
            <p className="mt-4 text-[16px] leading-[1.7] text-muted-foreground">{t.questionsBody}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
