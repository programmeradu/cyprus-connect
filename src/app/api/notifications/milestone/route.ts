import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendMilestoneEmail } from '@/lib/email/notifications';
import { readJson } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger('notifications.milestone');

const bodySchema = z.object({
  userEmail: z.string().trim().email().max(320),
  userName: z.string().trim().min(1).max(200),
  milestoneName: z.string().trim().min(1).max(200),
  creditsEarned: z.number().finite().min(0).max(1_000_000).optional(),
  totalCredits: z.number().finite().min(0).max(1_000_000).optional(),
  locale: z.string().trim().min(2).max(20).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const result = await readJson(request, bodySchema);
    if (!result.ok) return result.response;
    const { userEmail, userName, milestoneName, creditsEarned, totalCredits, locale } = result.data;

    const success = await sendMilestoneEmail({
      userEmail,
      userName,
      milestoneName,
      creditsEarned: creditsEarned || 0,
      totalCredits: totalCredits || 0,
      locale,
    });

    if (!success) {
      const ref = log.error('Failed to send milestone email');
      return NextResponse.json(
        { error: 'Failed to send email.', ref },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Milestone email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    const ref = log.error('Milestone email error', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.', ref },
      { status: 500 }
    );
  }
}
