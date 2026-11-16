
import { NextResponse } from "next/server";

export const revalidate = 300;

const SYMBOLS = {
  indices: ["DAX", "CAC"],
  stocks: ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL"],
};

type Quote = {
  symbol?: string;
  name?: string;
  instrument_name?: string;
  exchange?: string;
  currency?: string;
  datetime?: string;
  timestamp?: number;
  close?: string | number;
  price?: string | number;
  change?: string | number;
  percent_change?: string | number;
  change_percentage?: string | number;
  previous_close?: string | number;
  open?: string | number;
  high?: string | number;
  low?: string | number;
  volume?: string | number;
  is_market_open?: boolean;
  status?: string;
};

function normalizeQuote(
  quote: Quote,
  fallbackSymbol: string
) {
  return {
    symbol: quote.symbol || fallbackSymbol,
    name:
      quote.name ||
      quote.instrument_name ||
      fallbackSymbol,
    exchange: quote.exchange || "",
    currency: quote.currency || "USD",
    datetime: quote.datetime || "",
    timestamp: quote.timestamp || null,
    price: quote.close ?? quote.price ?? null,
    change: quote.change ?? null,
    changePercent:
      quote.percent_change ??
      quote.change_percentage ??
      null,
    previousClose: quote.previous_close ?? null,
    open: quote.open ?? null,
    high: quote.high ?? null,
    low: quote.low ?? null,
    volume: quote.volume ?? null,
    isMarketOpen: quote.is_market_open ?? false,
  };
}

export async function GET(request: Request) {
  try {
    const apiKey = process.env.TWELVE_DATA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          configured: false,
          error: "کلید API در Vercel ثبت نشده است.",
          items: [],
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const group = searchParams.get("group");

    if (group !== "indices" && group !== "stocks") {
      return NextResponse.json(
        {
          configured: true,
          error: "گروه درخواستی معتبر نیست.",
          items: [],
        },
        { status: 400 }
      );
    }

    const symbols = SYMBOLS[group];

    const url = new URL(
      "https://api.twelvedata.com/quote"
    );

    url.searchParams.set("symbol", symbols.join(","));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `apikey ${apiKey}`,
        Accept: "application/json",
      },
      next: {
        revalidate: 300,
      },
    });

    const result = await response.json();

    if (
      !response.ok ||
      result.status === "error" ||
      result.code
    ) {
      return NextResponse.json(
        {
          configured: true,
          error:
            result.message ||
            "خطا در دریافت اطلاعات از Twelve Data.",
          items: [],
        },
        { status: response.status || 502 }
      );
    }

    const items = symbols
      .map((symbol) => {
        let quote: Quote | undefined;

        if (
          result[symbol] &&
          typeof result[symbol] === "object"
        ) {
          quote = result[symbol] as Quote;
        } else if (
          result.symbol &&
          String(result.symbol).toUpperCase() === symbol
        ) {
          quote = result as Quote;
        }

        if (!quote || quote.status === "error") {
          return null;
        }

        const price = quote.close ?? quote.price;

        if (price === undefined || price === null) {
          return null;
        }

        return normalizeQuote(quote, symbol);
      })
      .filter((item) => item !== null);

    return NextResponse.json(
      {
        configured: true,
        group,
        count: items.length,
        updatedAt: new Date().toISOString(),
        cacheSeconds: 300,
        items,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=120",
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        configured: true,
        error: "خطا در ارتباط با منبع اطلاعات بازار.",
        items: [],
      },
      { status: 500 }
    );
  }
}
