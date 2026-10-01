/**
 * Verde answer tests (live). Asks the real model a fixed set of questions
 * against a fixed workspace, with the exact production prompt, and fails if
 * any answer contains a figure not in the records, quotes a figure without
 * its source, or invents an answer to a question the records cannot answer.
 *
 *   bun run scripts/verde-eval.ts        (needs LOVABLE_API_KEY)
 */
import { aiChat } from "@/lib/lovable-ai";
import { systemPrompt, ACTION_MARKER } from "@/lib/copilot/prompt";
import { checkGrounding } from "@/lib/copilot/grounding";
import { FIXED_BRIEFING, VERDE_QUESTIONS } from "../tests/verde-fixtures";

const ADMITS = /(do(es)? not contain|no [a-z ]{0,30}(data|information)|no (reading|record|data)|not (recorded|in (the|your) records|available)|missing|cannot (give|tell|calculate|say)|can't|do not have|don't have|isn't recorded|is not recorded|not set)/i;

const system = systemPrompt("Halloumi House", "Food production", "VSME", FIXED_BRIEFING);
let failed = 0;
for (const { q, trap } of VERDE_QUESTIONS) {
  const raw = await aiChat({ messages: [{ role: "system", content: system }, { role: "user", content: q }], temperature: 0 });
  const answer = (raw.includes(ACTION_MARKER) ? raw.slice(0, raw.indexOf(ACTION_MARKER)) : raw).trim();
  const g = checkGrounding(answer, FIXED_BRIEFING);
  const problems = [
    ...g.unsupported.map((n) => `made-up figure ${n}`),
    ...g.unsourced.map((s) => `no source: "${s}"`),
    ...(trap && !ADMITS.test(answer) ? ["answered a question the records cannot answer"] : []),
  ];
  if (problems.length) failed++;
  console.log(`${problems.length ? "FAIL" : "pass"}  ${q}\n      ${answer.replace(/\s+/g, " ").slice(0, 260)}${problems.length ? `\n      -> ${problems.join("; ")}` : ""}\n`);
}
console.log(`${VERDE_QUESTIONS.length - failed}/${VERDE_QUESTIONS.length} passed`);
process.exit(failed ? 1 : 0);
