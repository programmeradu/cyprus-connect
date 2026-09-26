/**
 * Monthly footprint for the workspace.
 *
 * GET  — the months already recorded (newest first), so the calculator can
 *        show history and warn before replacing a month.
 * POST — records one month in one step: the server works out the footprint
 *        from the company's own country, then in one transaction replaces that
 *        month's emissions row, updates the dashboard figures (total and each
 *        scope) and writes an activity event, so every page and agent sees it.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { activityEvents, dashboardMetrics, emissions, metricReadings } from "@/db/schema";
import { resolveConsoleSession } from "@/lib/console-session";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";
import { computeFootprint } from "@/lib/emissions/footprint.server";
import { isFutureMonth, previousMonth, trendPercent } from "@/lib/emissions/footprint";
import { createNotification, NotificationTemplates } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const log = logger("api.console.emissions");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const amount = z.number().finite().min(0).max(100_000_000);
const bodySchema = z
  .object({
    year: z.number().int().min(2015).max(2100),
    month: z.number().int().min(1).max(12),
    electricity: amount,
    gas: amount,
    water: amount,
    waste: amount,
    transport: amount,
  })
  .refine((b) => b.electricity + b.gas + b.water + b.waste + b.transport > 0, {
    message: "Enter at least one amount above zero.",
  });

async function session() {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return { error: NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status }) };
  }
  return { s: resolved.session };
}

export async function GET() {
  const r = await session();
  if (r.error) return r.error;
  try {
    const rows = await db
      .select()
      .from(emissions)
      .where(eq(emissions.userId, r.s.account.id))
      .orderBy(desc(emissions.periodYear), desc(emissions.periodMonth), desc(emissions.id))
      .limit(60);
    // Older data may hold several rows for one month; the newest one counts.
    const seen = new Set<string>();
    const months = rows
      .filter((row) => {
        const k = `${row.periodYear}-${row.periodMonth}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 24)
      .map((row) => ({
        year: row.periodYear,
        month: row.periodMonth,
        electricity: row.electricity,
        gas: row.gas,
        water: row.water,
        waste: row.waste,
        transport: row.transport,
        totalTonnes: row.totalCo2e,
        recordedAt: row.createdAt,
      }));
    return NextResponse.json({ months, country: r.s.workspace.country || "CY" });
  } catch (error) {
    const ref = log.error("GET failed", error);
    return NextResponse.json({ message: "Your recorded months could not be read.", ref }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const r = await session();
  if (r.error) return r.error;
  const parsed = await readJson(request, bodySchema);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;
  if (isFutureMonth(input.year, input.month)) {
    return NextResponse.json({ message: "That month has not ended yet. Choose this month or an earlier one." }, { status: 400 });
  }

  const { account, workspace } = r.s;
  const userId = account.id;
  const region = (workspace.country || "CY").toUpperCase();

  try {
    const footprint = await computeFootprint(input, region);
    const prev = previousMonth(input.year, input.month);
    const periodStart = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
    const periodEnd = new Date(Date.UTC(input.year, input.month, 0, 23, 59, 59, 999)).toISOString();
    const periodLabel = MONTHS[input.month - 1];
    const now = new Date().toISOString();

    const result = await db.transaction(async (tx) => {
      const [earlier] = await tx
        .select({ total: emissions.totalCo2e })
        .from(emissions)
        .where(and(eq(emissions.userId, userId), eq(emissions.periodYear, prev.year), eq(emissions.periodMonth, prev.month)))
        .orderBy(desc(emissions.id))
        .limit(1);

      const replaced = await tx
        .delete(emissions)
        .where(and(eq(emissions.userId, userId), eq(emissions.periodYear, input.year), eq(emissions.periodMonth, input.month)))
        .returning({ id: emissions.id });

      const [row] = await tx
        .insert(emissions)
        .values({
          userId,
          electricity: input.electricity,
          gas: input.gas,
          water: input.water,
          waste: input.waste,
          transport: input.transport,
          totalCo2e: footprint.totalTonnes,
          periodMonth: input.month,
          periodYear: input.year,
          createdAt: now,
        })
        .returning();

      const previous = earlier?.total ?? null;
      const trend = trendPercent(footprint.totalTonnes, previous);
      await tx
        .delete(dashboardMetrics)
        .where(and(eq(dashboardMetrics.userId, userId), eq(dashboardMetrics.metricType, "carbon_footprint"), eq(dashboardMetrics.periodStart, periodStart)));
      await tx.insert(dashboardMetrics).values({
        userId,
        metricType: "carbon_footprint",
        currentValue: footprint.totalTonnes,
        // No earlier month: previous equals current, so no trend is claimed.
        previousValue: previous ?? footprint.totalTonnes,
        trendPercentage: trend ?? 0,
        periodStart,
        periodEnd,
        updatedAt: now,
        createdAt: now,
      });

      const keys = ["co2e_total", "scope1", "scope2", "scope3"];
      await tx
        .delete(metricReadings)
        .where(and(eq(metricReadings.workspaceId, workspace.id), eq(metricReadings.periodStart, periodStart), inArray(metricReadings.metricKey, keys)));
      const values: Record<string, number> = {
        co2e_total: footprint.totalTonnes,
        scope1: footprint.scopes.scope1,
        scope2: footprint.scopes.scope2,
        scope3: footprint.scopes.scope3,
      };
      await tx.insert(metricReadings).values(
        keys.map((metricKey) => ({
          workspaceId: workspace.id,
          metricKey,
          periodStart,
          periodLabel,
          value: values[metricKey],
          source: "manual",
          confidence: footprint.basis === "climatiq" ? 1 : 0.8,
          site: null,
        })),
      );

      await tx.insert(activityEvents).values({
        workspaceId: workspace.id,
        actorType: "human",
        actorName: account.name ?? account.email ?? "A person",
        verb: replaced.length > 0 ? "updated" : "recorded",
        object: `Footprint for ${MONTHS_LONG[input.month - 1]} ${input.year}`,
        detail: `${footprint.totalTonnes.toFixed(2)} t CO2e (${footprint.basis === "climatiq" ? "live factors" : footprint.basis === "mixed" ? "live and published factors" : "published factors"}).`,
      });

      return { row, previous, trend, replaced: replaced.length > 0 };
    });

    await createNotification({
      userId,
      ...NotificationTemplates.emissionEntry({
        month: MONTHS_LONG[input.month - 1],
        year: input.year,
        totalCo2e: footprint.totalTonnes,
        link: "/app/calculator",
      }),
    }).catch((e) => log.warn("notification failed", { errorMessage: String(e) }));

    return NextResponse.json(
      {
        id: result.row.id,
        year: input.year,
        month: input.month,
        region,
        replaced: result.replaced,
        previousTonnes: result.previous,
        trendPercent: result.trend,
        ...footprint,
      },
      { status: 201 },
    );
  } catch (error) {
    const ref = log.error("POST failed", error);
    return NextResponse.json({ message: "The footprint could not be saved. Nothing was changed.", ref }, { status: 500 });
  }
}
