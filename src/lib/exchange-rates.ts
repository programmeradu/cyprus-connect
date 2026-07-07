// Exchange rate service with multiple API support for comprehensive currency coverage
export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

// Frankfurter API supported currencies (31 major currencies)
const FRANKFURTER_CURRENCIES = [
  "AUD", "BGN", "BRL", "CAD", "CHF", "CNY", "CZK", "DKK", 
  "EUR", "GBP", "HKD", "HUF", "IDR", "ILS", "INR", "ISK", 
  "JPY", "KRW", "MXN", "MYR", "NOK", "NZD", "PHP", "PLN", 
  "RON", "SEK", "SGD", "THB", "TRY", "USD", "ZAR"
];

// ExchangeRate-API: Free tier, supports 161 currencies
async function getExchangeRatesFromExchangeRateAPI(
  baseCurrency: string = "USD",
  targetCurrencies?: string[]
): Promise<ExchangeRates | null> {
  try {
    const baseUpper = baseCurrency.toUpperCase();
    const url = `https://open.exchangerate-api.com/v6/latest/${baseUpper}`;

    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error("ExchangeRate-API fetch failed:", response.statusText);
      return null;
    }

    const data = await response.json();
    
    // Filter to target currencies if specified
    if (targetCurrencies?.length) {
      const filteredRates: Record<string, number> = {};
      targetCurrencies.forEach((currency) => {
        const currencyUpper = currency.toUpperCase();
        if (data.rates[currencyUpper]) {
          filteredRates[currencyUpper] = data.rates[currencyUpper];
        }
      });
      
      return {
        base: data.base_code,
        date: new Date(data.time_last_update_unix * 1000).toISOString().split('T')[0],
        rates: filteredRates,
      };
    }

    return {
      base: data.base_code,
      date: new Date(data.time_last_update_unix * 1000).toISOString().split('T')[0],
      rates: data.rates,
    };
  } catch (error) {
    console.error("ExchangeRate-API error:", error);
    return null;
  }
}

// Frankfurter API: Free, no API key, 31 major currencies
async function getExchangeRatesFromFrankfurter(
  baseCurrency: string = "USD",
  targetCurrencies?: string[]
): Promise<ExchangeRates | null> {
  try {
    const baseUpper = baseCurrency.toUpperCase();
    
    // Check if base currency is supported by Frankfurter
    if (!FRANKFURTER_CURRENCIES.includes(baseUpper)) {
      console.log(`Currency ${baseUpper} not supported by Frankfurter API.`);
      return null;
    }
    
    const url = new URL("https://api.frankfurter.dev/v1/latest");
    url.searchParams.set("base", baseUpper);
    if (targetCurrencies?.length) {
      const supportedTargets = targetCurrencies.filter(c => 
        FRANKFURTER_CURRENCIES.includes(c.toUpperCase())
      );
      if (supportedTargets.length > 0) {
        url.searchParams.set("symbols", supportedTargets.join(","));
      }
    }

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error("Frankfurter fetch failed:", response.statusText);
      return null;
    }

    const data: ExchangeRates = await response.json();
    return data;
  } catch (error) {
    console.error("Frankfurter error:", error);
    return null;
  }
}

// Main function: Try ExchangeRate-API first (161 currencies), fallback to Frankfurter (31 currencies)
export async function getExchangeRates(
  baseCurrency: string = "USD",
  targetCurrencies?: string[]
): Promise<ExchangeRates | null> {
  try {
    // Try ExchangeRate-API first (supports 161 currencies)
    const exchangeRateAPIResult = await getExchangeRatesFromExchangeRateAPI(baseCurrency, targetCurrencies);
    if (exchangeRateAPIResult) {
      console.log(`Successfully fetched rates from ExchangeRate-API for ${baseCurrency}`);
      return exchangeRateAPIResult;
    }

    // Fallback to Frankfurter (31 major currencies)
    console.log("Falling back to Frankfurter API");
    const frankfurterResult = await getExchangeRatesFromFrankfurter(baseCurrency, targetCurrencies);
    if (frankfurterResult) {
      console.log(`Successfully fetched rates from Frankfurter for ${baseCurrency}`);
      return frankfurterResult;
    }

    // If both fail and base currency is not USD, try USD as base with cross-calculation
    if (baseCurrency.toUpperCase() !== "USD") {
      console.log("Both APIs failed, falling back to USD base");
      const usdRates = await getExchangeRatesFromExchangeRateAPI("USD", targetCurrencies);
      if (usdRates) {
        return usdRates;
      }
    }

    console.error("All exchange rate APIs failed");
    return null;
  } catch (error) {
    console.error("Exchange rate error:", error);
    return null;
  }
}

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  const fromUpper = fromCurrency.toUpperCase();
  const toUpper = toCurrency.toUpperCase();
  
  // If same currency, return original amount
  if (fromUpper === toUpper) {
    return amount;
  }
  
  const rates = await getExchangeRates(fromCurrency, [toCurrency]);
  if (!rates?.rates[toUpper]) {
    console.log(`Conversion rate not available for ${fromCurrency} to ${toCurrency}`);
    return null;
  }
  
  return amount * rates.rates[toUpper];
}

// Get all supported currencies from ExchangeRate-API
export async function getSupportedCurrencies(): Promise<string[]> {
  try {
    const rates = await getExchangeRatesFromExchangeRateAPI("USD");
    if (rates?.rates) {
      return Object.keys(rates.rates).sort();
    }
    
    // Fallback to Frankfurter currencies
    return FRANKFURTER_CURRENCIES;
  } catch (error) {
    console.error("Error fetching supported currencies:", error);
    return FRANKFURTER_CURRENCIES;
  }
}

// Check if a currency is supported (checks against ExchangeRate-API)
export async function isCurrencySupported(currency: string): Promise<boolean> {
  const supportedCurrencies = await getSupportedCurrencies();
  return supportedCurrencies.includes(currency.toUpperCase());
}

// Get information about API coverage
export function getAPICoverage() {
  return {
    primary: {
      name: "ExchangeRate-API",
      currencies: 161,
      url: "https://www.exchangerate-api.com",
    },
    fallback: {
      name: "Frankfurter",
      currencies: FRANKFURTER_CURRENCIES.length,
      supportedCurrencies: FRANKFURTER_CURRENCIES,
    },
  };
}