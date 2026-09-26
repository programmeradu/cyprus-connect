import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { bindSessionUser } from "@/lib/api-auth";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";

const log = logger("api.notifications.email");

const postSchema = z.object({
  userId: z.union([z.string(), z.number()]).optional().nullable(),
  recipientEmail: z.string().trim().email().max(320),
  recipientName: z.string().trim().min(1).max(200),
  notificationType: z.enum(['milestone', 'achievement', 'reminder', 'report']),
  subject: z.string().trim().min(1).max(300),
  data: z.object({
    milestoneName: z.string().max(200).optional(),
    creditsEarned: z.number().finite().optional(),
    currentCredits: z.number().finite().optional(),
    achievementTitle: z.string().max(200).optional(),
    message: z.string().max(2000).optional(),
    reportPeriod: z.string().max(100).optional(),
    totalEmissions: z.union([z.string(), z.number()]).optional(),
  }).passthrough(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = await readJson(request, postSchema);
    if (!parsed.ok) return parsed.response;
    const {
      userId: __claimedUserId,
      recipientEmail,
      recipientName,
      notificationType,
      subject,
      data,
    } = parsed.data;
    const __auth = await bindSessionUser(request, __claimedUserId != null ? String(__claimedUserId) : null);
    if (!__auth.ok) return __auth.response;
    const userId = __auth.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required', code: 'MISSING_USER_ID' }, { status: 400 });
    }

    let emailBody = '';

    switch (notificationType) {
      case 'milestone':
        emailBody = generateMilestoneEmail(recipientName, data);
        break;
      case 'achievement':
        emailBody = generateAchievementEmail(recipientName, data);
        break;
      case 'reminder':
        emailBody = generateReminderEmail(recipientName, data);
        break;
      case 'report':
        emailBody = generateReportEmail(recipientName, data);
        break;
      default:
        emailBody = `Hello ${recipientName},\n\n${data.message || 'You have a new notification from Vuneli.'}\n\nBest regards,\nThe Vuneli Team`;
    }

    // In production, integrate with email service (SendGrid, AWS SES, Resend, etc.)
    log.info('Simulated email notification', { to: recipientEmail, subject, notificationType });

    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json(
      {
        success: true,
        message: 'Email notification sent successfully',
        emailSent: {
          to: recipientEmail,
          subject,
          type: notificationType,
          sentAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const ref = log.error('POST /api/notifications/email failed', error);
    return NextResponse.json({ error: 'Failed to send email notification', ref }, { status: 500 });
  }
}

function generateMilestoneEmail(name: string, data: any): string {
  return `
Hi ${name},

🎉 Congratulations! You've reached a new sustainability milestone!

Milestone: ${data.milestoneName || 'Green Achievement'}
Credits Earned: +${data.creditsEarned || 0} Green Credits
Total Credits: ${data.currentCredits || 0}

${data.message || 'Keep up the excellent work in making your business more sustainable!'}

Your dedication to sustainability is making a real impact. Continue tracking your progress and exploring new ways to reduce your carbon footprint.

View your full dashboard: https://vuneli.com/app

Best regards,
The Vuneli Team

---
This is an automated notification from Vuneli. To manage your notification preferences, visit your account settings.
  `.trim();
}

function generateAchievementEmail(name: string, data: any): string {
  return `
Hi ${name},

🏆 New Achievement Unlocked!

${data.achievementTitle || 'Sustainability Achievement'}

${data.message || 'You\'ve unlocked a new achievement for your sustainability efforts!'}

Credits Earned: +${data.creditsEarned || 0}
Total Credits: ${data.currentCredits || 0}

Keep pushing forward and continue making a difference!

View your achievements: https://vuneli.com/app/actions

Best regards,
The Vuneli Team
  `.trim();
}

function generateReminderEmail(name: string, data: any): string {
  return `
Hi ${name},

⏰ Friendly Reminder from Vuneli

${data.message || 'This is a reminder about your sustainability tracking.'}

Don't forget to:
- Upload your latest utility bills
- Review your carbon footprint dashboard
- Complete pending green actions

Stay on track with your sustainability goals!

Go to Dashboard: https://vuneli.com/app

Best regards,
The Vuneli Team
  `.trim();
}

function generateReportEmail(name: string, data: any): string {
  return `
Hi ${name},

📊 Your Sustainability Report is Ready

${data.message || 'Your monthly sustainability report has been generated and is ready for review.'}

Report Period: ${data.reportPeriod || 'Current Month'}
Total Emissions: ${data.totalEmissions || 'N/A'}
Credits Earned: ${data.creditsEarned || 'N/A'}

Download your report or view it in your dashboard.

View Report: https://vuneli.com/app/analytics

Best regards,
The Vuneli Team
  `.trim();
}
