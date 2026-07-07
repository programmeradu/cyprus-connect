## Scope reality check

The 9-step list is ~15-25 hours of careful work: ~9,660 lines of dashboard code alone, plus onboarding, shared components, formatters, Stripe, emails, SEO, legal, and QA. Trying to do it in one turn = broken files, half-translated pages, no verification. I'll execute in the order you gave, but batched into turns so each chunk is verifiable.

## Execution chunks (one per turn)

**Turn A — Dashboard, small pages (step 1a)**
Leaderboard, Analytics, Marketplace, Billing (~1,090 lines). Extract strings → `messages/{en,el}.json` under `dashboard.<page>` keys, wire `useTranslations()`, verify build.

**Turn B — Dashboard, medium pages (step 1b)**
Dashboard home, Actions, Settings, Learn (~2,890 lines).

**Turn C — Dashboard, large pages (step 1c)**
Calculator, Compliance, Insights, Integrations, Studio (~4,900 lines). Studio + Insights may split further.

**Turn D — Onboarding (step 2)**
`/app/onboarding` flow (~780 lines) + layout.

**Turn E — Shared components (step 3)**
`PaymentGatewaySelector`, toast helpers, empty states, modal shells, Zod error map for form validation. Consolidate under `common.*` namespace.

**Turn F — Formatters (step 4)**
Replace ad-hoc `toLocaleString` / `Intl.NumberFormat` calls with `useFormatter()`. Fix `CurrencyContext` to use locale-aware formatting (EL: `1.234,56 €`).

**Turn G — Stripe CY (step 5)**
Pass `locale`, force `currency: 'eur'` for CY, add 19% VAT line item, update `payment_intent_data.metadata` with `vat_rate`. Touches `/api/stripe/checkout/route.ts` and `/api/marketplace/purchase/route.ts`.

**Turn H — Emails (step 6)**
Bilingual React Email templates (welcome, receipt, password reset). Requires email infra setup if not already done.

**Turn I — SEO (step 7)**
Per-locale `sitemap.xml` + `robots.txt` with hreflang, `generateMetadata({ params: { locale } })` per route.

**Turn J — Legal (step 8)**
Privacy, Terms, Cookies, GDPR, Imprint in EN + EL (CY-compliant boilerplate; you'll need to review with counsel before publish).

**Turn K — QA (step 9)**
Playwright walk of every `/el/*` route, screenshot each, flag overflow / English leaks / clipped Greek.

## What I need from you

1. **Confirm the chunking** — OK to proceed turn-by-turn, or do you want fewer/larger turns?
2. **Greek review** — my translations are professional-grade but not native. Flag any you want reworded after each turn.
3. **Legal (Turn J)** — CY legal pages need a lawyer's review before publishing; I'll ship reasonable templates, not final legal text.

Reply "go" and I start Turn A immediately.
