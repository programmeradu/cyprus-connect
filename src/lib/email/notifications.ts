import nodemailer from 'nodemailer';

// Safely create transporter with fallback
let transporter: nodemailer.Transporter | null = null;

try {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
} catch (error) {
  console.warn('Email transporter initialization failed:', error);
  transporter = null;
}

export interface MilestoneEmailData {
  userEmail: string;
  userName: string;
  milestoneName: string;
  creditsEarned: number;
  totalCredits: number;
}

export async function sendMilestoneEmail(data: MilestoneEmailData): Promise<boolean> {
  // Skip if transporter not available (email not configured)
  if (!transporter) {
    console.log('Email transporter not configured, skipping milestone email');
    return true; // Return true to not block the flow
  }

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background-color: #f5f5f5;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #22c55e;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #1a1a1a;
              margin-bottom: 20px;
            }
            .content {
              color: #4a5568;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .milestone-card {
              background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
              border-radius: 12px;
              padding: 24px;
              color: white;
              text-align: center;
              margin: 20px 0;
            }
            .milestone-title {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .credits {
              font-size: 36px;
              font-weight: bold;
              margin: 10px 0;
            }
            .button {
              display: inline-block;
              background: #22c55e;
              color: white;
              padding: 12px 32px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              color: #9ca3af;
              font-size: 14px;
              margin-top: 40px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🌿 VerdeIQ</div>
            </div>
            
            <div class="title">Congratulations, ${data.userName}! 🎉</div>
            
            <div class="content">
              <p>You've achieved a new sustainability milestone!</p>
            </div>
            
            <div class="milestone-card">
              <div class="milestone-title">${data.milestoneName}</div>
              <div class="credits">+${data.creditsEarned} Credits</div>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Total Credits: ${data.totalCredits}</p>
            </div>
            
            <div class="content">
              <p>Your commitment to sustainability is making a real difference. Keep up the great work and continue your journey toward a greener future!</p>
              
              <p style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app" class="button">
                  View Your Dashboard
                </a>
              </p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} VerdeIQ. All rights reserved.</p>
              <p>You're receiving this email because you're a valued member of our sustainability community.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"VerdeIQ" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: data.userEmail,
      subject: `🎉 New Milestone: ${data.milestoneName}`,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('Failed to send milestone email:', error);
    return false;
  }
}

export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
  // Skip if transporter not available (email not configured)
  if (!transporter) {
    console.log('Email transporter not configured, skipping welcome email');
    return true; // Return true to not block the flow
  }

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f5; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .logo { font-size: 28px; font-weight: bold; color: #22c55e; text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #1a1a1a; margin-bottom: 20px; }
            .content { color: #4a5568; line-height: 1.6; }
            .button { display: inline-block; background: #22c55e; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🌿 VerdeIQ</div>
            <div class="title">Welcome to VerdeIQ, ${userName}!</div>
            <div class="content">
              <p>Thank you for joining our mission to create a more sustainable future.</p>
              <p>With VerdeIQ, you can:</p>
              <ul>
                <li>Track your carbon footprint in real-time</li>
                <li>Get AI-powered reduction recommendations</li>
                <li>Earn green credits for sustainable actions</li>
                <li>Compete on the leaderboard with other businesses</li>
              </ul>
              <p style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app" class="button">
                  Get Started
                </a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"VerdeIQ" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: userEmail,
      subject: '🌿 Welcome to VerdeIQ',
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}