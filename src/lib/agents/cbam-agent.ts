/**
 * CBAM agent (agent "cbam", Border). Deterministic, no AI cost.
 *
 * For each year with import lines it builds the annual declaration draft,
 * stores it with a content hash, asks for missing supplier data through the
 * review queue, and, once the year has closed and nothing blocks it, asks the
 * declarant to sign. The signature is a risk level 3 act: it runs only when a
 * person approves it, and only on the exact draft they saw.
 *
 * It does not submit to the EU CBAM Registry. There is no registry access, and
 * submission requires the importer's own authorised-declarant account.
 */

import type { AgentRuntime } from "./runtime";
import type { AgentOutcome } from "./orchestrator";
import { buildDraft, dueDateFor, type CbamLineInput } from "./cbam-calc";
import { sha256Hex, stableStringify } from "./hash";

export const FIRST_DEFINITIVE_YEAR = 2026;

/** The years worth working on today: this year's running tally and last year until it is due. */
export function yearsInScope(now: Date): number[] {
  const y = now.getUTCFullYear();
  const years: number[] = [];
  const prev = y - 1;
  if (prev >= FIRST_DEFINITIVE_YEAR && now.toISOString().slice(0, 10) <= dueDateFor(prev)) years.push(prev);
  if (y >= FIRST_DEFINITIVE_YEAR) years.push(y);
  return years;
}

export async function runCbamAgent(rt: AgentRuntime, now = new Date()): Promise<AgentOutcome> {
  const parts: string[] = [];
  let processed = 0;
  let asked = 0;
  let signatureRequests = 0;

  for (const year of yearsInScope(now)) {
    const read = await rt.call("read_cbam_imports", { year });
    const rows = read.output ?? [];
    if (rows.length === 0) continue;
    processed += rows.length;

    const input: CbamLineInput[] = rows.map((r) => ({
      id: r.id,
      importDate: r.importDate,
      cnCode: r.cnCode,
      description: r.description,
      originCountry: r.originCountry,
      supplierName: r.supplierName,
      installationId: r.installationId,
      netMass: r.netMass,
      directSee: r.directSee,
      indirectSee: r.indirectSee,
      customsRef: r.customsRef,
    }));
    const draft = buildDraft(year, input);
    const draftText = stableStringify(draft);
    const draftHash = await sha256Hex(draftText);

    const saved = await rt.call("save_cbam_draft", { year, status: draft.status, draft: draftText, draftHash });
    if (saved.decision !== "executed") {
      parts.push(`${year}: could not save the draft.`);
      continue;
    }

    await rt.call("record_fact", {
      key: `cbam_${year}_embedded_tco2e`,
      value: draft.totals.embeddedT.toFixed(3),
      unit: "tCO2e",
      sourceKind: "derived",
      sourceHash: draftHash,
    });

    for (const issue of draft.issues) {
      const title =
        issue.kind === "default_values"
          ? `Get actual CBAM emissions from ${issue.supplierName} (${year})`
          : issue.kind === "no_installation"
            ? `Get installation IDs from ${issue.supplierName} (${year})`
            : issue.kind === "unknown_cn"
              ? `Check CN codes on ${issue.lineIds.length} CBAM import line(s) (${year})`
              : `Check import dates on ${issue.lineIds.length} CBAM line(s) (${year})`;
      const r = await rt.call("create_task", {
        title,
        detail: `${issue.message} Lines: ${issue.lineIds.join(", ")}.`,
        severity: issue.kind === "unknown_cn" || issue.kind === "wrong_year" ? "high" : "normal",
        kind: issue.kind === "default_values" || issue.kind === "no_installation" ? "evidence" : "review",
        dueAt: draft.dueDate,
      });
      if (r.output?.created) asked += 1;
    }

    const yearClosed = now.getUTCFullYear() > year;
    const state = saved.output?.status;
    if (state === "awaiting_signature" && yearClosed) {
      const s = await rt.call("sign_cbam_declaration", {
        year,
        draftHash,
        embeddedT: draft.totals.embeddedT,
        lines: draft.totals.lines,
      });
      if (s.decision === "queued_for_approval") signatureRequests += 1;
    }

    const stateWord =
      state === "signed"
        ? "signed"
        : state === "below_threshold"
          ? `below the ${50} t threshold`
          : state === "needs_data"
            ? "needs data fixes"
            : yearClosed
              ? "ready for your signature"
              : "running tally, signature after 31 December";
    parts.push(
      `${year}: ${draft.totals.lines} lines, ${draft.totals.massTonnesCounted} t, ${draft.totals.embeddedT} tCO2e embedded, ${stateWord}.`,
    );
  }

  if (parts.length === 0) {
    return { summary: "No CBAM import lines recorded, so there is nothing to declare.", itemsProcessed: 0, confidence: 1 };
  }
  const extras = [
    asked ? `${asked} new supplier or data requests.` : "",
    signatureRequests ? "Signature requested in your review queue." : "",
  ].filter(Boolean);
  return { summary: [...parts, ...extras].join(" "), itemsProcessed: processed, confidence: 1 };
}
