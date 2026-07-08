"use client";
import { getStripeEnvironmentOrSandbox } from "@/lib/stripe/env";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useSubscription } from "@/hooks/useSubscription";
import { useSession } from "@/lib/auth-client";
import { CreditPurchaseDialog } from "./CreditPurchaseDialog";
import { CreditBalance } from "./UsageMeter";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";

interface PaymentHistoryItem {
  id: number;
  amount: number;
  currency: string;
  status: string;
  paymentType: string;
  description: string;
  createdAt: string;
  gateway?: string;
}

interface BillingData {
  subscription: {
    gateway: string;
    status: string;
    planId: string;
    planName: string;
    price: number;
    currency: string;
    interval?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  } | null;
  paymentHistory: PaymentHistoryItem[];
  purchases: {
    credits: number;
    totalSpent: number;
    lastPurchase: string | null;
  };
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
      
      // (Autumn sync removed — credits are the single source of truth in our DB, updated by the Stripe webhook.)


      // Fetch synced credit balance from database
      const response = await fetch(`/api/users/${session.user.id}/credits`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Stripe-Env': getStripeEnvironmentOrSandbox(),
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
          'X-Stripe-Env': getStripeEnvironmentOrSandbox(),
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
          'X-Stripe-Env': getStripeEnvironmentOrSandbox(),
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        throw new Error(t("portalFailed"));
      }

      const { url } = await response.json();
      
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url } }, "*");
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
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
        <PremiumCard className="p-4 animate-pulse">
          <div className="h-6 bg-muted rounded w-32 mb-3" />
          <div className="h-3 bg-muted rounded w-full mb-1.5" />
          <div className="h-3 bg-muted rounded w-3/4" />
        </PremiumCard>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="space-y-4">
        <PremiumCard className="p-4 text-center">
          <p className="text-muted-foreground text-sm">{t("signInRequired")}</p>
        </PremiumCard>
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

  const currentSubscription = billingData?.subscription || {
    gateway: 'none',
    status: 'free',
    planId: plan.id,
    planName: plan.name,
    price: plan.price,
    currency: 'USD',
  };

  const paymentHistory = billingData?.paymentHistory || [];

  return (
    <div className="space-y-4">
      {/* AI Credits Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {loadingCredits ? (
          <PremiumCard className="p-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-32 mb-3" />
            <div className="h-8 bg-muted rounded w-20" />
          </PremiumCard>
        ) : (
          <CreditBalance
            balance={creditBalance}
            monthlyAllocation={plan.limits.aiCredits}
            onPurchaseClick={() => setShowCreditDialog(true)}
          />
        )}
      </motion.div>

      {/* Current Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <PremiumCard className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("currentPlan")}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold gradient-text">
                  {(() => {
                    const pid = currentSubscription.planId;
                    if (pid === 'free' || pid === 'pro' || pid === 'enterprise') {
                      return tPlanNames(pid);
                    }
                    return currentSubscription.planName;
                  })()}
                </span>
                {currentSubscription.price > 0 && (
                  <span className="text-muted-foreground text-xs">
                    ${currentSubscription.price}/{t(`intervals.${(currentSubscription.interval as 'month' | 'year') || 'month'}`)}
                  </span>
                )}
              </div>
              {currentSubscription.gateway !== 'none' && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">{t("via")}</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted">
                    {currentSubscription.gateway === 'stripe' ? '🔵 Stripe' :
                     currentSubscription.gateway}
                  </span>
                </div>
              )}
            </div>
            {currentSubscription.status === 'active' && currentSubscription.planId !== 'free' && (
              <PremiumButton
                variant="outline"
                size="sm"
                className="text-xs py-1 h-auto"
                onClick={handleManageBilling}
                disabled={managingBilling}
              >
                {managingBilling ? t("loading") : t("manage")}
              </PremiumButton>
            )}
          </div>

          {/* Billing Period */}
          {currentSubscription.currentPeriodEnd && (
            <div className="mb-3">
              <div className="text-xs text-muted-foreground">
                {currentSubscription.cancelAtPeriodEnd ? (
                  <span className="text-destructive font-medium">
                    {t("cancelsOn", { date: formatDate(currentSubscription.currentPeriodEnd) })}
                  </span>
                ) : (
                  <>{t("renewsOn", { date: formatDate(currentSubscription.currentPeriodEnd) })}</>
                )}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-2">
            {plan.features.slice(0, 4).map((feature, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-xs">
                <svg
                  className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </PremiumCard>
      </motion.div>

      {/* Purchase Summary */}
      {billingData?.purchases && billingData.purchases.totalSpent > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PremiumCard className="p-4">
            <h3 className="text-sm font-medium mb-3">{t("purchaseSummary")}</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-xl font-bold gradient-text">
                  {billingData.purchases.credits.toLocaleString(locale)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{t("creditsPurchased")}</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold gradient-text">
                  ${(billingData.purchases.totalSpent / 100).toFixed(2)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{t("totalSpent")}</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-muted-foreground">
                  {billingData.purchases.lastPurchase ? formatDate(billingData.purchases.lastPurchase) : t("notAvailable")}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{t("lastPurchase")}</div>
              </div>
            </div>
          </PremiumCard>
        </motion.div>
      )}

      {/* Payment History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <PremiumCard className="p-4">
          <h3 className="text-sm font-medium mb-3">{t("paymentHistory")}</h3>
          
          {paymentHistory.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <div className="text-2xl mb-1">📜</div>
              <div className="text-xs">{t("noPaymentHistory")}</div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {paymentHistory.slice(0, 10).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs">
                      {payment.paymentType === 'credits' ? '💳' : '📄'}
                    </div>
                    <div>
                      <div className="font-medium text-xs">{payment.description}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        {formatDate(payment.createdAt)}
                        {payment.gateway && (
                          <>
                            <span>•</span>
                            <span className="font-medium">
                              {payment.gateway === 'stripe' ? 'Stripe' : 
                               payment.gateway === 'paystack' ? 'Paystack' :
                               payment.gateway}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-xs">
                      {formatAmount(payment.amount, payment.currency)}
                    </div>
                    <div className={`text-[10px] ${
                      payment.status === 'succeeded' ? 'text-primary' :
                      payment.status === 'failed' ? 'text-destructive' :
                      'text-muted-foreground'
                    }`}>
                      {(() => {
                        const s = payment.status as 'succeeded' | 'failed' | 'pending' | 'refunded';
                        if (s === 'succeeded' || s === 'failed' || s === 'pending' || s === 'refunded') {
                          return t(`status.${s}`);
                        }
                        return payment.status;
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PremiumCard>
      </motion.div>

      {/* Credit Purchase Dialog */}
      <CreditPurchaseDialog open={showCreditDialog} onOpenChange={setShowCreditDialog} />
    </div>
  );
};