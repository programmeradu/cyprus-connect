import { NextResponse } from "next/server";
import { checkAndDeductAiCredits } from '@/lib/ai-credits';
import { aiChat, aiErrorMessage, hasLovableAi } from "@/lib/lovable-ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Get authorization token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Check + deduct AI credits (single source of truth: user.aiCreditsBalance)
    const creditGate = await checkAndDeductAiCredits(req, 1, 'gemini');
    if (!creditGate.ok) {
      return NextResponse.json({ error: creditGate.error }, { status: creditGate.status });
    }

    if (!hasLovableAi()) {
      return NextResponse.json(
        { error: "AI is not configured on this deployment." },
        { status: 503 }
      );
    }

    // Handle report generation format
    if (body.companyName) {
      const { companyName, industry, reportingPeriod, location, employees, netZeroYear } = body;
      
      const reportPrompt = `Generate a comprehensive sustainability report for the following company:

Company Name: ${companyName}
Industry: ${industry}
Reporting Period: ${reportingPeriod}
Location: ${location}
Number of Employees: ${employees}
Target Net-Zero Year: ${netZeroYear}

Please create a detailed sustainability report with the following sections:

1. Executive Summary (2-3 paragraphs)
2. Carbon Footprint Analysis (include estimated emissions by scope: Scope 1, 2, and 3)
3. Energy Consumption & Efficiency (current state and recommendations)
4. Waste Management & Circular Economy Initiatives
5. Water Usage & Conservation
6. Sustainable Supply Chain Practices
7. Employee Engagement & Green Culture
8. Key Performance Indicators (KPIs) with specific metrics
9. Roadmap to Net-Zero by ${netZeroYear} (actionable steps with timeline)
10. Conclusion & Recommendations

Format the report professionally with clear headings and bullet points where appropriate. Include specific, actionable recommendations and industry benchmarks where relevant.`;

      const text = await aiChat({ messages: [{ role: "user", content: reportPrompt }] });

      return NextResponse.json({ text });
    }
    
    // Handle generic prompt format
    const { prompt, context } = body;
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

    const text = await aiChat({ messages: [{ role: "user", content: fullPrompt }] });

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("AI analyze error:", error);
    return NextResponse.json(
      { error: aiErrorMessage(error) },
      { status: 500 }
    );
  }
}
