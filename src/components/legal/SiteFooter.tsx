"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useState } from "react";
import { reopenCookieBanner } from "./CookieBanner";

const COPY = {
  en: {
    statementA: "Sustainability reporting,",
    statementB: "built for Cyprus SMEs.",
    ctaLabel: "Start with one bill",
    product: "Product",
    learnCol: "Learn",
    company: "Company",
    legal: "Legal",
    home: "Home",
    pricing: "Pricing",
    tools: "Tools",
    learn: "Guides",
    glossary: "Glossary",
    news: "News",
    about: "About",
    contact: "Contact",
    grants: "Grant alerts",
    privacy: "Privacy",
    terms: "Terms",
    security: "Security",
    dpa: "DPA",
    cookies: "Cookie settings",
    newsletterTitle: "Get EU and Cyprus grant alerts",
    newsletterBody:
      "One short email when a new grant, CBAM update, or CSRD deadline matches your profile. No filler.",
    emailPlaceholder: "you@company.cy",
    subscribe: "Subscribe",
    ok: "You are in. Check your inbox for a confirmation.",
    invalid: "Enter a valid email address.",
    officeLabel: "Office",
    office: "Strovolos, Nicosia · Cyprus",
    hoursLabel: "Advisor hours",
    hours: "Mon–Fri · 09:00–18:00 EET",
    emailLabel: "Email",
    rights: "All rights reserved.",
    made: "Made in Cyprus.",
  },
  el: {
    statementA: "Αναφορές βιωσιμότητας,",
    statementB: "φτιαγμένες για ΜμΕ της Κύπρου.",
    ctaLabel: "Ξεκινήστε με έναν λογαριασμό",
    product: "Προϊόν",
    learnCol: "Μάθετε",
    company: "Εταιρεία",
    legal: "Νομικά",
    home: "Αρχική",
    pricing: "Τιμές",
    tools: "Εργαλεία",
    learn: "Οδηγοί",
    glossary: "Γλωσσάρι",
    news: "Ειδήσεις",
    about: "Σχετικά",
    contact: "Επικοινωνία",
    grants: "Ειδοποιήσεις επιδοτήσεων",
    privacy: "Απόρρητο",
    terms: "Όροι",
    security: "Ασφάλεια",
    dpa: "DPA",
    cookies: "Ρυθμίσεις cookies",
    newsletterTitle: "Ειδοποιήσεις επιδοτήσεων ΕΕ και Κύπρου",
    newsletterBody:
      "Ένα σύντομο email όταν μια νέα επιδότηση, ενημέρωση CBAM ή προθεσμία CSRD ταιριάζει με το προφίλ σας.",
    emailPlaceholder: "you@company.cy",
    subscribe: "Εγγραφή",
    ok: "Είστε μέσα. Ελέγξτε τα εισερχόμενά σας.",
    invalid: "Δώστε ένα έγκυρο email.",
    officeLabel: "Γραφείο",
    office: "Στρόβολος, Λευκωσία · Κύπρος",
    hoursLabel: "Ώρες συμβούλου",
    hours: "Δευ–Παρ · 09:00–18:00 EET",
    emailLabel: "Email",
    rights: "Με επιφύλαξη κάθε νόμιμου δικαιώματος.",
    made: "Φτιαγμένο στην Κύπρο.",
  },
} as const;

function GrainRibs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 overflow-hidden opacity-30">
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1200 96">
        {Array.from({ length: 120 }).map((_, i) => (
          <line
            key={i}
            x1={i * 10}
            y1={0}
            x2={i * 10}
            y2={96 - (i % 7) * 6}
            stroke="currentColor"
            strokeWidth={1}
          />
        ))}
      </svg>
    </div>
  );
}

export function SiteFooter() {
  const locale = (useLocale() as "en" | "el") ?? "en";
  const t = COPY[locale] ?? COPY.en;
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState("error");
      setMsg(t.invalid);
      return;
    }
    setState("loading");
    try {
      const r = await fetch("/api/grant-alerts/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) throw new Error();
      setState("ok");
      setMsg(t.ok);
      setEmail("");
    } catch {
      setState("error");
      setMsg(t.invalid);
    }
  }

  const linkCls =
    "text-[15px] leading-[1.9] text-white/70 hover:text-white transition-colors";
  const labelCls =
    "text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45 mb-4 sm:mb-5";

  return (
    <footer
      className="relative isolate mt-20 overflow-hidden text-white"
      style={{ backgroundColor: "var(--accent-lime-foreground)" }}
    >
      <div className="text-[color-mix(in_oklab,var(--accent-lime)_60%,white_40%)]">
        <GrainRibs />
      </div>

      {/* Top statement + CTA */}
      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-12 sm:px-10 sm:pt-32 sm:pb-14">
        <div className="grid gap-10 sm:gap-14 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-20">
          <div>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-3"
              aria-label="Vuneli home"
            >
              <span
                className="text-2xl tracking-tight text-white sm:text-[26px]"
                style={{ fontFamily: "var(--editorial-serif)", fontWeight: 500 }}
              >
                Vuneli
              </span>
            </Link>
            <h2
              className="mt-6 max-w-xl text-balance text-white sm:mt-8"
              style={{
                fontFamily: "var(--editorial-display)",
                fontWeight: 400,
                fontSize: "clamp(1.85rem, 3.6vw, 3.4rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              {t.statementA}
              <br />
              <em className="italic text-white/60">{t.statementB}</em>
            </h2>
            <div className="mt-8 sm:mt-10">
              <Link
                href={`/${locale}/auth`}
                className="group inline-flex w-full items-center justify-between gap-4 rounded-md px-6 py-4 text-[13px] font-semibold uppercase tracking-[0.14em] transition-transform hover:-translate-y-0.5 sm:w-auto sm:justify-start sm:text-[14px]"
                style={{
                  backgroundColor: "var(--accent-lime)",
                  color: "var(--accent-lime-foreground)",
                  fontFamily: "var(--editorial-sans)",
                }}
              >
                <span>{t.ctaLabel}</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
                  <path
                    d="M3 10h13M11 5l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="square"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* Newsletter card */}
          <aside className="relative rounded-2xl border border-white/12 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-9">
            <p className={labelCls}>{t.grants}</p>
            <h3
              className="text-balance text-white"
              style={{
                fontFamily: "var(--editorial-display)",
                fontWeight: 400,
                fontSize: "clamp(1.35rem, 1.7vw, 1.75rem)",
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
              }}
            >
              {t.newsletterTitle}
            </h3>
            <p
              className="mt-3 max-w-sm text-[14.5px] leading-relaxed text-white/65"
              style={{ fontFamily: "var(--editorial-sans)" }}
            >
              {t.newsletterBody}
            </p>
            <form onSubmit={onSubmit} className="mt-6">
              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:gap-0 sm:overflow-hidden sm:rounded-md sm:border sm:border-white/20 sm:bg-white/[0.06] sm:focus-within:border-white/50">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (state !== "idle") setState("idle");
                  }}
                  placeholder={t.emailPlaceholder}
                  aria-label={t.emailLabel}
                  className="min-w-0 flex-1 rounded-md border border-white/20 bg-white/[0.06] px-4 py-3 text-[15px] text-white placeholder:text-white/40 focus:outline-none sm:rounded-none sm:border-0 sm:bg-transparent"
                  style={{ fontFamily: "var(--editorial-sans)" }}
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-md px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.14em] transition-colors hover:brightness-95 disabled:opacity-60 sm:rounded-none sm:py-0"
                  style={{
                    backgroundColor: "var(--accent-lime)",
                    color: "var(--accent-lime-foreground)",
                    fontFamily: "var(--editorial-sans)",
                  }}
                >
                  <span>{state === "loading" ? "…" : t.subscribe}</span>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0">
                    <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
                  </svg>
                </button>
              </div>
              <p
                className={`mt-3 min-h-[1.25rem] text-[12.5px] ${
                  state === "ok" ? "text-[color:var(--accent-lime)]" : "text-white/55"
                }`}
                role={state === "error" ? "alert" : undefined}
                aria-live="polite"
              >
                {state === "error" || state === "ok" ? msg : ""}
              </p>
            </form>
          </aside>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="h-px w-full bg-white/12" />
      </div>

      {/* Sitemap + Contact rail */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-6 py-12 sm:gap-x-8 sm:gap-y-14 sm:px-10 sm:py-16 md:grid-cols-4 lg:grid-cols-5">
        <div className="col-span-2 md:col-span-4 lg:col-span-1">
          <p className={labelCls}>{locale === "el" ? "Επικοινωνία" : "Contact"}</p>
          <dl className="space-y-4 text-[15px] sm:space-y-5" style={{ fontFamily: "var(--editorial-sans)" }}>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.18em] text-white/40">{t.officeLabel}</dt>
              <dd className="mt-1 text-white/85">{t.office}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.18em] text-white/40">{t.emailLabel}</dt>
              <dd className="mt-1">
                <a href="mailto:hello@vuneli.com" className="break-words text-white/85 underline-offset-4 hover:text-white hover:underline">
                  hello@vuneli.com
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.18em] text-white/40">{t.hoursLabel}</dt>
              <dd className="mt-1 text-white/85">{t.hours}</dd>
            </div>
          </dl>
        </div>

        <div>
          <p className={labelCls}>{t.product}</p>
          <ul className="space-y-1">
            <li><Link href={`/${locale}`} className={linkCls}>{t.home}</Link></li>
            <li><Link href={`/${locale}/pricing`} className={linkCls}>{t.pricing}</Link></li>
            <li><Link href={`/${locale}/tools`} className={linkCls}>{t.tools}</Link></li>
            <li><Link href={`/${locale}/app`} className={linkCls}>{locale === "el" ? "Πίνακας" : "Dashboard"}</Link></li>
          </ul>
        </div>

        <div>
          <p className={labelCls}>{t.learnCol}</p>
          <ul className="space-y-1">
            <li><Link href={`/${locale}/learn`} className={linkCls}>{t.learn}</Link></li>
            <li><Link href={`/${locale}/glossary`} className={linkCls}>{t.glossary}</Link></li>
            <li><Link href={`/${locale}/news`} className={linkCls}>{t.news}</Link></li>
          </ul>
        </div>

        <div>
          <p className={labelCls}>{t.company}</p>
          <ul className="space-y-1">
            <li><a href="mailto:hello@vuneli.com" className={linkCls}>{t.contact}</a></li>
            <li><Link href={`/${locale}/security`} className={linkCls}>{t.security}</Link></li>
          </ul>
        </div>

        <div>
          <p className={labelCls}>{t.legal}</p>
          <ul className="space-y-1">
            <li><Link href={`/${locale}/privacy`} className={linkCls}>{t.privacy}</Link></li>
            <li><Link href={`/${locale}/terms`} className={linkCls}>{t.terms}</Link></li>
            <li><Link href={`/${locale}/dpa`} className={linkCls}>{t.dpa}</Link></li>
            <li>
              <button type="button" onClick={reopenCookieBanner} className={`${linkCls} text-left`}>
                {t.cookies}
              </button>
            </li>
          </ul>
        </div>
      </div>


      {/* Bottom bar — stacks on mobile, with clearance for the floating assistant */}
      <div className="border-t border-white/12">
        <div
          className="mx-auto flex max-w-7xl flex-col gap-4 px-6 pb-24 pt-6 text-[12.5px] leading-relaxed text-white/55 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-10 sm:pb-6"
          style={{ fontFamily: "var(--editorial-sans)" }}
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <span>© {year} Vuneli · {t.rights}</span>
            <span aria-hidden className="hidden h-3 w-px bg-white/20 sm:inline-block" />
            <span>{t.made}</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="https://www.linkedin.com/company/vuneli" target="_blank" rel="noopener noreferrer" className="hover:text-white" aria-label="LinkedIn">
              LinkedIn
            </a>
            <a href="https://x.com/vuneli" target="_blank" rel="noopener noreferrer" className="hover:text-white" aria-label="X">
              X
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
