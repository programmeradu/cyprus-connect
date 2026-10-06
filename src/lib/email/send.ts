/**
 * One outbound email.
 *
 * Supports:
 * 1. Cloudflare Workers native Email Service binding (env.EMAIL)
 * 2. Resend over HTTPS when RESEND_API_KEY is configured
 * 3. SMTP fallback for local development
 *
 * Logs technical failure details internally while returning safe, user-friendly
 * error messages (never exposing internal environment variables, F81).
 */

import { logger } from "@/lib/log";

const log = logger("email/send");

export interface OutboundEmail {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string | null;
}

export interface SendResult {
  provider: "cloudflare" | "resend" | "smtp";
  id: string | null;
}

export async function sendEmail(mail: OutboundEmail): Promise<SendResult> {
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || "notifications@notify.vuneli.com";

  // 1. Cloudflare Email Service binding (Workers runtime)
  const cfEmail = (globalThis as unknown as { __CF_ENV?: { EMAIL?: { send: (msg: unknown) => Promise<{ messageId?: string }> } } })
    .__CF_ENV?.EMAIL;

  if (cfEmail && typeof cfEmail.send === "function") {
    try {
      const res = await cfEmail.send({
        to: mail.to,
        from,
        subject: mail.subject,
        text: mail.text,
        ...(mail.html ? { html: mail.html } : {}),
        ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
      });
      return { provider: "cloudflare", id: res?.messageId ?? null };
    } catch (err) {
      log.error("Cloudflare email sending failed", err);
      throw new Error("We couldn't send this email right now. Please try again later.");
    }
  }

  // 2. Resend API
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${resendKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          from,
          to: [mail.to],
          subject: mail.subject,
          text: mail.text,
          ...(mail.html ? { html: mail.html } : {}),
          ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!res.ok) {
        log.error("Resend API rejected message", { status: res.status, message: body.message });
        throw new Error("We couldn't send this email. Please try again later.");
      }
      return { provider: "resend", id: body.id ?? null };
    } catch (err) {
      log.error("Resend dispatch error", err);
      throw new Error("We couldn't send this email. Please try again later.");
    }
  }

  // 3. SMTP fallback (local dev)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = (await import("nodemailer")).default;
      const t = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      const info = await t.sendMail({
        from: `"Vuneli" <${from}>`,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        replyTo: mail.replyTo || undefined,
      });
      return { provider: "smtp", id: info.messageId ?? null };
    } catch (err) {
      log.error("SMTP sending error", err);
      throw new Error("We couldn't send this email. Please try again later.");
    }
  }

  // 4. No outbound email provider is configured
  log.warn("Outbound email requested but no provider configured (Cloudflare EMAIL binding, RESEND_API_KEY, or SMTP).", {
    recipient: mail.to,
    subject: mail.subject,
  });
  throw new Error("Outbound email sending is temporarily unavailable. Please try again later or contact support.");
}
