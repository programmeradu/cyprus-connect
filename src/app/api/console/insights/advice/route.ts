/**
 * One-click advice. The server gathers the workspace's real facts itself
 * (nothing is taken from the browser), numbers them, and keeps only AI points
 * that cite those facts. No AI or no facts: an honest message, never stock text.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveConsoleSession } from "@/lib/console-session";
import { logger } from "@/lib/log";
import { aiChat, aiErrorMessage, hasLovableAi } from "@/lib/lovable-ai";
import { complianceSummary, footprintMonths, gridToday } from "@/lib/insights/insights.server";
import { shiftGain } from "@/lib/insights/grid";
import { buildAdvicePrompt, parseAdvice, type Fact } from "@/lib/insights/advice";

export const dynamic = "force-dynamic";
const log = logger("api.console.insights.advice");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export async function POST() {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }
  if (!hasLovableAi()) {
    return NextResponse.json({ message: "The AI service is not set up yet, so no advice was written." }, { status: 503 });
  }
  const { account, workspace } = resolved.session;
  const country = (workspace.country || "CY").toUpperCase();

  try {
    const [grid, months, compliance] = await Promise.all([gridToday(country), footprintMonths(account.id), complianceSummary(account.id)]);
    const texts: string[] = [];
    if (workspace.sector) texts.push(`Sector: ${workspace.sector}; employees: ${workspace.employees ?? "not recorded"}; country: ${country}.`);
    const last = months[months.length - 1];
    if (last) {
      texts.push(`Latest recorded month ${MONTHS[last.month - 1]} ${last.year}: ${last.totalTonnes.toFixed(2)} t CO2e, electricity ${last.electricityKwh} kWh.`);
      const prev = months[months.length - 2];
      if (prev && prev.totalTonnes > 0) {
        const pct = ((last.totalTonnes - prev.totalTonnes) / prev.totalTonnes) * 100;
        texts.push(`Change against ${MONTHS[prev.month - 1]} ${prev.year}: ${pct > 0 ? "+" : ""}${pct.toFixed(1)}%.`);
      }
    }
    if (grid.grid) {
      const g = grid.grid;
      const hh = (iso: string) => new Date(iso).toISOString().slice(11, 16);
      texts.push(`Grid today (${country}, measured): cleanest hour ${hh(g.cleanest.at)} UTC at ${Math.round(g.cleanest.grams)} g/kWh, dirtiest ${hh(g.dirtiest.at)} UTC at ${Math.round(g.dirtiest.grams)} g/kWh; moving 1 kWh between them avoids ${Math.round(shiftGain(g))} g.`);
      if (g.renewableShare !== null) texts.push(`Renewable share of load in the latest hour: ${g.renewableShare.toFixed(1)}%.`);
    }
    if (compliance.tracked > 0) {
      texts.push(`Obligations tracked: ${compliance.tracked}; compliant ${compliance.compliant}; needing action ${compliance.actionRequired}.`);
      if (compliance.next) texts.push(`Next deadline: ${compliance.next.name} on ${compliance.next.deadline.slice(0, 10)} (${compliance.next.daysLeft} days).`);
    }
    const hasOwnData = !!last || compliance.tracked > 0;
    if (!hasOwnData) {
      return NextResponse.json(
        { message: "There is not enough of your own data yet. Record a month in Monthly footprint first." },
        { status: 409 },
      );
    }
    const facts: Fact[] = texts.map((text, i) => ({ id: i + 1, text }));
    const raw = await aiChat({
      messages: [{ role: "user", content: buildAdvicePrompt(workspace.name, facts) }],
      temperature: 0.3,
      json: true,
    });
    const points = parseAdvice(raw, facts);
    if (points.length === 0) {
      return NextResponse.json({ message: "The AI answer did not stick to your facts, so it was not shown. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ points, facts, generatedAt: new Date().toISOString() });
  } catch (error) {
    const ref = log.error("advice failed", error);
    return NextResponse.json({ message: `${aiErrorMessage(error)} Reference ${ref}.` }, { status: 502 });
  }
}
