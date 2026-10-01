# Verde: from chat bot to a working consultant

## Research verdict (106 findings + outside tools)

None of the 106 findings covers "AI that draws cards, buttons and deliverables". Relevant ones and verdict:

| Finding | What it is | Verdict |
|---|---|---|
| Ch 85 Vercel AI SDK | Streaming, tool calls, structured answers, generative UI | **Adopt** as the engine. Already the stack named in our strategy doc. Works with Groq and Cloudflare. |
| Ch 52 Mastra | Agent framework built on top of the AI SDK | Supports, does not replace. Skip for now: our own agent runtime already does queue, approvals, ledger. |
| Ch 52 / 39 MCP | Standard way to expose tools to outside AI | Later: publish Verde's tools as an MCP endpoint after pilots. |
| Ch 57 LangGraph / CrewAI | Python-first agent swarms | Reject: duplicates our Postgres queue (needs your sign-off per our rules). |
| Ch 52 Trigger.dev / Inngest | Background jobs | Reject: same reason. |

Outside the 106 (checked as replacements):

| Tool | Verdict |
|---|---|
| AI Elements (Vercel) | **Adopt**: ready chat parts (message, tool card, reasoning, sources) we restyle to our design. |
| assistant-ui | Good alternative to AI Elements; pick AI Elements because it pairs natively with the SDK. |
| json-render (Vercel) | **Adopt for deliverable layouts**: AI fills a fixed catalogue of our components, cannot invent off-brand UI. |
| CopilotKit / AG-UI | Too heavy; brings its own runtime that overlaps ours. |
| Google A2UI | Too new, no stable React renderer for our stack. |
| Thesys C1 | Paid hosted service, sends data to a third party. Reject. |

## Does Verde need a redesign? Yes.

Today it is a text chat with a proposal block. The vision is a consultant that works, asks, prepares and gets approval. New Verde:

1. **Answer cards, not paragraphs.** Footprint figure, deadline, supplier, funding match, bill, approval: each a designed card with its source and date.
2. **Actions inside the answer.** "Approve", "Answer this question", "Upload the bill", "Download PDF" buttons run through the existing approval and fingerprint paths.
3. **Visible work.** Each tool Verde uses shows as a collapsed step ("Read 3 bills", "Checked EU sanctions list") so people see how the answer was built.
4. **Deliverables in the chat.** Board Summary, supplier request email, CBAM summary appear as a preview card with download; same Typst PDFs and fingerprints.
5. **Knows the page.** Opening Verde on Suppliers or Deadlines starts with that context and 2-3 relevant suggestions, not a blank box.
6. **Asks like a consultant.** When facts are missing, Verde shows a small inline form (revenue, import yes/no) saved through the company record.
7. **Layout.** Side panel on desktop (not a floating modal), full screen on mobile, light/dark, EN/EL. Vuneli leaf identity, no sparkles, no pills, no tiny uppercase labels.

## What stays the same

One conversation per workspace in the database; grounding check on every figure; risk-3 actions still need human approval with exact-input fingerprint; Groq for text.

## Build order

1. Move Verde's server to AI SDK streaming with typed tools (read-only first: footprint, deadlines, suppliers, funding, bills, activity).
2. New panel with AI Elements, restyled; render each tool result as its card.
3. Inline actions wired to existing approval/company/PDF paths.
4. Deliverable cards via a json-render catalogue.
5. Page context + suggestions; Greek; dark mode; mobile; a11y tests; Verde answer tests updated.

## Technical details

- Packages: `ai`, `@ai-sdk/groq` (or `@ai-sdk/openai-compatible` pointed at Groq), AI Elements components copied into `src/components/ai-elements/`, `@json-render/react`.
- `/api/console/copilot` returns `toUIMessageStreamResponse`; messages stored as `UIMessage` parts (migration `0040_copilot_parts.sql`, old rows converted to text parts).
- Tools reuse existing server modules (`company.server.ts`, `obligations.server.ts`, `suppliers.ts`, funding, bills); write tools use `needsApproval` mapped to `copilot_proposals`.
- `src/lib/lovable-ai.ts` gains an AI SDK provider factory so the one-provider-switch rule holds.
- Floating marketing assistant stays separate and text-only.
