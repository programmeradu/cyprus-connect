# Obligation rules

- Legal deadlines come from one fixed rulebook (`src/lib/obligations/rulebook.ts`) matched per workspace into `obligations` (applies/might/not, reason, source) by `obligations.server.ts`; rows people edit or add are never overwritten. EUR-Lex amendments to a rule's base law are stored in `law_watch` and mark the rule "under review" until a person confirms it. Why: deadlines only for businesses they apply to, reproducible, and no AI ever rewrites a legal date.
