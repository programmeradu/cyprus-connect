import { NextRequest, NextResponse } from 'next/server';
import { aiChat, aiErrorMessage, hasLovableAi } from '@/lib/lovable-ai';
import { bindSessionUser } from "@/lib/api-auth";
import { z } from "zod";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";

const log = logger("analytics.insights");
const num = z.number().finite().min(-1e9).max(1e9).optional();
const metric = z.object({ value: num, change: num }).partial().optional();
const share = z.object({ percentage: num }).partial().optional();
const label = z.string().trim().max(120).optional();
const BodySchema = z.object({
  userId: z.string().max(200).optional(),
  metricsData: z.object({ totalEmissions: metric, energy: metric, water: metric, waste: metric }).partial().optional(),
  emissionsBreakdown: z.object({ electricity: share, gas: share, transportation: share, other: share }).partial().optional(),
  monthlyTrend: z.array(z.object({ month: z.string().max(40), value: num, change: num })).max(36).optional(),
  industryComparison: z.object({ yourPerformance: num, industryAverage: num, betterBy: z.number().finite().default(0) }).nullable().optional(),
  userProfile: z.object({ companyName: label, companyIndustry: label, teamSize: z.union([z.string().max(40), z.number()]).optional() }).passthrough().nullable().optional(),
});


const insightsSchema = z.object({
  observations: z.array(z.string().max(600)).max(8).default([]),
  recommendations: z.array(z.string().max(600)).max(8).default([]),
  highlights: z.array(z.string().max(600)).max(8).default([]),
  risks: z.array(z.string().max(600)).max(8).default([]),
});

export async function POST(request: NextRequest) {
  try {
    const parsedBody = await readJson(request, BodySchema);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const { 
      userId: __claimedUserId,
      metricsData,
      emissionsBreakdown,
      monthlyTrend,
      industryComparison,
      userProfile 
    } = body;
    const __auth = await bindSessionUser(request, __claimedUserId);
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;


    if (!userId) {
      return NextResponse.json({ 
        error: 'userId is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    if (!hasLovableAi()) {
      return NextResponse.json({
        error: 'AI is not set up',
        message: 'AI insights need the AI service, which is not set up on this site yet.',
        code: 'AI_NOT_CONFIGURED'
      }, { status: 503 });
    }

    // Prepare context for AI
    const context = `
You are an expert sustainability analyst. Analyze the following company's emissions data and provide actionable insights.

Company Profile:
- Company: ${userProfile?.companyName || 'Unknown'}
- Industry: ${userProfile?.companyIndustry || 'Unknown'}
- Team Size: ${userProfile?.teamSize || 'Unknown'}

Current Metrics:
- Total Emissions: ${metricsData?.totalEmissions?.value?.toFixed(2)} tons CO2e/year (${metricsData?.totalEmissions?.change?.toFixed(1)}% YoY)
- Energy: ${metricsData?.energy?.value?.toFixed(2)} tons CO2e/year (${metricsData?.energy?.change?.toFixed(1)}% YoY)
- Water: ${metricsData?.water?.value?.toFixed(2)} tons CO2e/year (${metricsData?.water?.change?.toFixed(1)}% YoY)
- Waste: ${metricsData?.waste?.value?.toFixed(2)} tons CO2e/year (${metricsData?.waste?.change?.toFixed(1)}% YoY)

Emissions Breakdown:
- Electricity: ${emissionsBreakdown?.electricity?.percentage?.toFixed(1)}%
- Gas: ${emissionsBreakdown?.gas?.percentage?.toFixed(1)}%
- Transportation: ${emissionsBreakdown?.transportation?.percentage?.toFixed(1)}%
- Other: ${emissionsBreakdown?.other?.percentage?.toFixed(1)}%

Recent Trend (last 6 months):
${monthlyTrend?.map((m: any) => `- ${m.month}: ${m.value?.toFixed(2)} tons (${m.change?.toFixed(1)}% change)`).join('\n')}

Industry Comparison:
${industryComparison ? `
- Your Performance: ${industryComparison.yourPerformance?.toFixed(2)} tons CO2e/month
- Industry Average: ${industryComparison.industryAverage?.toFixed(2)} tons CO2e/month
- Performance: ${industryComparison.betterBy > 0 ? `${industryComparison.betterBy?.toFixed(1)}% better than average` : `${Math.abs(industryComparison.betterBy)?.toFixed(1)}% worse than average`}
` : 'No industry comparison data available'}

Provide a comprehensive analysis with:
1. Key observations about their emissions patterns
2. Top 3 specific, actionable recommendations to reduce emissions
3. Positive highlights about their sustainability performance
4. Risk areas that need attention

Format your response as JSON with these fields:
{
  "observations": ["observation1", "observation2", "observation3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "highlights": ["highlight1", "highlight2"],
  "risks": ["risk1", "risk2"]
}
`;

    // One validated answer or an honest error; never stand-in text.
    let insights: z.infer<typeof insightsSchema>;
    try {
      const text = await aiChat({ json: true, temperature: 0.3, messages: [{ role: 'user', content: context }] });
      const match = text.match(/\{[\s\S]*\}/);
      insights = insightsSchema.parse(JSON.parse(match ? match[0] : text));
    } catch (aiError) {
      const ref = log.error('insights answer failed', aiError);
      return NextResponse.json({ error: 'insights_unavailable', message: aiErrorMessage(aiError), ref }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      insights,
      generatedAt: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    const ref = log.error('insights failed', error);
    return NextResponse.json({ error: 'insights_unavailable', message: 'AI insights could not be created. Please try again.', ref }, { status: 500 });
  }
}
