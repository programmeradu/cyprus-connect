"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  el: "el-GR",
};

export function resolveIntlLocale(locale: string | undefined): string {
  if (!locale) return "en-US";
  return LOCALE_MAP[locale] || locale;
}

interface FormatOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  currencyDisplay?: "symbol" | "narrowSymbol" | "code" | "name";
}

/**
 * Locale-aware currency formatter.
 * - EL: "1.234,56 €"
 * - EN: "$1,234.56"
 */
export function useCurrencyFormatter(
  currency: string,
  options: FormatOptions = {}
) {
  const activeLocale = useLocale();
  const intlLocale = options.locale
    ? resolveIntlLocale(options.locale)
    : resolveIntlLocale(activeLocale);

  return useMemo(() => {
    const {
      minimumFractionDigits = 0,
      maximumFractionDigits = 2,
      currencyDisplay = "symbol",
    } = options;

    try {
      return new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency: currency.toUpperCase(),
        minimumFractionDigits,
        maximumFractionDigits,
        currencyDisplay,
      });
    } catch (error) {
      console.error("Currency formatter error:", error);
      return new Intl.NumberFormat(intlLocale, {
        style: "decimal",
        minimumFractionDigits,
        maximumFractionDigits,
      });
    }
  }, [
    currency,
    intlLocale,
    options.minimumFractionDigits,
    options.maximumFractionDigits,
    options.currencyDisplay,
  ]);
}

/**
 * Locale-aware number formatter.
 * - EL: "1.234,56"
 * - EN: "1,234.56"
 */
export function useNumberFormatter(options: Intl.NumberFormatOptions = {}) {
  const activeLocale = useLocale();
  const intlLocale = resolveIntlLocale(activeLocale);
  return useMemo(
    () => new Intl.NumberFormat(intlLocale, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intlLocale, JSON.stringify(options)]
  );
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = "en-US"
): string {
  const intlLocale = resolveIntlLocale(locale);
  try {
    return new Intl.NumberFormat(intlLocale, {
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

export function formatNumber(
  value: number,
  locale: string = "en-US",
  options: Intl.NumberFormatOptions = {}
): string {
  const intlLocale = resolveIntlLocale(locale);
  try {
    return new Intl.NumberFormat(intlLocale, options).format(value);
  } catch {
    return value.toString();
  }
}
