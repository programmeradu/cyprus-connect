# Bilingual full port of the landing into the TanStack shell

## What you'll see when it's done

Opening `https://verdeiq.lovable.app/` (and `/el`) shows the same landing as the Next.js site on verdeiq.stauniverse.tech: same sections in the same order (nav → hero → news ticker → Why → Platform → Ecosystem → Context widgets → How → Testimonial → CTA → Learn links → Footer), same copy (from `messages/en.json` and `messages/el.json`), same images, same theme toggle, same language switcher, same auth-aware nav (Sign in / Dashboard / Sign out). Refresh works on `/`, `/el`, `/en` — no more "Not found".

## Scope note before I start

Two things about this port that will affect behaviour, so you can tell me now if either is a dealbreaker:

1. **Auth cross-origin.** `useSession` on `verdeiq.lovable.app` will read the better-auth cookie for that origin, not for `verdeiq.stauniverse.tech`. Signing in on the Lovable URL will land on `/auth` in the TanStack shell — which currently doesn't exist. Options: (a) ship the CTA as a hard link out to `https://verdeiq.stauniverse.tech/auth` (simple, always works); (b) render an "always signed-out" nav on the Lovable shell (no session read, just Pricing + Sign in buttons that deep-link to the Next site). Default I'll take: **(a)**.

2. **Some inner components pull in Next-only deps** (`SubscriptionBadge` hits `/api/*`, `ContextWidgets` fetches `/api/geolocation` + `/api/weather`, `LearnLinksSection` uses `next-intl`). Rebuilding all their API surface in TanStack is a separate multi-day job. I'll port the visual shells and point their fetches at absolute URLs on `https://verdeiq.stauniverse.tech/api/*` so the widgets show real data via the Next backend. If you'd rather stub them (static copy, no live data) say the word.

## Steps

### 1. i18n in the TanStack shell
- Add `i18next` + `react-i18next` (client-only; SSR renders EN and hydrates).
- Load `messages/en.json` and `messages/el.json` as static JSON imports.
- Provider mounted in `src/routes/__root.tsx`; language read from route param `$locale` (see routing below), fallback `en`.
- Hook `useT(ns)` wrapping `useTranslation()` so JSX matches the Next `useTranslations("nav")` shape 1:1.

### 2. Routing
- `src/routes/$locale.tsx` — pathless-ish layout, validates `$locale ∈ {"en","el"}`, sets `<html lang>` and i18n language, renders `<Outlet />`.
- `src/routes/$locale.index.tsx` — the ported landing.
- `src/routes/index.tsx` — redirects `/` → `/en` (or reads `Accept-Language` in the loader for EL preference).
- `src/routes/__root.tsx` — keeps just the shell + `<Toaster />` from `sonner`.
- `notFoundComponent` on root so unmatched deep links get a real 404, not the current placeholder.

### 3. Port `src/app/[locale]/page.tsx` → `src/routes/$locale.index.tsx`
- Replace `next/image` StaticImageData `.src` reads with plain Vite imports (they return `string` — drop `.src`).
- Replace `@/i18n/navigation` `Link` with `@tanstack/react-router` `Link` (`to="/$locale/tools"` + `params={{ locale }}`).
- Replace `useTranslations("nav")` with `useT("nav")` (same call sites, no JSX changes).
- Keep every helper component in the file (`EditorialSection`, `NumberedList`, `SectionDivider`, `SmartMeterStat`) verbatim.

### 4. Rebuild the shared pieces as TanStack-native components under `src/components/shell/`
- `MarketingNav` — auth-aware nav, uses `authClient.useSession()` from the existing `@/lib/auth-client` (it's already framework-agnostic better-auth).
- `LanguageSwitcher` — swaps `$locale` param via `useNavigate`, persists to `localStorage`.
- `ThemeToggle` — reuse the existing one (it's already client-only; verify no Next imports).
- `NewsTicker`, `ContextWidgets`, `SubscriptionBadge`, `LearnLinksSection` — copy the JSX, swap `next-intl` → `useT`, `next/link` → TanStack `Link`, and point `fetch("/api/...")` at `https://verdeiq.stauniverse.tech/api/...` (CORS on the Next side already allows the lovable.app origin per the existing `middleware.ts`; I'll verify).
- `PremiumButton` — verify it has no Next imports; if it does, ship a copy under `src/components/shell/PremiumButton.tsx`.

### 5. SEO parity
- `head()` on `$locale.index.tsx` with per-locale title/description pulled from the translation files, plus `og:title`, `og:description`, `og:type=website`, `twitter:card`, and `<link rel="alternate" hreflang="…">` for both locales.
- Set `<html lang={locale}>` from the layout.

### 6. Verification
- `bunx tsgo --noEmit` clean.
- Playwright: open `/`, `/en`, `/el` — screenshot each, confirm hero copy renders in the right language and matches the Next site side-by-side.
- Publish and re-check `verdeiq.lovable.app` in the browser.

## Technical details

- **File layout added:** `src/routes/$locale.tsx`, `src/routes/$locale.index.tsx`, `src/lib/i18n.ts`, `src/components/shell/{MarketingNav,LanguageSwitcher,ThemeToggle,NewsTicker,ContextWidgets,SubscriptionBadge,LearnLinksSection,PremiumButton}.tsx` (only those that need TanStack-safe copies).
- **`src/routes/index.tsx`:** becomes a 5-line loader-redirect to `/en`.
- **Package additions:** `i18next`, `react-i18next`. No SSR-side i18n — first paint is EN, `useEffect` swaps to route locale (matches the "read browser storage in useEffect" rule from execution-model knowledge, no hydration mismatch because the language attribute is set from the route param, not storage).
- **Assets:** the 8 imports in the Next page already exist under `src/assets/`; Vite handles them. Drop the `.src` accessor since Vite returns a string, not `StaticImageData`.
- **Auth:** don't call `authClient.signOut()` in the Lovable shell if we go with option 1a — replace the sign-out button with an outbound link. Session read still works if the user is signed in on the same apex, but on lovable.app it will always be signed-out, which is fine.
- **What I will NOT touch:** anything under `src/app/` (Next.js production site), `netlify.toml`, `next.config.ts`, translation files. Ports are copies, not moves.

## Estimated size

~800 lines added across ~10 new files, no changes to the Next build. If any step balloons (e.g. `SubscriptionBadge` turns out to depend on server-only code), I'll stop and ask before rebuilding it.
