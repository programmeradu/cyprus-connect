import { aiChat, aiErrorMessage, hasLovableAi } from "@/lib/lovable-ai";
import { NextRequest, NextResponse } from "next/server";
import { convertCurrency } from "@/lib/exchange-rates";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      energyData,
      benchmarkData,
      complianceData,
      userProfile,
      userLocation,
    } = body;

    if (!hasLovableAi()) {
      return NextResponse.json(
        { error: "AI is not configured on this deployment." },
        { status: 503 }
      );
    }

    // Get user's preferred currency from userProfile
    const userCurrency = userProfile?.preferredCurrency || "GHS";
    const countryCurrencyMap: Record<string, string> = {
      GH: "GHS", NG: "NGN", ZA: "ZAR", KE: "KES", US: "USD", 
      GB: "GBP", EU: "EUR", CA: "CAD", AU: "AUD"
    };
    const detectedCurrency = countryCurrencyMap[userLocation?.countryCode] || userCurrency;
    
    // Currency symbols for display
    const currencySymbols: Record<string, string> = {
      GHS: "GH₵", NGN: "₦", ZAR: "R", KES: "KSh", USD: "$",
      GBP: "£", EUR: "€", CAD: "C$", AUD: "A$"
    };
    const currencySymbol = currencySymbols[detectedCurrency] || detectedCurrency;

    // Convert USD savings to user's currency
    let savingsInUserCurrency = energyData?.costSavings?.costSavingsUSD || 0;
    if (detectedCurrency !== "USD" && savingsInUserCurrency > 0) {
      const converted = await convertCurrency(savingsInUserCurrency, "USD", detectedCurrency);
      if (converted !== null) {
        savingsInUserCurrency = Math.round(converted);
      }
    }

    // Build comprehensive context from user data
    const dataContext = `
You are a sustainability advisor for Vuneli, providing personalized insights for SMEs.

USER PROFILE:
- Company: ${userProfile?.companyName || "SME"}
- Industry: ${userProfile?.companyIndustry || "general"}
- Location: ${userLocation?.country || "Unknown"} (${userLocation?.countryCode || "N/A"})
- Preferred Currency: ${detectedCurrency}
- Team Size: ${userProfile?.teamSize || "small"}
- Total Carbon Credits: ${userProfile?.totalCredits || 0} kg CO2e

ENERGY & CARBON DATA:
- Current Carbon Intensity: ${energyData?.carbonIntensity?.current || "N/A"} gCO2/kWh
- Renewable Energy Percentage: ${energyData?.carbonIntensity?.renewablePercentage || 0}%
- Fossil Fuel Percentage: ${energyData?.carbonIntensity?.fossilFuelPercentage || 0}%
- Potential Monthly Savings: ${currencySymbol}${savingsInUserCurrency.toLocaleString()}
- Carbon Reduction Potential: ${energyData?.costSavings?.carbonSavingsKg || 0} kg CO2e/month

INDUSTRY BENCHMARKS:
- Company Emissions: ${benchmarkData?.peerComparison?.companyEmissions || "N/A"} kg CO2e
- Industry Average: ${benchmarkData?.sectorBenchmarks?.globalAverage || "N/A"} kg CO2e
- Percentile Ranking: ${benchmarkData?.peerComparison?.percentile || "N/A"}% (${benchmarkData?.peerComparison?.interpretation || "N/A"})
- Performance: ${benchmarkData?.peerComparison?.companyEmissions < benchmarkData?.sectorBenchmarks?.globalAverage ? "Better than industry average" : "Below industry average"}

COMPLIANCE STATUS:
- Region: ${complianceData?.filters?.region || "Global"}
- Compliance Score: ${complianceData?.score?.percentage || 0}%
- Completed Requirements: ${complianceData?.score?.completed || 0}/${complianceData?.score?.total || 0}
- High Priority Items: ${complianceData?.highPriority?.length || 0}
- Upcoming Deadlines: ${complianceData?.upcoming?.length || 0}

NEXT URGENT DEADLINE:
${complianceData?.upcoming?.[0] ? `- ${complianceData.upcoming[0].name} (${complianceData.upcoming[0].framework}) in ${complianceData.upcoming[0].daysUntilDeadline} days` : "- No urgent deadlines"}
`;

    const prompt = `Based on the data above, generate THREE types of personalized insights:

1. COMPLIANCE RECOMMENDATIONS (3-4 actionable items):
   - Focus on the user's specific region (${complianceData?.filters?.region || "Global"})
   - Prioritize based on upcoming deadlines and compliance gaps
   - Be specific to their industry and company size
   - Include regulatory guidance relevant to ${userLocation?.country || "their location"}

2. INDUSTRY INSIGHTS (2-3 strategic observations):
   - Compare their performance to industry benchmarks
   - Highlight competitive advantages or improvement areas
   - Include sector-specific trends for ${userProfile?.companyIndustry || "their industry"}
   - Provide context on their ${benchmarkData?.peerComparison?.percentile || "N/A"}% percentile ranking

3. ENERGY & CARBON OPTIMIZATION TIPS (2-3 practical actions):
   - Based on their current carbon intensity and grid mix
   - Specific to ${userLocation?.country || "their location"}'s energy landscape
   - Focus on the ${currencySymbol}${savingsInUserCurrency.toLocaleString()} savings opportunity
   - Include renewable energy transition guidance
   - IMPORTANT: Always use ${currencySymbol} for currency amounts, NEVER use $ or USD

FORMAT YOUR RESPONSE AS JSON:
{
  "complianceRecommendations": ["recommendation 1", "recommendation 2", ...],
  "industryInsights": ["insight 1", "insight 2", ...],
  "energyOptimizationTips": ["tip 1", "tip 2", ...]
}

Keep each item concise (1-2 sentences), actionable, and personalized to their specific data. Avoid generic advice. Use ${currencySymbol} for all monetary amounts.`;

    const text = await aiChat({
      messages: [{ role: "user", content: dataContext + "\n\n" + prompt }],
      temperature: 0.7,
    });
    
    // Extract JSON from markdown code blocks if present
    let jsonText = text;
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    // Parse the JSON response
    let recommendations;
    try {
      recommendations = JSON.parse(jsonText);
    } catch (parseError) {
      // Fallback: try to extract JSON from the text
      const startIdx = jsonText.indexOf('{');
      const endIdx = jsonText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        recommendations = JSON.parse(jsonText.substring(startIdx, endIdx + 1));
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    // 🎓 AUTO-GENERATE COURSES based on recommendations
    if (userId) {
      try {
        const allRecommendations = [
          ...(recommendations.complianceRecommendations || []),
          ...(recommendations.industryInsights || []),
          ...(recommendations.energyOptimizationTips || [])
        ];

        const complianceGaps = complianceData?.highPriority?.map((item: any) => item.name) || [];

        console.log('🎓 Triggering auto-course generation from recommendations...');
        
        // Fire and forget - don't wait for course generation
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/learn/auto-generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            recommendations: allRecommendations,
            complianceGaps,
            trigger: 'recommendation'
          })
        }).catch(err => console.error('Auto-course generation failed:', err));
      } catch (autoGenError) {
        console.error('Failed to trigger auto-course generation:', autoGenError);
      }
    }

    return NextResponse.json({
      success: true,
      recommendations,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("AI recommendations error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate AI recommendations",
        details: error.message,
      },
      { status: 500 }
    );
  }
}