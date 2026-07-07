"use client";

import { motion } from "framer-motion";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";


// Custom premium sparkles icon
const SparklesIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3L13.5 7.5L18 9L13.5 10.5L12 15L10.5 10.5L6 9L10.5 7.5L12 3Z" fill="currentColor" stroke="none" />
    <path d="M19 3L19.5 4.5L21 5L19.5 5.5L19 7L18.5 5.5L17 5L18.5 4.5L19 3Z" fill="currentColor" stroke="none" />
    <path d="M19 17L19.5 18.5L21 19L19.5 19.5L19 21L18.5 19.5L17 19L18.5 18.5L19 17Z" fill="currentColor" stroke="none" />
  </svg>
);

interface UsageMeterProps {
  title: string;
  used: number;
  limit: number;
  unit?: string;
  showUpgrade?: boolean;
  unlimited?: boolean;
}

export const UsageMeter = ({
  title,
  used,
  limit,
  unit = "",
  showUpgrade = true,
  unlimited = false,
}: UsageMeterProps) => {
  const percentage = unlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <PremiumCard className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium mb-1">{title}</h3>
          <div className="flex items-baseline gap-1">
            {unlimited ? (
              <span className="text-lg font-bold text-primary">Unlimited</span>
            ) : (
              <>
                <span className="text-lg font-bold">{used.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">
                  / {limit.toLocaleString()} {unit}
                </span>
              </>
            )}
          </div>
        </div>
        
        {!unlimited && isNearLimit && showUpgrade && (
          <Link href="/pricing">
            <PremiumButton variant="outline" size="sm" className="text-xs h-7 px-2">
              <TrendingUp className="w-3 h-3 mr-1" />
              Upgrade
            </PremiumButton>
          </Link>
        )}
      </div>

      {!unlimited && (
        <>
          {/* Progress Bar */}
          <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-2">
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-full ${
                isAtLimit
                  ? "bg-destructive"
                  : isNearLimit
                  ? "bg-orange-500"
                  : "bg-primary"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

          {/* Status Text */}
          <div className="flex items-center justify-between text-xs">
            <span
              className={
                isAtLimit
                  ? "text-destructive font-medium"
                  : isNearLimit
                  ? "text-orange-600 dark:text-orange-400 font-medium"
                  : "text-muted-foreground"
              }
            >
              {isAtLimit
                ? "Limit reached"
                : isNearLimit
                ? `${(100 - percentage).toFixed(0)}% remaining`
                : `${percentage.toFixed(0)}% used`}
            </span>
            
            {!isAtLimit && (
              <span className="text-muted-foreground">
                {(limit - used).toLocaleString()} {unit} left
              </span>
            )}
          </div>
        </>
      )}

      {unlimited && (
        <div className="flex items-center gap-1 text-xs text-primary">
          <SparklesIcon className="w-3 h-3" />
          <span className="font-medium">No limits on this plan</span>
        </div>
      )}
    </PremiumCard>
  );
};

interface CreditBalanceProps {
  balance: number;
  monthlyAllocation?: number;
  onPurchaseClick?: () => void;
}

export const CreditBalance = ({
  balance,
  monthlyAllocation,
  onPurchaseClick,
}: CreditBalanceProps) => {
  const isLow = balance < 10;

  return (
    <PremiumCard className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium mb-1">AI Credits</h3>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${isLow ? "text-destructive" : ""}`}>
              {balance.toLocaleString()}
            </span>
            {monthlyAllocation && (
              <span className="text-xs text-muted-foreground">
                +{monthlyAllocation.toLocaleString()}/month
              </span>
            )}
          </div>
        </div>

              {onPurchaseClick && (
                <PremiumButton
                  variant={isLow ? "primary" : "outline"}
            size="sm"
            className="text-xs h-8 px-3 flex items-center justify-center gap-1.5"
            onClick={onPurchaseClick}
          >
            <SparklesIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Buy More</span>
          </PremiumButton>
        )}
      </div>

      {isLow && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">Low credit balance</span>
        </div>
      )}

      <div className="mt-3 text-xs text-muted-foreground">
        Credits are used for AI features like recommendations, insights, and report generation
      </div>
    </PremiumCard>
  );
};