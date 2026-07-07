import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId,
      metricsData,
      emissionsBreakdown,
      monthlyTrend,
      industryComparison,
      userProfile 
    } = body;

    if (!userId) {
      return NextResponse.json({ 
        error: 'userId is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        error: 'Gemini API key not configured',
        code: 'API_KEY_MISSING'
      }, { status: 500 });
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

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent(context);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON response
    let insights;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      insights = JSON.parse(jsonText);
    } catch (parseError) {
      // Fallback: create structured response from text
      insights = {
        observations: [
          "Unable to parse AI response",
          "Manual review recommended"
        ],
        recommendations: [
          "Review emissions data for accuracy",
          "Consult with sustainability experts",
          "Implement energy monitoring systems"
        ],
        highlights: [
          "Data collection system is operational"
        ],
        risks: [
          "AI analysis temporarily unavailable"
        ]
      };
    }

    // 🎓 AUTO-GENERATE COURSES based on insights
    if (userId) {
      try {
        const emissionsData = {
          electricity: emissionsBreakdown?.electricity?.percentage || 0,
          gas: emissionsBreakdown?.gas?.percentage || 0,
          transportation: emissionsBreakdown?.transportation?.percentage || 0,
          waste: emissionsBreakdown?.other?.percentage || 0
        };

        console.log('🎓 Triggering auto-course generation from analytics insights...');
        
        // Fire and forget - don't wait for course generation
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/learn/auto-generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            insights: [
              ...(insights.observations || []),
              ...(insights.recommendations || [])
            ],
            emissionsData,
            trigger: 'insight'
          })
        }).catch(err => console.error('Auto-course generation failed:', err));
      } catch (autoGenError) {
        console.error('Failed to trigger auto-course generation:', autoGenError);
      }
    }

    return NextResponse.json({
      success: true,
      insights,
      generatedAt: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Analytics insights API error:', error);
    
    // Return fallback insights on error
    return NextResponse.json({
      success: true,
      insights: {
        observations: [
          "Your emissions data is being tracked consistently",
          "Historical trends are available for analysis"
        ],
        recommendations: [
          "Focus on reducing electricity consumption - it represents the largest share of emissions",
          "Implement energy monitoring systems to identify high-consumption periods",
          "Consider renewable energy procurement or on-site generation"
        ],
        highlights: [
          "You're actively monitoring your sustainability metrics"
        ],
        risks: [
          "Continue regular data collection to identify trends",
          "Set specific reduction targets for each category"
        ]
      },
      generatedAt: new Date().toISOString(),
      fallback: true
    }, { status: 200 });
  }
}