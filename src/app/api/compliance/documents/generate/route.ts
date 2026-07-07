import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { complianceDocuments, complianceAuditLogs, emissions, user } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Get user_id from session token
    const sessionResult = await db.query.session.findFirst({
      where: (session, { eq }) => eq(session.token, token),
    });

    if (!sessionResult) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = sessionResult.userId;
    const { framework } = await req.json();

    if (!framework) {
      return NextResponse.json({ error: 'Framework is required' }, { status: 400 });
    }

    // Check AI credits allowance before processing
    const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/autumn/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        feature_id: 'ai_credits',
        required_balance: 1
      })
    });

    if (!checkResponse.ok) {
      return NextResponse.json(
        { error: "Insufficient AI credits. Please upgrade your plan or purchase more credits." },
        { status: 403 }
      );
    }

    const { allowed } = await checkResponse.json();
    if (!allowed) {
      return NextResponse.json(
        { error: "Insufficient AI credits. Please upgrade your plan or purchase more credits." },
        { status: 403 }
      );
    }

    // Get user data
    const userData = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    const userInfo = userData[0];

    // Get latest emissions data
    const emissionsData = await db.select()
      .from(emissions)
      .where(eq(emissions.userId, userId))
      .orderBy(desc(emissions.createdAt))
      .limit(6);

    // Generate AI report
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `Generate a comprehensive ${framework} compliance report for the following company:

Company Name: ${userInfo?.companyName || 'Company'}
Industry: ${userInfo?.companyIndustry || 'General'}
Team Size: ${userInfo?.teamSize || 'Not specified'}

Recent Emissions Data (last 6 months):
${emissionsData.map((e, i) => `Month ${i + 1}: ${e.totalCo2e.toFixed(2)} tons CO2e`).join('\n')}

Please generate a detailed compliance report following ${framework} standards. Include:
1. Executive Summary
2. Emissions Overview
3. Compliance Status
4. Key Findings
5. Recommendations
6. Next Steps

Format the report professionally with clear sections.`;

    const result = await model.generateContent(prompt);
    const reportContent = result.response.text();

    // Track AI credit usage after successful generation
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/autumn/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        feature_id: 'ai_credits',
        value: 1,
        idempotency_key: `compliance-report-${Date.now()}-${Math.random()}`
      })
    });

    // Determine status and due date based on framework
    const frameworkMap: Record<string, { status: string; dueDate: string; regulationId: string }> = {
      'CSRD': { status: 'draft', dueDate: '2025-12-31', regulationId: 'csrd' },
      'CDP': { status: 'ready', dueDate: '2025-07-31', regulationId: 'cdp' },
      'GHG Protocol': { status: 'ready', dueDate: '2025-06-30', regulationId: 'ghg' },
      'SEC': { status: 'draft', dueDate: '2026-03-31', regulationId: 'sec' }
    };

    const config = frameworkMap[framework] || { status: 'draft', dueDate: '2025-12-31', regulationId: 'custom' };

    // Save document
    const document = await db.insert(complianceDocuments).values({
      userId,
      regulationId: config.regulationId,
      title: `${framework} Annual Report ${new Date().getFullYear()}`,
      framework,
      status: config.status,
      content: reportContent,
      generatedAt: new Date().toISOString(),
      dueDate: config.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    // Log the action
    await db.insert(complianceAuditLogs).values({
      userId,
      action: 'Report generated',
      details: `${framework} report created`,
      createdBy: 'AI Autopilot',
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      document: document[0]
    });
  } catch (error) {
    console.error('Error generating document:', error);
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    );
  }
}