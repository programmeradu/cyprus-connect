/**
 * Bank of Cyprus account information (PSD2, read-only).
 *
 * Flow, from the bank's own guide (developer.bankofcyprus.com, "How to test
 * our APIs"):
 *   1. app token (client credentials)            -> POST /oauth2/token
 *   2. create a read-only subscription           -> POST /v1/subscriptions
 *   3. the customer signs in at the bank and picks accounts -> /oauth2/authorize
 *   4. swap the returned code for a user token   -> POST /oauth2/token
 *   5. read the approved subscription and activate it -> GET + PATCH /v1/subscriptions/{id}
 *   6. read accounts and statements with the app token + subscription id
 *
 * Nothing here can move money: payments are requested with a zero limit.
 * No customer password or user token is stored; only the subscription id.
 */

import { formatBocDate } from "./categorize";

export type BocEnvironment = "sandbox" | "production";

const BASES: Record<BocEnvironment, string> = {
  sandbox: "https://sandbox-apis.bankofcyprus.com/df-boc-org-sb/sb/psd2",
  production: "https://apis.bankofcyprus.com/df-boc-org-prd/prod/psd2",
};

export class BocError extends Error {
  constructor(message: string, readonly status: number, readonly step: string) {
    super(message);
  }
}

export interface BocConfig {
  clientId: string;
  clientSecret: string;
  environment: BocEnvironment;
  base: string;
}

/** Reads the keys inside the request, never at module load. Null = not set up. */
export function bocConfig(): BocConfig | null {
  const clientId = process.env.BOC_CLIENT_ID;
  const clientSecret = process.env.BOC_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const environment: BocEnvironment = process.env.BOC_ENVIRONMENT === "production" ? "production" : "sandbox";
  return { clientId, clientSecret, environment, base: BASES[environment] };
}

const READ_ONLY = {
  accounts: { transactionHistory: true, balance: true, details: true, checkFundsAvailability: false },
  payments: { limit: 0, currency: "EUR", amount: 0 },
};

function journeyHeaders(): Record<string, string> {
  return { journeyId: crypto.randomUUID(), timeStamp: String(Math.floor(Date.now() / 1000)) };
}

async function call<T>(step: string, url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
  const text = await res.text();
  if (!res.ok) {
    // The bank's body names the failure; keep it short and never include our keys.
    throw new BocError(`${step} ${res.status}: ${text.slice(0, 300)}`, res.status, step);
  }
  try {
    return (text ? JSON.parse(text) : {}) as T;
  } catch {
    throw new BocError(`${step}: bank answered with something that is not JSON`, 502, step);
  }
}

async function token(cfg: BocConfig, form: Record<string, string>, step: string): Promise<string> {
  const body = new URLSearchParams({ client_id: cfg.clientId, client_secret: cfg.clientSecret, ...form });
  const data = await call<{ access_token?: string }>(step, `${cfg.base}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  if (!data.access_token) throw new BocError(`${step}: no token in the answer`, 502, step);
  return data.access_token;
}

// App tokens last an hour; keep one per isolate and renew a minute early.
let cached: { key: string; token: string; until: number } | null = null;

export async function appToken(cfg: BocConfig): Promise<string> {
  const key = `${cfg.environment}:${cfg.clientId}`;
  if (cached && cached.key === key && cached.until > Date.now()) return cached.token;
  const t = await token(cfg, { grant_type: "client_credentials", scope: "TPPOAuth2Security" }, "app token");
  cached = { key, token: t, until: Date.now() + 55 * 60_000 };
  return t;
}

export function authorizeUrl(cfg: BocConfig, subscriptionId: string, redirectUri: string): string {
  const q = new URLSearchParams({
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "UserOAuth2Security",
    client_id: cfg.clientId,
    subscriptionid: subscriptionId,
  });
  return `${cfg.base}/oauth2/authorize?${q.toString()}`;
}

export async function createSubscription(cfg: BocConfig): Promise<{ subscriptionId: string; endDate: string | null }> {
  const t = await appToken(cfg);
  const data = await call<{ subscriptionId?: string; duration?: { endDate?: string } }>("create subscription", `${cfg.base}/v1/subscriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json", ...journeyHeaders() },
    body: JSON.stringify(READ_ONLY),
  });
  if (!data.subscriptionId) throw new BocError("create subscription: no id in the answer", 502, "create subscription");
  return { subscriptionId: data.subscriptionId, endDate: data.duration?.endDate ?? null };
}

interface SubscriptionBody {
  accounts?: Record<string, unknown>;
  payments?: Record<string, unknown>;
  selectedAccounts?: { accountId?: string }[];
  status?: string;
  duration?: { endDate?: string };
  expirationDate?: string;
}

/** Steps 4-5: the customer came back from the bank with a code. */
export async function activateSubscription(
  cfg: BocConfig,
  subscriptionId: string,
  code: string,
): Promise<{ accountIds: string[]; endDate: string | null; status: string }> {
  const userToken = await token(cfg, { grant_type: "authorization_code", code, scope: "UserOAuth2Security" }, "user token");
  const headers = { Authorization: `Bearer ${userToken}`, "Content-Type": "application/json" };
  const url = `${cfg.base}/v1/subscriptions/${encodeURIComponent(subscriptionId)}`;
  const got = await call<SubscriptionBody | SubscriptionBody[]>("read subscription", url, { headers: { ...headers, ...journeyHeaders() } });
  const approved = Array.isArray(got) ? got[0] : got;
  // Activate exactly what the customer approved, but never widen payments beyond zero.
  const patched = await call<SubscriptionBody>("activate subscription", url, {
    method: "PATCH",
    headers: { ...headers, ...journeyHeaders() },
    body: JSON.stringify({ accounts: approved?.accounts ?? READ_ONLY.accounts, payments: READ_ONLY.payments }),
  });
  const accountIds = (patched.selectedAccounts ?? approved?.selectedAccounts ?? [])
    .map((a) => a.accountId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  return {
    accountIds: [...new Set(accountIds)],
    endDate: patched.duration?.endDate ?? approved?.expirationDate ?? null,
    status: patched.status ?? "ACTV",
  };
}

export interface BocTransaction {
  id?: string;
  dcInd?: string;
  transactionAmount?: { amount?: number | string; currency?: string };
  description?: string;
  postingDate?: string;
  valueDate?: string;
}

export async function statement(
  cfg: BocConfig,
  subscriptionId: string,
  accountId: string,
  from: Date,
  to: Date,
): Promise<BocTransaction[]> {
  const t = await appToken(cfg);
  const q = new URLSearchParams({ startDate: formatBocDate(from), endDate: formatBocDate(to), maxCount: "500" });
  const data = await call<{ transaction?: BocTransaction[] }>(
    "statement",
    `${cfg.base}/v1/accounts/${encodeURIComponent(accountId)}/statement?${q.toString()}`,
    { headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json", subscriptionId, ...journeyHeaders() } },
  );
  return Array.isArray(data.transaction) ? data.transaction : [];
}
