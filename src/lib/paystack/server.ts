const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

interface PaystackInitializeParams {
  email: string;
  amount: number;
  reference?: string;
  callback_url?: string;
  plan?: string;
  metadata?: Record<string, unknown>;
  channels?: ('card' | 'bank' | 'ussd' | 'qr' | 'mobile_money' | 'bank_transfer')[];
  currency?: 'NGN' | 'GHS' | 'ZAR' | 'USD';
}

interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

interface PaystackInitializeData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface PaystackVerifyData {
  id: number;
  domain: string;
  status: 'success' | 'failed' | 'abandoned';
  reference: string;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string | null;
  created_at: string;
  channel: string;
  currency: string;
  metadata: Record<string, unknown>;
  customer: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    customer_code: string;
    phone: string | null;
  };
  authorization: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    channel: string;
    card_type: string;
    bank: string;
    country_code: string;
    brand: string;
    reusable: boolean;
  };
}

async function paystackRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: object
): Promise<PaystackResponse<T>> {
  const response = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Paystack API error');
  }

  return response.json();
}

export async function initializeTransaction(params: PaystackInitializeParams) {
  return paystackRequest<PaystackInitializeData>('/transaction/initialize', 'POST', params);
}

export async function verifyTransaction(reference: string) {
  return paystackRequest<PaystackVerifyData>(`/transaction/verify/${reference}`);
}

export async function chargeAuthorization(params: {
  authorization_code: string;
  email: string;
  amount: number;
  reference?: string;
  metadata?: Record<string, unknown>;
}) {
  return paystackRequest<PaystackVerifyData>('/transaction/charge_authorization', 'POST', params);
}

export async function createPlan(params: {
  name: string;
  interval: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'biannually' | 'annually';
  amount: number;
  description?: string;
  currency?: string;
}) {
  return paystackRequest<{ plan_code: string }>('/plan', 'POST', params);
}

export async function createSubscription(params: {
  customer: string;
  plan: string;
  authorization?: string;
  start_date?: string;
}) {
  return paystackRequest<{
    subscription_code: string;
    email_token: string;
  }>('/subscription', 'POST', params);
}

export async function cancelSubscription(params: {
  code: string;
  token: string;
}) {
  return paystackRequest<{ status: boolean }>('/subscription/disable', 'POST', params);
}

export async function getCustomer(emailOrCode: string) {
  return paystackRequest<{
    id: number;
    email: string;
    customer_code: string;
    subscriptions: Array<{
      subscription_code: string;
      plan: { plan_code: string; name: string };
      status: string;
    }>;
  }>(`/customer/${emailOrCode}`);
}

export function generateReference(): string {
  return `verde_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
