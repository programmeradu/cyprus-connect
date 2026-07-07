"use client";

import PaystackPop from '@paystack/inline-js';

interface PaystackOptions {
  key: string;
  email: string;
  amount: number;
  ref?: string;
  currency?: 'NGN' | 'GHS' | 'ZAR' | 'USD';
  channels?: ('card' | 'bank' | 'ussd' | 'qr' | 'mobile_money' | 'bank_transfer')[];
  label?: string;
  metadata?: {
    custom_fields?: Array<{
      display_name: string;
      variable_name: string;
      value: string;
    }>;
    [key: string]: unknown;
  };
  plan?: string;
  subaccount?: string;
  onSuccess: (transaction: { reference: string; trans: string; status: string; message: string }) => void;
  onCancel?: () => void;
}

export function initializePaystackPayment(options: PaystackOptions): void {
  const paystack = new PaystackPop();
  
  paystack.newTransaction({
    key: options.key,
    email: options.email,
    amount: options.amount,
    ref: options.ref,
    currency: options.currency || 'NGN',
    channels: options.channels,
    label: options.label,
    metadata: options.metadata,
    plan: options.plan,
    subaccount: options.subaccount,
    onSuccess: options.onSuccess,
    onCancel: options.onCancel || (() => {}),
  });
}

export function resumePaystackTransaction(accessCode: string): void {
  const paystack = new PaystackPop();
  paystack.resumeTransaction(accessCode);
}

export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
