import type { RawOpportunity } from "./types";

// Resend transactional sender for grant-alert emails.
// Requires RESEND_API_KEY. When absent, we log + skip so cron stays healthy.

const RESEND_URL = "https://api.resend.com/emails";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c] as string));
}

function renderHtml(op: RawOpportunity, reasons: string[]): string {
  const deadline = op.deadline ? `<p style="margin:8px 0;color:#4b5563"><b>Deadline:</b> ${esc(op.deadline)}</p>` : "";
  const program = op.program ? `<p style="margin:8px 0;color:#4b5563"><b>Programme:</b> ${esc(op.program)}</p>` : "";
  const src = ({
    "eu-funding-tenders": "EU Funding & Tenders Portal",
    "research-gov-cy": "Research & Innovation Foundation (Cyprus)",
    "invest-cyprus": "Invest Cyprus",
    "kebe-oeb": "OEB / KEBE",
    "accelerators": "Accelerators",
  } as Record<string, string>)[op.source] ?? op.source;

  return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;padding:24px;color:#111827">
    <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:32px">
      <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#16a34a;margin-bottom:12px">New grant match &middot; ${esc(src)}</div>
      <h1 style="font-size:22px;line-height:1.3;margin:0 0 12px;font-weight:700;color:#0f172a">${esc(op.title)}</h1>
      ${program}
      ${deadline}
      <p style="margin:16px 0;color:#374151;line-height:1.55;font-size:15px">${esc(op.summary).slice(0, 600)}</p>
      <p style="margin:24px 0 8px">
        <a href="${esc(op.url)}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">Open the call</a>
      </p>
      <p style="margin:20px 0 0;color:#6b7280;font-size:12px">Matched signals: ${esc(reasons.slice(0, 6).join(", "))}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0" />
      <p style="margin:0;color:#9ca3af;font-size:12px">VerdeIQ Grant Radar &middot; Cyprus SME sustainability funding</p>
    </div>
  </body></html>`;
}

export async function sendGrantAlertEmail(params: {
  to: string;
  op: RawOpportunity;
  reasons: string[];
}): Promise<{ sent: boolean; skipped?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, skipped: "RESEND_API_KEY not configured" };

  const from = process.env.GRANT_ALERTS_FROM || "VerdeIQ Grant Radar <alerts@verdeiq.stauniverse.tech>";
  const subject = `[Grant match] ${params.op.title}`.slice(0, 180);

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject,
        html: renderHtml(params.op, params.reasons),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { sent: false, error: `${res.status} ${body.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, error: (e as Error).message };
  }
}
