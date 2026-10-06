import { NextResponse } from "next/server";
import { z } from "zod";
import { aiChat, aiErrorMessage, hasTextAi } from "@/lib/vuneli-ai";
import { checkRateLimit, createRateLimitHeaders, getRequestIdentifier, RATE_LIMITS } from "@/lib/rate-limit";
import { checkAndDeductAiCredits, refundAiCredits } from "@/lib/ai-credits";
import { auth } from "@/lib/auth";
import { isQaRequest, QA_COOKIE, QA_HEADER } from "@/lib/qa-bypass";

export const dynamic = "force-dynamic";

const ReportInputSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  industry: z.string().trim().min(1, "Industry is required").max(100),
  reportingPeriod: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  employees: z.coerce.number().int().min(1, "Number of employees must be at least 1").max(1_000_000).optional(),
  netZeroYear: z.coerce.number().int().min(2026, "Target net-zero year must be 2026 or later").max(2100).optional(),
});

const PromptInputSchema = z.object({
  prompt: z.string().trim().min(1, "Prompt is required").max(4000),
  context: z.string().max(8000).optional(),
});

export async function POST(req: Request) {
  try {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    // Rate limiting for public / demo protection
    const limit = checkRateLimit(`ai-analyze:${getRequestIdentifier(req)}`, RATE_LIMITS.AI_GENERATION);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute before trying again." },
        { status: 429, headers: createRateLimitHeaders(limit) },
      );
    }

    if (!hasTextAi()) {
      return NextResponse.json(
        { error: "AI service is currently not configured or unavailable." },
        { status: 503 },
      );
    }

    // Check if authenticated or QA bypass
    const cookieHeader = req.headers.get("cookie") ?? "";
    const qaHeader = req.headers.get(QA_HEADER);
    const isQa = isQaRequest({
      cookie: cookieHeader.includes(QA_COOKIE) ? cookieHeader.split(`${QA_COOKIE}=`)[1]?.split(";")[0] : null,
      header: qaHeader,
    });

    let userId: string | null = null;
    if (!isQa) {
      try {
        const session = await auth.api.getSession({ headers: req.headers });
        userId = session?.user?.id ?? null;
      } catch {
        userId = null;
      }
    }

    // If signed-in non-QA user, deduct AI credits
    if (userId) {
      const creditGate = await checkAndDeductAiCredits(req, 1, "analyze");
      if (!creditGate.ok) {
        return NextResponse.json({ error: creditGate.error }, { status: creditGate.status });
      }
    }

    // Branch 1: Structured Report Visuals generation
    if ("companyName" in rawBody || "company" in rawBody) {
      const normalized = {
        companyName: rawBody.companyName || rawBody.company,
        industry: rawBody.industry,
        reportingPeriod: rawBody.reportingPeriod || rawBody.period,
        location: rawBody.location,
        employees: rawBody.employees !== "" ? rawBody.employees : undefined,
        netZeroYear: rawBody.netZeroYear || rawBody.targetYear !== "" ? (rawBody.netZeroYear || rawBody.targetYear) : undefined,
      };

      const parsed = ReportInputSchema.safeParse(normalized);
      if (!parsed.success) {
        if (userId) await refundAiCredits(userId, 1, "validation_failure");
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Invalid report parameters." },
          { status: 400 },
        );
      }

      const { companyName, industry, reportingPeriod, location, employees, netZeroYear } = parsed.data;

      const reportPrompt = `Generate a comprehensive sustainability report for the following company:

Company Name: ${companyName}
Industry: ${industry}
Reporting Period: ${reportingPeriod || "Annual 2026"}
Location: ${location || "Cyprus"}
Number of Employees: ${employees ?? "Not specified"}
Target Net-Zero Year: ${netZeroYear ?? "2050"}

Please create a detailed sustainability report with the following sections:

1. Executive Summary (2-3 paragraphs)
2. Carbon Footprint Analysis (include estimated emissions by scope: Scope 1, Scope 2 location-based, and Scope 3)
3. Energy Consumption & Efficiency (current state and recommendations)
4. Waste Management & Circular Economy Initiatives
5. Water Usage & Conservation
6. Sustainable Supply Chain Practices
7. Employee Engagement & Green Culture
8. Key Performance Indicators (KPIs) with specific metrics
9. Roadmap to Net-Zero by ${netZeroYear ?? 2050} (actionable steps with timeline)
10. Conclusion & Recommendations

Format the report professionally with clear headings and bullet points where appropriate. Include specific, actionable recommendations and industry benchmarks where relevant.`;

      const text = await aiChat({ messages: [{ role: "user", content: reportPrompt }] });
      return NextResponse.json({ text });
    }

    // Branch 2: Generic prompt analysis (e.g. weather / carbon tip)
    const parsedPrompt = PromptInputSchema.safeParse(rawBody);
    if (!parsedPrompt.success) {
      if (userId) await refundAiCredits(userId, 1, "validation_failure");
      return NextResponse.json(
        { error: parsedPrompt.error.issues[0]?.message || "Invalid prompt." },
        { status: 400 },
      );
    }

    const { prompt, context } = parsedPrompt.data;
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
    const text = await aiChat({ messages: [{ role: "user", content: fullPrompt }] });

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("AI analyze error:", error);
    return NextResponse.json(
      { error: aiErrorMessage(error) },
      { status: 500 },
    );
  }
}
