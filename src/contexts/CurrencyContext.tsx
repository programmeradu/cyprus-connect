"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type { ExchangeRates } from "@/lib/exchange-rates";
import { useSession } from "@/lib/auth-client";

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  el: "el-GR",
};

function useIntlLocale(): string {
  const pathname = usePathname() || "";
  const seg = pathname.split("/")[1];
  return LOCALE_MAP[seg] || "en-US";
}


interface CurrencyContextType {
  selectedCurrency: string;
  userCurrency: string;
  exchangeRates: ExchangeRates | null;
  isLoading: boolean;
  setCurrency: (currency: string) => void;
  convertAmount: (amount: number, fromCurrency?: string) => number;
  formatAmount: (amount: number, currency?: string) => string;
  refreshTrigger: number;
  refreshCurrency: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [userCurrency, setUserCurrency] = useState<string>("");
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { data: session } = useSession();
  const intlLocale = useIntlLocale();


  // Load currency from user preferences
  const loadCurrencyFromDatabase = useCallback(async () => {
    if (!session?.user?.id) return null;
    
    try {
      const token = localStorage.getItem("bearer_token");
      if (!token) return null;

      const response = await fetch(`/api/users/${session.user.id}/preferences`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.preferredCurrency;
      }
    } catch (error) {
      console.error("Failed to load currency from database:", error);
    }
    return null;
  }, [session?.user?.id]);

  // Initialize currency from user preferences or auto-detect
  const initializeCurrency = useCallback(async () => {
    setIsLoading(true);
    try {
      // Priority 1: User's saved preference from database
      const savedCurrency = await loadCurrencyFromDatabase();
      if (savedCurrency) {
        setSelectedCurrency(savedCurrency);
        setUserCurrency(savedCurrency);
        setIsLoading(false);
        return;
      }

      // Priority 2: Detect from IP geolocation
      const geoResponse = await fetch("/api/geolocation");
      if (geoResponse.ok) {
        const data = await geoResponse.json();
        // EU/EEA + UK: force EUR (or the country's local currency where relevant).
        // For Cyprus specifically the currency IS EUR, but we also override for
        // countries whose ipapi response might return a non-EUR currency in error.
        const EU_EUR = new Set([
          "AT","BE","CY","EE","FI","FR","DE","GR","IE","IT","LV","LT","LU",
          "MT","NL","PT","SK","SI","ES",
        ]);
        const detected = EU_EUR.has(data.countryCode) ? "EUR" : data.currency;
        if (detected) {
          setUserCurrency(detected);
          setSelectedCurrency(detected);

          if (session?.user?.id) {
            const token = localStorage.getItem("bearer_token");
            await fetch(`/api/users/${session.user.id}/preferences`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ""}`
              },
              body: JSON.stringify({
                preferredCurrency: detected,
                countryCode: data.countryCode,
                timezone: data.timezone,
              })
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to initialize currency:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, loadCurrencyFromDatabase]);

  // Initialize on mount or when session changes
  useEffect(() => {
    if (session?.user?.id) {
      initializeCurrency();
    } else {
      setIsLoading(false);
    }
  }, [session?.user?.id, initializeCurrency]);

  // Fetch exchange rates when selected currency changes
  useEffect(() => {
    if (!selectedCurrency) return;

    const fetchRates = async () => {
      try {
        const ratesResponse = await fetch(
          `/api/exchange-rates?base=${selectedCurrency}`
        );
        if (ratesResponse.ok) {
          const data = await ratesResponse.json();
          setExchangeRates(data);
        }
      } catch (error) {
        console.error("Failed to fetch rates:", error);
      }
    };

    fetchRates();
  }, [selectedCurrency]);

  const setCurrency = useCallback(async (currency: string) => {
    const upperCurrency = currency.toUpperCase();
    setSelectedCurrency(upperCurrency);
    
    // Persist to user preferences
    if (session?.user?.id) {
      const token = localStorage.getItem("bearer_token");
      await fetch(`/api/users/${session.user.id}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ""}`
        },
        body: JSON.stringify({ preferredCurrency: upperCurrency })
      });
    }
    
    // Fallback to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedCurrency", upperCurrency);
    }
    
    // Trigger refresh for all components listening to currency changes
    setRefreshTrigger(prev => prev + 1);
  }, [session?.user?.id]);

  // Refresh currency from database (called after Settings save)
  const refreshCurrency = useCallback(async () => {
    const savedCurrency = await loadCurrencyFromDatabase();
    if (savedCurrency && savedCurrency !== selectedCurrency) {
      setSelectedCurrency(savedCurrency);
      setRefreshTrigger(prev => prev + 1);
    }
  }, [loadCurrencyFromDatabase, selectedCurrency]);

  const convertAmount = useCallback(
    (amount: number, fromCurrency: string = "USD"): number => {
      if (!exchangeRates || !selectedCurrency) return amount;
      if (fromCurrency === selectedCurrency) return amount;

      const fromRate = exchangeRates.rates[fromCurrency.toUpperCase()] || 1;
      const toRate = exchangeRates.rates[selectedCurrency] || 1;
      
      return (amount / fromRate) * toRate;
    },
    [exchangeRates, selectedCurrency]
  );

  const formatAmount = useCallback(
    (amount: number, currency?: string): string => {
      const curr = currency || selectedCurrency;
      
      if (!curr) {
        return amount.toFixed(2);
      }
      
      try {
        return new Intl.NumberFormat(intlLocale, {
          style: "currency",
          currency: curr,
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(amount);
      } catch (error) {
        console.error("Currency format error:", error);
        return `${curr} ${amount.toFixed(2)}`;
      }
    },
    [selectedCurrency, intlLocale]
  );


  const contextValue = useMemo(
    () => ({
      selectedCurrency,
      userCurrency,
      exchangeRates,
      isLoading,
      setCurrency,
      convertAmount,
      formatAmount,
      refreshTrigger,
      refreshCurrency,
    }),
    [selectedCurrency, userCurrency, exchangeRates, isLoading, setCurrency, convertAmount, formatAmount, refreshTrigger, refreshCurrency]
  );

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}