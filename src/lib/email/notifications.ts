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

export type EmailLocale = 'en' | 'el';

function normalizeLocale(locale?: string): EmailLocale {
  return locale === 'el' ? 'el' : 'en';
}

function localizedAppUrl(locale: EmailLocale): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/${locale}/app`;
}

// ---------------------------------------------------------------------------
// Copy dictionaries (EN + EL)
// ---------------------------------------------------------------------------

const MILESTONE_COPY: Record<EmailLocale, {
  subject: (name: string) => string;
  congrats: (name: string) => string;
  intro: string;
  creditsSuffix: string;
  totalPrefix: string;
  body: string;
  cta: string;
  footerRights: (year: number) => string;
  footerReason: string;
}> = {
  en: {
    subject: (m) => `🎉 New Milestone: ${m}`,
    congrats: (n) => `Congratulations, ${n}! 🎉`,
    intro: `You've achieved a new sustainability milestone!`,
    creditsSuffix: 'Credits',
    totalPrefix: 'Total Credits:',
    body: `Your commitment to sustainability is making a real difference. Keep up the great work and continue your journey toward a greener future!`,
    cta: 'View Your Dashboard',
    footerRights: (y) => `© ${y} Vuneli. All rights reserved.`,
    footerReason: `You're receiving this email because you're a valued member of our sustainability community.`,
  },
  el: {
    subject: (m) => `🎉 Νέο Ορόσημο: ${m}`,
    congrats: (n) => `Συγχαρητήρια, ${n}! 🎉`,
    intro: `Πέτυχες ένα νέο ορόσημο βιωσιμότητας!`,
    creditsSuffix: 'Credits',
    totalPrefix: 'Σύνολο Credits:',
    body: `Η δέσμευσή σου στη βιωσιμότητα κάνει πραγματική διαφορά. Συνέχισε την εξαιρετική δουλειά και το ταξίδι σου προς ένα πιο πράσινο μέλλον!`,
    cta: 'Πίνακας Ελέγχου',
    footerRights: (y) => `© ${y} Vuneli. Με επιφύλαξη κάθε δικαιώματος.`,
    footerReason: `Λαμβάνεις αυτό το email γιατί είσαι μέλος της κοινότητας βιωσιμότητάς μας.`,
  },
};

const WELCOME_COPY: Record<EmailLocale, {
  subject: string;
  title: (name: string) => string;
  intro: string;
  featuresHeading: string;
  features: string[];
  cta: string;
}> = {
  en: {
    subject: '🌿 Welcome to Vuneli',
    title: (n) => `Welcome to Vuneli, ${n}!`,
    intro: `Thank you for joining our mission to create a more sustainable future.`,
    featuresHeading: 'With Vuneli, you can:',
    features: [
      'Track your carbon footprint in real-time',
      'Get AI-powered reduction recommendations',
      'Earn green credits for sustainable actions',
      'Compete on the leaderboard with other businesses',
    ],
    cta: 'Get Started',
  },
  el: {
    subject: '🌿 Καλωσόρισες στο Vuneli',
    title: (n) => `Καλωσόρισες στο Vuneli, ${n}!`,
    intro: `Ευχαριστούμε που συμμετέχεις στην αποστολή μας για ένα πιο βιώσιμο μέλλον.`,
    featuresHeading: 'Με το Vuneli μπορείς να:',
    features: [
      'Παρακολουθείς το αποτύπωμα άνθρακά σου σε πραγματικό χρόνο',
      'Λαμβάνεις προτάσεις μείωσης με χρήση AI',
      'Κερδίζεις πράσινους πόντους για βιώσιμες δράσεις',
      'Ανταγωνίζεσαι στον πίνακα κατάταξης με άλλες επιχειρήσεις',
    ],
    cta: 'Ξεκίνα',
  },
};

// ---------------------------------------------------------------------------
// Milestone email
// ---------------------------------------------------------------------------

export interface MilestoneEmailData {
  userEmail: string;
  userName: string;
  milestoneName: string;
  creditsEarned: number;
  totalCredits: number;
  locale?: string;
}

export async function sendMilestoneEmail(data: MilestoneEmailData): Promise<boolean> {
  if (!transporter) {
    console.log('Email transporter not configured, skipping milestone email');
    return true;
  }

  const locale = normalizeLocale(data.locale);
  const t = MILESTONE_COPY[locale];
  const lang = locale === 'el' ? 'el' : 'en';

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${lang}">
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f5; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .logo { font-size: 28px; font-weight: bold; color: #22c55e; text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #1a1a1a; margin-bottom: 20px; }
            .content { color: #4a5568; line-height: 1.6; margin-bottom: 30px; }
            .milestone-card { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px; padding: 24px; color: white; text-align: center; margin: 20px 0; }
            .milestone-title { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
            .credits { font-size: 36px; font-weight: bold; margin: 10px 0; }
            .button { display: inline-block; background: #22c55e; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
            .footer { text-align: center; color: #9ca3af; font-size: 14px; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🌿 Vuneli</div>
            <div class="title">${t.congrats(data.userName)}</div>
            <div class="content"><p>${t.intro}</p></div>
            <div class="milestone-card">
              <div class="milestone-title">${data.milestoneName}</div>
              <div class="credits">+${data.creditsEarned} ${t.creditsSuffix}</div>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${t.totalPrefix} ${data.totalCredits}</p>
            </div>
            <div class="content">
              <p>${t.body}</p>
              <p style="text-align: center;">
                <a href="${localizedAppUrl(locale)}" class="button">${t.cta}</a>
              </p>
            </div>
            <div class="footer">
              <p>${t.footerRights(new Date().getFullYear())}</p>
              <p>${t.footerReason}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Vuneli" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: data.userEmail,
      subject: t.subject(data.milestoneName),
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('Failed to send milestone email:', error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Welcome email
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  locale?: string,
): Promise<boolean> {
  if (!transporter) {
    console.log('Email transporter not configured, skipping welcome email');
    return true;
  }

  const loc = normalizeLocale(locale);
  const t = WELCOME_COPY[loc];
  const lang = loc === 'el' ? 'el' : 'en';

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${lang}">
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f5; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .logo { font-size: 28px; font-weight: bold; color: #22c55e; text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #1a1a1a; margin-bottom: 20px; }
            .content { color: #4a5568; line-height: 1.6; }
            .button { display: inline-block; background: #22c55e; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🌿 Vuneli</div>
            <div class="title">${t.title(userName)}</div>
            <div class="content">
              <p>${t.intro}</p>
              <p>${t.featuresHeading}</p>
              <ul>
                ${t.features.map((f) => `<li>${f}</li>`).join('\n                ')}
              </ul>
              <p style="text-align: center;">
                <a href="${localizedAppUrl(loc)}" class="button">${t.cta}</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Vuneli" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: userEmail,
      subject: t.subject,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}
