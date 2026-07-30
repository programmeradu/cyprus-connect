/**
 * QA back door for the /app console.
 *
 * This exists so an agent or a developer can open the console in the preview
 * sandbox without a real sign-in. It is deliberately narrow:
 *
 *  - It is OFF in production builds. `NODE_ENV === "production"` disables it
 *    unconditionally, so the published site keeps its normal auth gate.
 *  - Outside production it needs the cookie `vq_qa` (or the header
 *    `x-vq-qa`) to hold the token. The token is `QA_BYPASS_TOKEN` when that
 *    env var is set, otherwise the local default below.
 *  - It never signs in a real account. It resolves a synthetic QA identity
 *    with its own workspace, so no customer data is read or written.
 *
 * Open `/api/qa/enter` in the preview to set the cookie, and
 * `/api/qa/enter?leave=1` to drop it again.
 */

export const QA_COOKIE = "vq_qa";
export const QA_HEADER = "x-vq-qa";

/** Used only when QA_BYPASS_TOKEN is unset and the build is not production. */
const LOCAL_TOKEN = "vuneli-preview-qa";

export const QA_ACCOUNT = {
  id: "qa_console_agent",
  name: "QA Agent",
  email: "qa@vuneli.local",
} as const;

export function qaBypassEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function qaToken(): string {
  return process.env.QA_BYPASS_TOKEN || LOCAL_TOKEN;
}

/** True when this request carries a valid QA token and the build allows it. */
export function isQaRequest(input: {
  cookie?: string | null;
  header?: string | null;
}): boolean {
  if (!qaBypassEnabled()) return false;
  const token = qaToken();
  return input.cookie === token || input.header === token;
}

/** Non-httpOnly marker so client code can tell it is in QA mode. */
export const QA_UI_COOKIE = "vq_qa_ui";

export function isQaClient(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((part) => part.trim() === `${QA_UI_COOKIE}=1`);
}
