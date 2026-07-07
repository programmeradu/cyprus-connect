import { NextRequest, NextResponse } from 'next/server';

interface EmailNotificationRequest {
  userId: number;
  recipientEmail: string;
  recipientName: string;
  notificationType: 'milestone' | 'achievement' | 'reminder' | 'report';
  subject: string;
  data: {
    milestoneName?: string;
    creditsEarned?: number;
    currentCredits?: number;
    achievementTitle?: string;
    message?: string;
    [key: string]: any;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailNotificationRequest = await request.json();
    const {
      userId,
      recipientEmail,
      recipientName,
      notificationType,
      subject,
      data,
    } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient email is required', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    if (!notificationType) {
      return NextResponse.json(
        { error: 'Notification type is required', code: 'MISSING_TYPE' },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject is required', code: 'MISSING_SUBJECT' },
        { status: 400 }
      );
    }

    // Generate email content based on notification type
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
        emailBody = `Hello ${recipientName},\n\n${data.message || 'You have a new notification from VerdeIQ.'}\n\nBest regards,\nThe VerdeIQ Team`;
    }

    // In production, integrate with email service (SendGrid, AWS SES, Resend, etc.)
    // For now, simulate email sending
    console.log('=== EMAIL NOTIFICATION ===');
    console.log('To:', recipientEmail);
    console.log('Subject:', subject);
    console.log('Body:', emailBody);
    console.log('========================');

    // Simulate email sending delay
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
    console.error('Email notification error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send email notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
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

View your full dashboard: https://verdeiq.com/app

Best regards,
The VerdeIQ Team

---
This is an automated notification from VerdeIQ. To manage your notification preferences, visit your account settings.
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

View your achievements: https://verdeiq.com/app/actions

Best regards,
The VerdeIQ Team
  `.trim();
}

function generateReminderEmail(name: string, data: any): string {
  return `
Hi ${name},

⏰ Friendly Reminder from VerdeIQ

${data.message || 'This is a reminder about your sustainability tracking.'}

Don't forget to:
- Upload your latest utility bills
- Review your carbon footprint dashboard
- Complete pending green actions

Stay on track with your sustainability goals!

Go to Dashboard: https://verdeiq.com/app

Best regards,
The VerdeIQ Team
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

View Report: https://verdeiq.com/app/analytics

Best regards,
The VerdeIQ Team
  `.trim();
}
