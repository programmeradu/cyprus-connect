"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useSubscription } from "@/hooks/useSubscription";
import { useSession } from "@/lib/auth-client";
import { CreditPurchaseDialog } from "./CreditPurchaseDialog";
import { CreditBalance } from "./UsageMeter";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";

interface InvoiceItem {
  id: string;
  number: string | null;
  createdAt: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  hostedUrl: string | null;
  pdfUrl: string | null;
  dueDate: string | null;
}

interface BillingData {
  paymentsOn: boolean;
  subscription: {
    status: string;
    planId: string;
    planName: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    collectionMethod: string;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
  } | null;
  hasBillingAccount: boolean;
  invoices: InvoiceItem[];
  invoicesError: boolean;
  purchases: { credits: number };
}

export const BillingDashboard = () => {
  const { data: session, isPending: isSessionPending } = useSession();
  const { subscription, plan, isLoading, refetch } = useSubscription();
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loadingBillingData, setLoadingBillingData] = useState(true);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [managingBilling, setManagingBilling] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const t = useTranslations("billing.dashboard");
  const tPlanNames = useTranslations("billing.pricingTable.planNames");
  const tFeatures = useTranslations("billing.pricingTable.features");
  const locale = useLocale();

  // Fetch credit balance
  useEffect(() => {
    if (!isSessionPending && session?.user?.id) {
      fetchCreditBalance();
    }
  }, [session, isSessionPending]);

  const fetchCreditBalance = async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoadingCredits(true);
      const token = localStorage.getItem('bearer_token');
      
      // (Autumn sync removed - credits are the single source of truth in our DB, updated by the Stripe webhook.)


      // Fetch synced credit balance from database
      const response = await fetch(`/api/users/${session.user.id}/credits`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCreditBalance(data.aiCreditsRemaining || 0);
      }
    } catch (error) {
      console.error('Failed to fetch credit balance:', error);
    } finally {
      setLoadingCredits(false);
    }
  };

  useEffect(() => {
    if (!isSessionPending && session?.user) {
      fetchCompleteBillingData();
    } else {
      setLoadingBillingData(false);
    }
  }, [session, isSessionPending]);

  const fetchCompleteBillingData = async () => {
    if (!session?.user) {
      setLoadingBillingData(false);
      return;
    }

    try {
      const token = localStorage.getItem('bearer_token');
      
      // Fetch all billing data from unified endpoint
      const response = await fetch('/api/billing/complete', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBillingData(data);
      } else {
        console.error('Failed to fetch billing data:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoadingBillingData(false);
    }
  };

  const handleManageBilling = async () => {
    if (!session?.user) {
      toast.error(t("signInToManage"));
      return;
    }

    try {
      setManagingBilling(true);
      const token = localStorage.getItem('bearer_token');

      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ locale: locale === 'el' ? 'el' : 'en' }),
      });

      if (!response.ok) {
        throw new Error(t("portalFailed"));
      }

      const { url } = await response.json();
      
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url } }, "*");
      } else {
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Billing portal error:', error);
      toast.error(t("portalFailed"));
    } finally {
      setManagingBilling(false);
    }
  };

  if (isLoading || isSessionPending || loadingBillingData) {
    return (
      <div className="space-y-4">
        <div className="vck-card p-4 animate-pulse">
          <div className="h-6 bg-muted rounded w-32 mb-3" />
          <div className="h-3 bg-muted rounded w-full mb-1.5" />
          <div className="h-3 bg-muted rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="space-y-4">
        <div className="vck-card p-4 text-center">
          <p className="text-muted-foreground text-sm">{t("signInRequired")}</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const sub = billingData?.subscription ?? null;
  const planId = sub?.planId ?? plan.id;
  const planLabel = planId === 'free' || planId === 'pro' || planId === 'enterprise' ? tPlanNames(planId) : plan.name;
  const features = tFeatures.raw(planId === 'pro' || planId === 'enterprise' ? planId : 'free') as string[];
  const invoices = billingData?.invoices ?? [];
  const struggling = sub && (sub.status === 'past_due' || sub.status === 'unpaid');
  const openInvoice = invoices.find((i) => i.status === 'open');

  const invoiceStatus = (i: InvoiceItem) => {
    if (i.status === 'paid') return { label: t('invoice.paid'), cls: 'text-primary' };
    if (i.status === 'open') {
      const overdue = i.dueDate && new Date(i.dueDate) < new Date();
      return overdue ? { label: t('invoice.overdue'), cls: 'text-destructive' } : { label: t('invoice.open'), cls: 'text-foreground' };
    }
    if (i.status === 'void') return { label: t('invoice.void'), cls: 'text-muted-foreground' };
    return { label: t('invoice.uncollectible'), cls: 'text-destructive' };
  };

  return (
    <div className="space-y-4">
      {struggling && (
        <div role="alert" className="vck-card border-destructive/40 p-4">
          <p className="text-sm font-semibold">{t('pastDueTitle')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('pastDueBody')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {openInvoice?.hostedUrl && (
              <a href={openInvoice.hostedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground">
                {t('payNow')}
              </a>
            )}
            <PremiumButton variant="outline" size="sm" className="text-xs" onClick={handleManageBilling} disabled={managingBilling}>
              {t('updatePayment')}
            </PremiumButton>
          </div>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {loadingCredits ? (
          <div className="vck-card p-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-32 mb-3" />
            <div className="h-8 bg-muted rounded w-20" />
          </div>
        ) : (
          <CreditBalance balance={creditBalance} monthlyAllocation={plan.limits.aiCredits} onPurchaseClick={() => setShowCreditDialog(true)} />
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="vck-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">{t('currentPlan')}</h3>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-xl font-bold text-primary">{planLabel}</span>
                {sub && sub.price > 0 && (
                  <span className="text-muted-foreground text-xs">
                    {formatAmount(sub.price * 100, 'eur')} / {t(`intervals.${sub.interval}`)}
                  </span>
                )}
              </div>
              {sub?.collectionMethod === 'send_invoice' && (
                <p className="mt-1 text-xs text-muted-foreground">{t('paidByInvoice')}</p>
              )}
            </div>
            {billingData?.hasBillingAccount && (
              <PremiumButton variant="outline" size="sm" className="text-xs py-1 h-auto" onClick={handleManageBilling} disabled={managingBilling}>
                {managingBilling ? t('loading') : t('manage')}
              </PremiumButton>
            )}
          </div>

          {sub?.currentPeriodEnd && (
            <p className="mb-3 text-xs text-muted-foreground">
              {sub.cancelAtPeriodEnd ? (
                <span className="text-destructive font-medium">{t('cancelsOn', { date: formatDate(sub.currentPeriodEnd) })}</span>
              ) : (
                t('renewsOn', { date: formatDate(sub.currentPeriodEnd) })
              )}
            </p>
          )}

          <ul className="grid md:grid-cols-2 gap-2">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-xs">
                <svg aria-hidden className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="vck-card p-4">
          <h3 className="text-sm font-medium mb-1">{t('invoicesTitle')}</h3>
          <p className="mb-3 text-xs text-muted-foreground">{t('invoicesHint')}</p>
          {billingData?.invoicesError ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t('invoicesUnavailable')}</p>
          ) : invoices.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t('noInvoices')}</p>
          ) : (
            <ul>
              {invoices.slice(0, 24).map((inv) => {
                const st = invoiceStatus(inv);
                return (
                  <li key={inv.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 py-3 border-b border-[var(--vc-rule-soft)] last:border-b-0">
                    <div className="min-w-0 flex-1 basis-48">
                      <div className="text-xs font-medium break-words">{inv.description}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatDate(inv.createdAt)}
                        {inv.number ? ` · ${inv.number}` : ''}
                        {inv.status === 'open' && inv.dueDate ? ` · ${t('invoice.due', { date: formatDate(inv.dueDate) })}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-semibold tabular-nums">{formatAmount(inv.amount, inv.currency)}</div>
                        <div className={`text-[11px] ${st.cls}`}>{st.label}</div>
                      </div>
                      {inv.status === 'open' && inv.hostedUrl ? (
                        <a href={inv.hostedUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold underline underline-offset-2">{t('payNow')}</a>
                      ) : inv.pdfUrl ? (
                        <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold underline underline-offset-2" aria-label={t('invoice.downloadAria', { number: inv.number ?? inv.id })}>PDF</a>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.div>

      {/* Credit Purchase Dialog */}
      <CreditPurchaseDialog open={showCreditDialog} onOpenChange={setShowCreditDialog} />
    </div>
  );
};