---
name: Anti-vibecode UI rules
description: Concrete rules to avoid generic AI/vibecoded website tells in VerdeIQ UI
type: constraint
---
Avoid generic AI/vibecoded UI patterns across existing and future pages. **Why:** VerdeIQ must read as a serious B2B sustainability product, not a rushed AI-generated interface.

Rules:
- Do not use tiny, thin, low-contrast uppercase metadata with wide tracking for labels, dates, progress, sources, statuses, table headings, or step text.
- Do not label modules as `Interactive tool` or prefix sections with ornamental ordinals (`01 ·`, `02 ·`) unless the number is a genuine step-control users interact with.
- Do not use dot-separated metadata strings as the primary visual treatment (`01 · Interactive tool`, `Progress · 3/4`, `Sources · ...`); turn them into normal prose/meta text or remove them.
- Small text must be readable and purposeful: use the VerdeIQ tool typography classes (`viq-kicker`, `viq-section-label`, `viq-field-label`, `viq-meta`, `viq-caption`, `viq-button`) or equivalent heavier editorial treatment.
- Avoid generic Inter/shadcn defaults, random tiny badges, decorative icons, pill chips, purple/blue gradients, glass cards, excessive rounded corners, three-card feature rows, weak placeholder copy, and repetitive “AI app” layouts.
- Dates, progress, source notes, status text, table headings, and legal disclaimers should use professional B2B typography: medium-to-semibold weight, normal letter spacing, sufficient contrast, and clear hierarchy.
- Use typography, spacing, dividers, tabular numerals, and restrained borders for hierarchy; do not rely on trendy labels, emojis, Lucide icons, or low-effort decorative accents.
