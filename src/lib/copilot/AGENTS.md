# Verde (copilot)

- Verde streams through the AI SDK (`/api/console/copilot`, `toUIMessageStream`) with typed tools in `tools.server.ts`; answers are stored as message parts in `copilot_messages.parts`. Why: the browser redraws the same cards on reload.
- Tools only read records, file a pending `copilot_proposals` row (`propose_change`), ask for facts (form saves via `/api/console/company`), or offer a document; none change records directly. Why: every change keeps the human approval gate.
- Each tool result is drawn by a fixed card in `src/components/app/console/VerdeCards.tsx`; the model never emits layout. Why: on-brand, no invented UI or figures.
- The figure check (`grounding.ts`) runs on the answer against the briefing plus all tool outputs and is sent as a `data-grounding` part. Why: quoted figures must trace to a record.
