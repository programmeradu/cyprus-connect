---
name: 30-layer premium UI/UX rulebook
description: Consolidated UI/UX principles from top designers (Rauch, Ive, Frost, Wathan, Rams, NN/g, Refactoring UI) applied to Vuneli across marketing, app, tools, learn
type: design
---

Distilled from Dieter Rams' 10 principles, Refactoring UI (Wathan/Schoger), NN/g heuristics (Nielsen), Apple HIG, Material 3, Linear/Vercel/Stripe/Notion craft posts, Brad Frost atomic design, Edward Tufte data-ink, Steve Krug "don't make me think", Farai Madzima inclusive design, WCAG 2.2. Combine with `mem://constraints/anti-vibecode-ui`, `mem://constraints/no-icons-no-pills`, `mem://design/typography`.

## 30 layers

1. **Purpose per screen.** Every page answers: who, what job, what next. If a section doesn't advance the job, cut it.
2. **One primary action per view.** Never two equal-weight CTAs. Secondary actions are ghost/text buttons.
3. **Visual hierarchy by weight + size + color, not decoration.** Use 2–3 type sizes per view, 2 weights max. No shadows/gradients as hierarchy crutches.
4. **8pt spacing grid.** All paddings/margins are multiples of 4 (prefer 8, 12, 16, 24, 32, 48, 64, 96). No 13px, 27px.
5. **Content-first widths.** Body prose ≤ 68ch. Forms ≤ 480px. Dashboards use 12-col grid with 24–32px gutters.
6. **Generous whitespace.** Section vertical rhythm ≥ 80px desktop, ≥ 48px mobile. Cramped screens read cheap.
7. **Real content, never lorem/placeholder.** Copy is a design material. Ship with real numbers, names, dates.
8. **Copy voice: specific, concrete, verb-forward.** No "Empower/Unlock/Supercharge/Revolutionize". Say what it does.
9. **Text contrast ≥ 4.5:1 body, ≥ 3:1 large.** No thin gray-on-white. Muted text = foreground/70, never foreground/40 for readable content.
10. **Typography locked** (see typography memory). Fraunces display + Instrument Sans body. No tracking-tight on small headings. Tabular-nums for all numbers.
11. **Color: one accent + neutrals.** No purple→blue gradients. Accent used sparingly for actions and single emphasis, not decoration.
12. **Borders over shadows for structure.** 1px foreground/10 dividers. Reserve shadows for elevated overlays (modals, popovers) only.
13. **Radii scale: 6px inputs, 8px cards, 12px modals.** Never rounded-2xl/3xl on rectangles. No rounded-full pill chips.
14. **No decorative icons.** Type + spacing + numerals carry hierarchy. Functional icons only (close, chevron, search, external-link), single-stroke monochrome.
15. **Buttons.** Height 40–44px, 14.5–15px medium weight, 6px radius, filled=primary/ghost=secondary/text=tertiary. Never gradient buttons.
16. **Inputs.** 44px height, visible border always (not just focus), label above, helper below, error red with icon-free text. Never floating labels for data entry.
17. **Tables > cards for scannable data.** Left-align text, right-align numbers, tabular-nums, zebra optional, sticky header.
18. **Empty states are designed.** Real illustration or single line + primary action. Never "No data" alone.
19. **Loading = skeletons matching final layout**, not spinners in the middle of the page. Debounce ≥ 200ms before showing.
20. **Error messages: what happened + how to fix + one action.** Never "Something went wrong".
21. **Feedback within 100ms** for taps, 1s for transitions, otherwise show progress. Never silent success — toast or inline confirm.
22. **Motion: 150–250ms ease-out for UI, 400–600ms for page transitions.** No bounce, no parallax on marketing hero, no scroll-jacking.
23. **Focus rings visible on every interactive.** 2px outline, offset 2px, accent color. Never `outline: none` without a replacement.
24. **Touch targets ≥ 44×44px.** Icon buttons get padding, not tiny hit zones.
25. **Mobile-first verify.** Every screen checked at 390×844 before shipping. No horizontal scroll. No truncation on critical labels.
26. **Responsive text: fluid clamp() for hero, fixed steps for body.** Avoid text >72px on mobile.
27. **Information density calibrated to user.** Marketing = airy, tool = dense-but-organized, dashboard = scannable rows.
28. **Progressive disclosure.** Advanced options behind "Show advanced". FAQ accordions collapsed by default. Never dump everything.
29. **Accessibility non-negotiable.** Semantic HTML, aria-labels on icon buttons, skip-link, keyboard-navigable, color never the only signal, prefers-reduced-motion respected.
30. **Consistency across surfaces.** Same primary button, same input, same section header pattern on marketing, learn, tools, and app. A user moving from `/tools` to `/app` should feel one product.

## Applied bans (enforced across codebase)

- No `rounded-full` chip/pill badges.
- No decorative Lucide/emoji icons.
- No `tracking-tight` + `font-light/300` combo.
- No purple/indigo→blue/pink gradients.
- No glassmorphism cards on content pages.
- No three-identical-benefit-card rows.
- No "01 · Interactive tool" style dot-eyebrows.
- No `truncate`/`line-clamp` on labels carrying meaning.
- No `bg-gradient-to-r` on buttons.
- No emoji as UI.

## Applied requirements

- Every marketing/learn/tool page uses `ToolShell`/`PillarShell` pattern: hero (eyebrow + display h1 + subtitle + revision date + hero image), tool/content, methodology dl, worked example, FAQ (accordion collapsed), related, CTA. No deviation without justification.
- Body text 15.5–17px, line-height 1.6–1.7, foreground/70–75.
- Headings use Fraunces display, letter-spacing -0.015 to -0.02em, weight 600.
- Numbers everywhere tabular-nums.
- Buttons: filled foreground/background pair, ghost = border foreground/20, both 44px height, 6px radius.
