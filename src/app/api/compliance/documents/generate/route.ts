import { frameworkByLabel } from '@/lib/compliance/frameworks';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { complianceDocuments, complianceAuditLogs, emissions, user } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { aiChat, aiErrorMessage, hasTextAi } from '@/lib/vuneli-ai';
import { logger } from '@/lib/log';
import { checkAndDeductAiCredits } from '@/lib/ai-credits';
import { requireUserIdOrQa as requireVuneliUserId } from '@/lib/api-auth';


export async function POST(req: NextRequest) {
  try {
    const userId = await requireVuneliUserId(req.headers);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { framework } = await req.json();

    if (!framework) {
      return NextResponse.json({ error: 'Framework is required' }, { status: 400 });
    }

    if (!hasTextAi()) {
      return NextResponse.json({ error: 'Report writing is not available right now.' }, { status: 503 });
    }

    // Check + deduct AI credits (single source of truth: user.aiCreditsBalance)
    const creditGate = await checkAndDeductAiCredits(req, 1, 'compliance-doc');
    if (!creditGate.ok) {
      return NextResponse.json({ error: creditGate.error }, { status: creditGate.status });
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

    const reportContent = (await aiChat({
      messages: [
        { role: 'system', content: 'You write compliance report drafts. Use only the figures given. Where data is missing, say it is missing; never invent numbers, dates or certifications.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    })).trim();
    if (!reportContent) {
      return NextResponse.json({ error: 'No draft was produced. Please try again.' }, { status: 502 });
    }


    // Due date comes from the shared framework list; every new report starts as a draft.
    const def = frameworkByLabel(framework);
    const isVoluntaryFramework = def ? !def.legalDeadline : true;

    // For regulatory frameworks, check whether the company is in-scope or exempt (e.g. CSRD Omnibus SME threshold)
    let isApplicable = !isVoluntaryFramework;
    let applicabilityNote = '';
    if (def?.regulationId === 'csrd') {
      const emp = userInfo?.teamSize ? parseInt(userInfo.teamSize, 10) : null;
      if (emp !== null && emp <= 1000) {
        isApplicable = false;
        applicabilityNote = ' (Voluntary SME Draft)';
      }
    }

    const isVoluntaryDraft = isVoluntaryFramework || !isApplicable;
    const config = {
      status: 'draft',
      dueDate: isVoluntaryDraft ? '' : (def ? def.nextDeadline() : ''),
      regulationId: def ? def.regulationId : 'custom',
    };

    const docTitle = isVoluntaryDraft
      ? `${framework} Annual Report ${new Date().getFullYear()}${applicabilityNote || ' (Voluntary Draft)'}`
      : `${framework} Annual Report ${new Date().getFullYear()}`;

    // Save document
    const document = await db.insert(complianceDocuments).values({
      userId,
      regulationId: config.regulationId,
      title: docTitle,
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
    const ref = logger('api.compliance.generate').error('document generation failed', error);
    return NextResponse.json(
      { error: aiErrorMessage(error) || 'Failed to generate document', ref },
      { status: 500 }
    );
  }
}
