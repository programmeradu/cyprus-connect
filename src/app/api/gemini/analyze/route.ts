import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { checkAndDeductAiCredits } from '@/lib/ai-credits';

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

    const token = authHeader.split(' ')[1];

    // Check + deduct AI credits (single source of truth: user.aiCreditsBalance)
    const creditGate = await checkAndDeductAiCredits(req, 1, 'gemini');
    if (!creditGate.ok) {
      return NextResponse.json({ error: creditGate.error }, { status: creditGate.status });
    }
    
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }
    
    const client = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GEMINI_API_KEY,
    });
    
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

      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: reportPrompt }],
          },
        ],
      });
      
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      
      
      return NextResponse.json({ text });
    }
    
    // Handle generic prompt format
    const { prompt, context } = body;
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
    
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }],
        },
      ],
    });
    
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    
    
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate content" },
      { status: 500 }
    );
  }
}