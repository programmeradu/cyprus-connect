import axios from 'axios';

if (!process.env.AUTUMN_SECRET_KEY) {
  throw new Error('Missing AUTUMN_SECRET_KEY environment variable');
}

const AUTUMN_API_BASE = process.env.AUTUMN_API_BASE || 'https://api.autumnpay.io/v1';
const AUTUMN_API_KEY = process.env.AUTUMN_SECRET_KEY;

const autumnApi = axios.create({
  baseURL: AUTUMN_API_BASE,
  headers: {
    'Authorization': `Bearer ${AUTUMN_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export interface AutumnSubscriptionData {
  customerId: string;
  planId: string;
  planName: string;
  aiCreditsBalance: number;
  aiCreditsIncluded: number;
  status: string;
  currentPeriodEnd?: string;
  subscriptionId?: string;
}

export async function getAutumnSubscriptionData(userId: string): Promise<AutumnSubscriptionData | null> {
  try {
    const customerResponse = await autumnApi.get(`/customers/${userId}`);
    const customer = customerResponse.data;
    
    if (!customer) {
      return {
        customerId: userId,
        planId: 'free',
        planName: 'Free',
        aiCreditsBalance: 50,
        aiCreditsIncluded: 50,
        status: 'active',
      };
    }

    let aiCreditsBalance = 0;
    try {
      const balanceResponse = await autumnApi.get(`/features/${userId}/ai_credits/balance`);
      aiCreditsBalance = balanceResponse.data.balance || 0;
    } catch (error) {
      console.error('Failed to fetch AI credits balance:', error);
    }
    
    const currentPlan = customer.product_id || 'free';
    
    let planName = 'Free';
    let aiCreditsIncluded = 50;
    
    if (currentPlan === 'professional') {
      planName = 'Professional';
      aiCreditsIncluded = 500;
    } else if (currentPlan === 'enterprise') {
      planName = 'Enterprise';
      aiCreditsIncluded = -1;
    }

    const subscriptionData = customer.subscriptions?.[0];

    return {
      customerId: userId,
      planId: currentPlan,
      planName,
      aiCreditsBalance,
      aiCreditsIncluded,
      status: subscriptionData?.status || 'active',
      currentPeriodEnd: subscriptionData?.current_period_end,
      subscriptionId: subscriptionData?.id,
    };
  } catch (error) {
    console.error('Failed to fetch Autumn subscription data:', error);
    return null;
  }
}
