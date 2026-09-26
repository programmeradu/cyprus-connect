# Project Memory

## Core
Production domain: https://vuneli.com (set in .env as NEXT_PUBLIC_SITE_URL).
Hosted on Cloudflare Workers (OpenNext). NEVER enable or use Lovable Cloud. See mem://constraints/cloudflare-hosting.
Bilingual EN + EL (el-CY for Cyprus). All new pages must ship in both locales with hreflang.
Every marketing/learn/pillar page ships with REAL context-aware generated hero + inline assets — no generic abstracts, no stock clichés. See mem://design/context-aware-assets.
Never ship lazy/mediocre UI: verify full content fits, no truncation, no overflow, mobile checked.
Innovation first: integration is not innovation. Every feature maps to a research question. See mem://reference/innovation-criteria.

No shortcuts, no mocks, no fake data anywhere. All /app pages share one central workspace state. See mem://constraints/no-shortcuts.

## Memories
- [Context-aware assets](mem://design/context-aware-assets) — Asset generation rules for all marketing/pillar/learn pages
- [Innovation criteria + pathway](mem://reference/innovation-criteria) — DMRID/RIF 56-layer test, Frascati rules, Slush 2026 flagship thesis
- [Strategic research](mem://reference/strategic-research) — Canonical strategy docs in docs/research/
- [No shortcuts](mem://constraints/no-shortcuts) — Build everything properly; honest blocked states instead of mocks; one shared data source
