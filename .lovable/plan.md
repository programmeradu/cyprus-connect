
# Four-site audit + Vuneli composition plan

## Audit findings (54-layer distilled)

### 1. Lifecycle — the "classy one" you noticed
- **Vibe:** Editorial, cinematic, confident. Wide-angle wind-turbine video/photo behind hero; glass card floats over it.
- **Fonts:** Neue Haas / Söhne-style geometric sans for display (weight 500, tight tracking). Uppercase mono micro-labels `[LIFECYCLE SOLUTIONS]` — square brackets, letter-spaced, ~11px.
- **Header:** Transparent over hero. Small wordmark left, minimal nav center, sharp neon-lime rectangular CTA `BUY LIFECYCLE`.
- **Hero card:** Frosted glass panel (backdrop-blur, subtle white/10 fill), bracketed eyebrow, 3-line stacked headline `Future-proof / Your / Operations.` with period. Lime CTA rectangle full-width inside card.
- **Secondary CTA:** Pill with two overlapping avatars → "SPEAK WITH OUR TEAM" + circular arrow icon. Human, not corporate.
- **Logos strip:** Continuous horizontal marquee, monochrome logos, "Helping 100+ leading companies…"
- **Verdict:** THIS is the target aesthetic for Vuneli — cinematic photo hero + floating glass panel + bracketed micro-labels + accent CTA color.

### 2. Emitra — clean SaaS
- **Vibe:** Bright, minimal, dashboard-forward.
- **Fonts:** Rounded geometric sans (Satoshi/General Sans-family). Dark forest green primary (#1a4d2e ish).
- **Hero:** Centered stack. Small pill badge "🌿 30% fewer reporting errors" → giant 2-line headline → subhead → primary+ghost CTA pair → **tilted 3D product screenshot** with green line-chart dashboard.
- **Key steal:** The tilted dashboard mockup below hero. Extremely effective for a real product.

### 3. Solaric — dark cinematic
- **Vibe:** Premium dark, orange accent, image-forward.
- **Fonts:** Sharp display sans (Aeonik/Neue Machina-family), all lowercase micro-labels with tiny icon.
- **Header:** **Floating rounded-full nav pill** (glass, dark), centered. Orange CTA rectangle far right.
- **Hero:** Split — text left, edge-bleed hero photo right (wind turbine detail). Star row + "1200+ user ratings" with 4 avatar circles.
- **Key steal:** Floating pill nav + edge-bleed photo hero + avatar/rating trust cluster.

### 4. GreenX — atmospheric
- **Vibe:** Airy, sky-forward, big centered type.
- **Fonts:** Modern grotesk, huge display weight 500 with an italic-serif accent line ("for a greener future" in lighter italic).
- **Hero:** Full-bleed sky photo, centered mega-headline with **mixed weight** (bold first line, thin italic second line), rounded white pill CTA with dark circular arrow.
- **Key steal:** Mixed-weight headline treatment + rounded arrow-pill CTA + full-bleed atmospheric photo.

## The composition — Vuneli landing v3

Blend the four top moves into one coherent identity:

| Element | Source | Adaptation for Vuneli |
|---|---|---|
| Full-bleed cinematic hero photo | Lifecycle + GreenX | Cyprus-specific: Mediterranean coastline w/ solar array, or Troodos wind farm at dawn |
| Floating pill nav (glass) | Solaric | Transparent-to-glass on scroll, Vuneli wordmark left, EN/EL switch right |
| Bracketed mono eyebrow `[CYPRUS SUSTAINABILITY OS]` | Lifecycle | Keep our editorial identity |
| Frosted glass hero card | Lifecycle | Contains headline + subhead + primary CTA |
| Mixed-weight headline | GreenX | `Cyprus SMEs, /` (bold) + `built for CBAM & CSRD.` (thin italic Fraunces) |
| Accent CTA color | Lifecycle lime → **Vuneli emerald/lime** | Sharp rectangle, no rounding |
| Human trust cluster (avatars + "SPEAK WITH TEAM") | Lifecycle + Solaric | Real CY partner logos + "Talk to a Cyprus advisor" |
| Tilted dashboard mockup below hero | Emitra | Real Vuneli dashboard screenshot, tilted, w/ EAC widget, CBAM tracker |
| Marquee integration logos | Lifecycle | EAC, JCC, SoftOne, CY Login, Registrar |

## Scope of build

1. **Fonts:** Add `Neue Haas Grotesk Text` substitute via Google (`Manrope` or `General Sans` free alt) + keep `Fraunces` for italic serif accent + `JetBrains Mono` for bracketed labels.
2. **Assets to generate (~8, not 200):**
   - Hero cinematic photo (Cyprus dawn coastline w/ turbines or Troodos)
   - Tilted dashboard mockup (product-shot skill on real screenshot)
   - 3 avatar portraits for trust cluster
   - 6 monochrome partner-logo SVGs (EAC, JCC, SoftOne, CY Login, Registrar, TAXISnet — stylized wordmarks, not real logos)
   - 1 secondary section photo
3. **Components to rebuild:**
   - `MarketingHeader.tsx` → floating glass pill
   - New `HeroCinematic.tsx` (photo + glass card + bracketed eyebrow + mixed-weight headline + trust cluster)
   - New `DashboardMockup.tsx` (tilted, shadowed product shot)
   - `IntegrationsMarquee.tsx` (mono logos, infinite scroll)
4. **Keep:** ContextWidgets, LearnLinksSection, NewsTicker, editorial sections below the fold.
5. **Do NOT touch:** business logic, auth, tools, /learn, /app.

## What I will NOT do
- Generate 100–1000 assets. That's waste. 8 well-crafted assets beat 1000 slop.
- Blindly copy Framer template code (they're paid templates; and it'd violate our anti-slop rules). I re-interpret the moves in our stack.
- Add pill badges or Lucide icons — banned by memory.

## Ask before I build
Two calls I need you to make:
1. **Accent color for CTA:** Lifecycle-style neon lime (`#DFFF3D`), or stay with Vuneli emerald? Lime is more distinctive but louder.
2. **Hero photo subject:** (a) Cyprus dawn coastline with distant turbines, (b) Troodos ridgeline solar array, (c) Limassol port at golden hour (CBAM/shipping angle). Pick one and I generate it premium-tier.

Answer those two, I execute the full rebuild in one pass.
