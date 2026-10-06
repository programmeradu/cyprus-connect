import { logger } from "@/lib/log";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, userActions, actions } from '@/db/schema';
import { gt, desc, eq, sql } from 'drizzle-orm';
import { logoDomain } from '@/lib/company-logo';
import { auth } from '@/lib/auth';
import { QA_ACCOUNT, QA_COOKIE, QA_HEADER, isQaRequest } from '@/lib/qa-bypass';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');

    // Parse and validate limit parameter
    let limit = 50; // Default limit
    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return NextResponse.json(
          { error: 'Invalid limit parameter', code: 'INVALID_LIMIT' },
          { status: 400 }
        );
      }
      limit = Math.min(parsedLimit, 100); // Max 100
    }

    // Determine caller identity to show their own details while anonymizing peers
    const cookieHeader = request.headers.get("cookie") || "";
    const qaCookie =
      cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${QA_COOKIE}=`))
        ?.slice(QA_COOKIE.length + 1) ?? null;
    const qa = isQaRequest({ cookie: qaCookie, header: request.headers.get(QA_HEADER) });
    const session = qa ? null : await auth.api.getSession({ headers: request.headers }).catch(() => null);
    const callerUserId = qa ? QA_ACCOUNT.id : session?.user?.id ?? null;

    // Get users with credits > 0, sorted by totalCredits DESC
    const topUsers = await db
      .select({
        userId: user.id,
        name: user.name,
        companyName: user.companyName,
        totalCredits: user.totalCredits,
        website: user.companyWebsite,
        email: user.email,
        companyIndustry: user.companyIndustry,
        countryCode: user.countryCode,
      })
      .from(user)
      .where(gt(user.totalCredits, 0))
      .orderBy(desc(user.totalCredits))
      .limit(limit);

    const prettyIndustry: Record<string, string> = {
      technology: "Technology",
      tech: "Technology",
      manufacturing: "Manufacturing",
      retail: "Retail",
      hospitality: "Hospitality",
      healthcare: "Healthcare",
      finance: "Financial Services",
      logistics: "Logistics",
      agriculture: "Agriculture",
      construction: "Construction",
      energy: "Energy",
      food: "Food & Beverage",
    };

    // Get action counts and details for each user
    const leaderboardWithActions = await Promise.all(
      topUsers.map(async ({ website, email, companyIndustry, countryCode, ...userRecord }, index) => {
        // Get count of completed actions
        const completedActions = await db
          .select({
            count: sql<number>`count(*)`,
          })
          .from(userActions)
          .where(eq(userActions.userId, userRecord.userId));

        const actionCount = completedActions[0]?.count || 0;

        // Get recent completed actions with details
        const recentActions = await db
          .select({
            actionId: userActions.actionId,
            completedAt: userActions.completedAt,
            title: actions.title,
            points: actions.points,
            category: actions.category,
          })
          .from(userActions)
          .leftJoin(actions, eq(userActions.actionId, actions.id))
          .where(eq(userActions.userId, userRecord.userId))
          .orderBy(desc(userActions.completedAt))
          .limit(3);

        const isSelf = Boolean(callerUserId && userRecord.userId === callerUserId);

        const indKey = (companyIndustry || "").trim().toLowerCase();
        const indLabel =
          prettyIndustry[indKey] ||
          (companyIndustry ? companyIndustry.charAt(0).toUpperCase() + companyIndustry.slice(1) : "Enterprise");
        const region = countryCode?.toUpperCase() === "CY" ? "Cyprus" : "EU";
        const peerCompany = `${indLabel} Peer · ${region}`;

        return {
          rank: index + 1,
          userId: isSelf ? userRecord.userId : `peer-${index + 1}`,
          name: isSelf ? userRecord.name : undefined,
          companyName: isSelf ? (userRecord.companyName || userRecord.name) : peerCompany,
          logoDomain: isSelf ? logoDomain(website, email) : null,
          totalCredits: userRecord.totalCredits,
          actionsCompleted: actionCount,
          recentActions: recentActions.filter(a => a.title !== null),
        };
      })
    );

    return NextResponse.json(leaderboardWithActions, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', ref: logger("api.leaderboard").error('request failed', error) },
      { status: 500 }
    );
  }
}