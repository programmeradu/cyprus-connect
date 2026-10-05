# Action plan rules

- Projects come from the fixed library in `catalog.ts`, triggered only by the workspace's own records (bills, fuel payments). Figures are worked out by `roi.ts` from bills, the person's quote and `src/data/actions/constants.ts` (each value sourced); a missing input leaves the figure empty. Why: no invented prices or savings.
- A project is never ticked done. It reaches "confirmed" only when every check its type lists passes (`verify.ts`): purchase = invoice text read by code or a bank payment the person picked; bill_drop = later bills fall at least `DROP_THRESHOLD` against the same months a year before. Checks run on every read in `projects.server.ts`. Why: audit- and lender-grade evidence.
- Proof files that fail the reading are refused and not stored; accepted ones are kept in `documents` (`action_proof`) and linked in `action_evidence`. Why: same rule as document intake.
