"use client";

import { useCurrency } from "@/contexts/CurrencyContext";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

interface CurrencyDisplayProps {
  amount: number;
  fromCurrency?: string;
  locale?: string;
  className?: string;
  showOriginal?: boolean;
}

export function CurrencyDisplay({ 
  amount, 
  fromCurrency = "USD",
  locale = "en-US",
  className = "",
  showOriginal = false
}: CurrencyDisplayProps) {
  const { selectedCurrency, convertAmount, isLoading } = useCurrency();
  const formatter = useCurrencyFormatter(selectedCurrency, { locale });
  const originalFormatter = useCurrencyFormatter(fromCurrency, { locale });

  if (isLoading) {
    return <span className={className}>Loading...</span>;
  }

  const convertedAmount = convertAmount(amount, fromCurrency);
  const displayAmount = formatter.format(convertedAmount);

  if (showOriginal && fromCurrency !== selectedCurrency) {
    return (
      <span className={className}>
        {displayAmount}
        <span className="text-xs text-muted-foreground ml-1">
          ({originalFormatter.format(amount)})
        </span>
      </span>
    );
  }

  return <span className={className}>{displayAmount}</span>;
}
