import { NextRequest, NextResponse } from 'next/server';
import { sendMilestoneEmail } from '@/lib/email/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, userName, milestoneName, creditsEarned, totalCredits, locale } = body;

    if (!userEmail || !userName || !milestoneName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const success = await sendMilestoneEmail({
      userEmail,
      userName,
      milestoneName,
      creditsEarned: creditsEarned || 0,
      totalCredits: totalCredits || 0,
      locale,
    });


    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Milestone email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Milestone email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
