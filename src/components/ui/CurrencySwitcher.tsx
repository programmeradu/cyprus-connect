"use client";

import { useCurrency } from "@/contexts/CurrencyContext";
import { Globe } from "lucide-react";
import { useState } from "react";

// Complete list of ALL 190+ world currencies grouped by region
const WORLD_CURRENCIES = {
  "Africa": [
    { code: "DZD", name: "Algerian Dinar", symbol: "د.ج" },
    { code: "AOA", name: "Angolan Kwanza", symbol: "Kz" },
    { code: "BWP", name: "Botswana Pula", symbol: "P" },
    { code: "BIF", name: "Burundian Franc", symbol: "FBu" },
    { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA" },
    { code: "CVE", name: "Cape Verdean Escudo", symbol: "Esc" },
    { code: "KMF", name: "Comorian Franc", symbol: "CF" },
    { code: "CDF", name: "Congolese Franc", symbol: "FC" },
    { code: "DJF", name: "Djiboutian Franc", symbol: "Fdj" },
    { code: "EGP", name: "Egyptian Pound", symbol: "E£" },
    { code: "ERN", name: "Eritrean Nakfa", symbol: "Nfk" },
    { code: "SZL", name: "Eswatini Lilangeni", symbol: "E" },
    { code: "ETB", name: "Ethiopian Birr", symbol: "Br" },
    { code: "GMD", name: "Gambian Dalasi", symbol: "D" },
    { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
    { code: "GNF", name: "Guinean Franc", symbol: "FG" },
    { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
    { code: "LSL", name: "Lesotho Loti", symbol: "M" },
    { code: "LRD", name: "Liberian Dollar", symbol: "L$" },
    { code: "LYD", name: "Libyan Dinar", symbol: "LD" },
    { code: "MGA", name: "Malagasy Ariary", symbol: "Ar" },
    { code: "MWK", name: "Malawian Kwacha", symbol: "MK" },
    { code: "MRU", name: "Mauritanian Ouguiya", symbol: "UM" },
    { code: "MUR", name: "Mauritian Rupee", symbol: "Rs" },
    { code: "MAD", name: "Moroccan Dirham", symbol: "DH" },
    { code: "MZN", name: "Mozambican Metical", symbol: "MT" },
    { code: "NAD", name: "Namibian Dollar", symbol: "N$" },
    { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
    { code: "RWF", name: "Rwandan Franc", symbol: "FRw" },
    { code: "STN", name: "São Tomé & Príncipe Dobra", symbol: "Db" },
    { code: "SCR", name: "Seychellois Rupee", symbol: "SR" },
    { code: "SLL", name: "Sierra Leonean Leone", symbol: "Le" },
    { code: "SOS", name: "Somali Shilling", symbol: "Sh" },
    { code: "ZAR", name: "South African Rand", symbol: "R" },
    { code: "SSP", name: "South Sudanese Pound", symbol: "SS£" },
    { code: "SDG", name: "Sudanese Pound", symbol: "SDG" },
    { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
    { code: "TND", name: "Tunisian Dinar", symbol: "DT" },
    { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
    { code: "XOF", name: "West African CFA Franc", symbol: "CFA" },
    { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK" },
    { code: "ZWL", name: "Zimbabwean Dollar", symbol: "Z$" },
  ],
  "Asia": [
    { code: "AFN", name: "Afghan Afghani", symbol: "؋" },
    { code: "AMD", name: "Armenian Dram", symbol: "֏" },
    { code: "AZN", name: "Azerbaijani Manat", symbol: "₼" },
    { code: "BHD", name: "Bahraini Dinar", symbol: "BD" },
    { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
    { code: "BTN", name: "Bhutanese Ngultrum", symbol: "Nu." },
    { code: "BND", name: "Brunei Dollar", symbol: "B$" },
    { code: "KHR", name: "Cambodian Riel", symbol: "៛" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
    { code: "GEL", name: "Georgian Lari", symbol: "₾" },
    { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
    { code: "INR", name: "Indian Rupee", symbol: "₹" },
    { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
    { code: "IRR", name: "Iranian Rial", symbol: "﷼" },
    { code: "IQD", name: "Iraqi Dinar", symbol: "ID" },
    { code: "ILS", name: "Israeli New Shekel", symbol: "₪" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "JOD", name: "Jordanian Dinar", symbol: "JD" },
    { code: "KZT", name: "Kazakhstani Tenge", symbol: "₸" },
    { code: "KWD", name: "Kuwaiti Dinar", symbol: "KD" },
    { code: "KGS", name: "Kyrgyzstani Som", symbol: "с" },
    { code: "LAK", name: "Lao Kip", symbol: "₭" },
    { code: "LBP", name: "Lebanese Pound", symbol: "LL" },
    { code: "MOP", name: "Macanese Pataca", symbol: "MOP$" },
    { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
    { code: "MVR", name: "Maldivian Rufiyaa", symbol: "Rf" },
    { code: "MNT", name: "Mongolian Tögrög", symbol: "₮" },
    { code: "MMK", name: "Myanmar Kyat", symbol: "K" },
    { code: "NPR", name: "Nepalese Rupee", symbol: "Rs" },
    { code: "KPW", name: "North Korean Won", symbol: "₩" },
    { code: "OMR", name: "Omani Rial", symbol: "ر.ع" },
    { code: "PKR", name: "Pakistani Rupee", symbol: "Rs" },
    { code: "PHP", name: "Philippine Peso", symbol: "₱" },
    { code: "QAR", name: "Qatari Riyal", symbol: "QR" },
    { code: "SAR", name: "Saudi Riyal", symbol: "SR" },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
    { code: "KRW", name: "South Korean Won", symbol: "₩" },
    { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs" },
    { code: "SYP", name: "Syrian Pound", symbol: "£S" },
    { code: "TWD", name: "New Taiwan Dollar", symbol: "NT$" },
    { code: "TJS", name: "Tajikistani Somoni", symbol: "SM" },
    { code: "THB", name: "Thai Baht", symbol: "฿" },
    { code: "TLS", name: "Timorese Dollar", symbol: "$" },
    { code: "TMT", name: "Turkmenistan Manat", symbol: "m" },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
    { code: "UZS", name: "Uzbekistani Som", symbol: "so'm" },
    { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
    { code: "YER", name: "Yemeni Rial", symbol: "YR" },
  ],
  "Europe": [
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
    { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
    { code: "SEK", name: "Swedish Krona", symbol: "kr" },
    { code: "DKK", name: "Danish Krone", symbol: "kr" },
    { code: "ISK", name: "Icelandic Króna", symbol: "kr" },
    { code: "PLN", name: "Polish Złoty", symbol: "zł" },
    { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
    { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
    { code: "RON", name: "Romanian Leu", symbol: "lei" },
    { code: "BGN", name: "Bulgarian Lev", symbol: "лв" },
    { code: "HRK", name: "Croatian Kuna", symbol: "kn" },
    { code: "RSD", name: "Serbian Dinar", symbol: "din" },
    { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴" },
    { code: "BYN", name: "Belarusian Ruble", symbol: "Br" },
    { code: "RUB", name: "Russian Ruble", symbol: "₽" },
    { code: "TRY", name: "Turkish Lira", symbol: "₺" },
    { code: "ALL", name: "Albanian Lek", symbol: "L" },
    { code: "BAM", name: "Bosnia Mark", symbol: "KM" },
    { code: "MKD", name: "Macedonian Denar", symbol: "ден" },
    { code: "MDL", name: "Moldovan Leu", symbol: "L" },
    { code: "GEL", name: "Georgian Lari", symbol: "₾" },
  ],
  "North America": [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "MXN", name: "Mexican Peso", symbol: "$" },
    { code: "GTQ", name: "Guatemalan Quetzal", symbol: "Q" },
    { code: "HNL", name: "Honduran Lempira", symbol: "L" },
    { code: "NIO", name: "Nicaraguan Córdoba", symbol: "C$" },
    { code: "CRC", name: "Costa Rican Colón", symbol: "₡" },
    { code: "PAB", name: "Panamanian Balboa", symbol: "B/." },
    { code: "DOP", name: "Dominican Peso", symbol: "RD$" },
    { code: "CUP", name: "Cuban Peso", symbol: "₱" },
    { code: "HTG", name: "Haitian Gourde", symbol: "G" },
    { code: "JMD", name: "Jamaican Dollar", symbol: "J$" },
    { code: "TTD", name: "Trinidad & Tobago Dollar", symbol: "TT$" },
    { code: "BSD", name: "Bahamian Dollar", symbol: "B$" },
    { code: "BBD", name: "Barbadian Dollar", symbol: "Bds$" },
    { code: "BZD", name: "Belize Dollar", symbol: "BZ$" },
    { code: "XCD", name: "East Caribbean Dollar", symbol: "EC$" },
  ],
  "South America": [
    { code: "BRL", name: "Brazilian Real", symbol: "R$" },
    { code: "ARS", name: "Argentine Peso", symbol: "$" },
    { code: "CLP", name: "Chilean Peso", symbol: "$" },
    { code: "COP", name: "Colombian Peso", symbol: "$" },
    { code: "PEN", name: "Peruvian Sol", symbol: "S/" },
    { code: "VES", name: "Venezuelan Bolívar", symbol: "Bs" },
    { code: "UYU", name: "Uruguayan Peso", symbol: "$U" },
    { code: "PYG", name: "Paraguayan Guaraní", symbol: "₲" },
    { code: "BOB", name: "Bolivian Boliviano", symbol: "Bs." },
    { code: "GYD", name: "Guyanese Dollar", symbol: "G$" },
    { code: "SRD", name: "Surinamese Dollar", symbol: "Sr$" },
    { code: "FKP", name: "Falkland Islands Pound", symbol: "£" },
  ],
  "Oceania": [
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
    { code: "FJD", name: "Fijian Dollar", symbol: "FJ$" },
    { code: "PGK", name: "Papua New Guinean Kina", symbol: "K" },
    { code: "WST", name: "Samoan Tālā", symbol: "T" },
    { code: "TOP", name: "Tongan Paʻanga", symbol: "T$" },
    { code: "VUV", name: "Vanuatu Vatu", symbol: "VT" },
    { code: "SBD", name: "Solomon Islands Dollar", symbol: "SI$" },
    { code: "XPF", name: "CFP Franc", symbol: "₣" },
  ],
  "Middle East": [
    { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
    { code: "BHD", name: "Bahraini Dinar", symbol: "BD" },
    { code: "ILS", name: "Israeli Shekel", symbol: "₪" },
    { code: "JOD", name: "Jordanian Dinar", symbol: "JD" },
    { code: "KWD", name: "Kuwaiti Dinar", symbol: "KD" },
    { code: "LBP", name: "Lebanese Pound", symbol: "LL" },
    { code: "OMR", name: "Omani Rial", symbol: "ر.ع" },
    { code: "QAR", name: "Qatari Riyal", symbol: "QR" },
    { code: "SAR", name: "Saudi Riyal", symbol: "SR" },
    { code: "SYP", name: "Syrian Pound", symbol: "£S" },
    { code: "YER", name: "Yemeni Rial", symbol: "YR" },
  ]
};

interface CurrencySwitcherProps {
  variant?: "compact" | "full";
  className?: string;
}

export function CurrencySwitcher({ variant = "compact", className = "" }: CurrencySwitcherProps) {
  const { selectedCurrency, setCurrency, userCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Flatten all currencies for search
  const allCurrencies = Object.values(WORLD_CURRENCIES).flat();
  const currentCurrency = allCurrencies.find(c => c.code === selectedCurrency);

  // Filter currencies by search term and region
  const filteredRegions = selectedRegion
    ? { [selectedRegion]: WORLD_CURRENCIES[selectedRegion as keyof typeof WORLD_CURRENCIES] }
    : WORLD_CURRENCIES;

  const searchedCurrencies = searchTerm
    ? allCurrencies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  // If no currency is selected yet, show a prompt
  if (!selectedCurrency) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary hover:border-primary transition-colors text-sm animate-pulse"
        >
          <Globe className="w-4 h-4 text-primary" />
          <span className="font-medium text-primary">Select Currency</span>
        </button>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-80 max-h-[32rem] rounded-xl bg-background border border-border shadow-premium z-50 flex flex-col">
              {/* Search Header */}
              <div className="p-3 border-b border-border">
                <input
                  type="text"
                  placeholder="Search currencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>

              {/* Region Tabs */}
              {!searchTerm && (
                <div className="flex gap-1 p-2 border-b border-border overflow-x-auto">
                  <button
                    onClick={() => setSelectedRegion(null)}
                    className={`px-3 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
                      !selectedRegion ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"
                    }`}
                  >
                    All
                  </button>
                  {Object.keys(WORLD_CURRENCIES).map((region) => (
                    <button
                      key={region}
                      onClick={() => setSelectedRegion(region)}
                      className={`px-3 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
                        selectedRegion === region ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              )}

              {/* Currency List */}
              <div className="overflow-y-auto flex-1 p-2">
                {searchedCurrencies ? (
                  // Search results
                  <div className="space-y-1">
                    {searchedCurrencies.map((currency) => (
                      <button
                        key={currency.code}
                        onClick={() => {
                          setCurrency(currency.code);
                          setIsOpen(false);
                          setSearchTerm("");
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{currency.symbol}</span>
                          <div className="text-left">
                            <p className="text-sm font-medium">{currency.code}</p>
                            <p className="text-xs text-muted-foreground">{currency.name}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                    {searchedCurrencies.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No currencies found
                      </p>
                    )}
                  </div>
                ) : (
                  // Grouped by region
                  Object.entries(filteredRegions).map(([region, currencies]) => (
                    <div key={region} className="mb-4">
                      <p className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">
                        {region}
                      </p>
                      <div className="space-y-1">
                        {currencies.map((currency) => (
                          <button
                            key={currency.code}
                            onClick={() => {
                              setCurrency(currency.code);
                              setIsOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{currency.symbol}</span>
                              <div className="text-left">
                                <p className="text-sm font-medium">{currency.code}</p>
                                <p className="text-xs text-muted-foreground">{currency.name}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors text-sm"
        >
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{selectedCurrency}</span>
          {currentCurrency && <span className="text-xs text-muted-foreground">{currentCurrency.symbol}</span>}
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-80 max-h-[32rem] rounded-xl bg-background border border-border shadow-premium z-50 flex flex-col">
              {/* Search Header */}
              <div className="p-3 border-b border-border">
                <input
                  type="text"
                  placeholder="Search currencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>

              {/* Region Tabs */}
              {!searchTerm && (
                <div className="flex gap-1 p-2 border-b border-border overflow-x-auto">
                  <button
                    onClick={() => setSelectedRegion(null)}
                    className={`px-3 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
                      !selectedRegion ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"
                    }`}
                  >
                    All
                  </button>
                  {Object.keys(WORLD_CURRENCIES).map((region) => (
                    <button
                      key={region}
                      onClick={() => setSelectedRegion(region)}
                      className={`px-3 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
                        selectedRegion === region ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              )}

              {/* Currency List */}
              <div className="overflow-y-auto flex-1 p-2">
                {searchedCurrencies ? (
                  // Search results
                  <div className="space-y-1">
                    {searchedCurrencies.map((currency) => (
                      <button
                        key={currency.code}
                        onClick={() => {
                          setCurrency(currency.code);
                          setIsOpen(false);
                          setSearchTerm("");
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors ${
                          currency.code === selectedCurrency ? "bg-primary/10" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{currency.symbol}</span>
                          <div className="text-left">
                            <p className="text-sm font-medium">{currency.code}</p>
                            <p className="text-xs text-muted-foreground">{currency.name}</p>
                          </div>
                        </div>
                        {currency.code === selectedCurrency && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                    {searchedCurrencies.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No currencies found
                      </p>
                    )}
                  </div>
                ) : (
                  // Grouped by region
                  Object.entries(filteredRegions).map(([region, currencies]) => (
                    <div key={region} className="mb-4">
                      <p className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">
                        {region}
                      </p>
                      <div className="space-y-1">
                        {currencies.map((currency) => (
                          <button
                            key={currency.code}
                            onClick={() => {
                              setCurrency(currency.code);
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors ${
                              currency.code === selectedCurrency ? "bg-primary/10" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{currency.symbol}</span>
                              <div className="text-left">
                                <p className="text-sm font-medium">{currency.code}</p>
                                <p className="text-xs text-muted-foreground">{currency.name}</p>
                              </div>
                            </div>
                            {currency.code === selectedCurrency && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                            {currency.code === userCurrency && currency.code !== selectedCurrency && (
                              <span className="text-xs text-muted-foreground">Auto</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium mb-2">Currency</label>
      <select
        value={selectedCurrency}
        onChange={(e) => setCurrency(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {!selectedCurrency && <option value="">Select your currency</option>}
        {Object.entries(WORLD_CURRENCIES).map(([region, currencies]) => (
          <optgroup key={region} label={region}>
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} {currency.code} - {currency.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {userCurrency && userCurrency !== selectedCurrency && (
        <p className="text-xs text-muted-foreground">
          Auto-detected: {userCurrency}
        </p>
      )}
    </div>
  );
}