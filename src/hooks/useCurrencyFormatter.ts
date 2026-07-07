import { useMemo } from "react";

interface FormatOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  currencyDisplay?: "symbol" | "narrowSymbol" | "code" | "name";
}

export function useCurrencyFormatter(
  currency: string,
  options: FormatOptions = {}
) {
  return useMemo(() => {
    const {
      locale = "en-US",
      minimumFractionDigits = 0,
      maximumFractionDigits = 2,
      currencyDisplay = "symbol",
    } = options;

    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency.toUpperCase(),
        minimumFractionDigits,
        maximumFractionDigits,
        currencyDisplay,
      });
    } catch (error) {
      console.error("Currency formatter error:", error);
      // Fallback formatter
      return new Intl.NumberFormat(locale, {
        style: "decimal",
        minimumFractionDigits,
        maximumFractionDigits,
      });
    }
  }, [currency, options.locale, options.minimumFractionDigits, options.maximumFractionDigits, options.currencyDisplay]);
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = "en-US"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error("Currency format error:", error);
    return `${currency} ${amount.toFixed(2)}`;
  }
}
