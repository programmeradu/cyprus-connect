/**
 * One outbound email. Uses Resend over HTTPS when RESEND_API_KEY is set (works
 * on Cloudflare Workers). Falls back to SMTP only where sockets exist (local
 * development). Throws with a plain reason when nothing is configured, so an
 * approved send is never reported as done when it did not leave.
 */

export interface OutboundEmail {
  to: string;
  subject: string;
  text: string;
  replyTo?: string | null;
}

export interface SendResult {
  provider: "resend" | "smtp";
  id: string | null;
}

export async function sendEmail(mail: OutboundEmail): Promise<SendResult> {
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM;
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    if (!from) throw new Error("EMAIL_FROM is not set, so the email has no sender address.");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${resendKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) throw new Error(`The email service refused the message: ${body.message ?? res.status}.`);
    return { provider: "resend", id: body.id ?? null };
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nodemailer = (await import("nodemailer")).default;
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    const info = await t.sendMail({
      from: `"Vuneli" <${from || process.env.SMTP_USER}>`,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      replyTo: mail.replyTo || undefined,
    });
    return { provider: "smtp", id: info.messageId ?? null };
  }
  throw new Error("Email sending is not set up yet (RESEND_API_KEY and EMAIL_FROM). Nothing was sent.");
}
