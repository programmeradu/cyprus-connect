import { NextRequest, NextResponse } from "next/server";
import { getExchangeRates } from "@/lib/exchange-rates";

export async function GET(request: NextRequest) {
  const baseCurrency = request.nextUrl.searchParams.get("base") || "USD";
  const symbols = request.nextUrl.searchParams.get("symbols");

  try {
    const targetCurrencies = symbols ? symbols.split(",") : undefined;
    const rates = await getExchangeRates(baseCurrency, targetCurrencies);

    if (!rates) {
      return NextResponse.json(
        { error: "Failed to fetch exchange rates" },
        { status: 500 }
      );
    }

    return NextResponse.json(rates, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Exchange rates API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
