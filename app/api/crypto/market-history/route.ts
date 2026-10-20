
import { NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://zusbebjskchgehdjvpsm.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const ALLOWED_SYMBOLS = [
  "BTC_IRR",
  "USD_IRR_FREE",
  "GOLD_18K_IRR",
  "COIN_EMAMI_IRR",
];

export async function GET(request: Request) {
  try {
    if (!SUPABASE_KEY) {
      return NextResponse.json(
        { error: "Supabase API key is not configured." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol") || "BTC_IRR";
    const range = searchParams.get("range") || "24h";

    if (!ALLOWED_SYMBOLS.includes(symbol)) {
      return NextResponse.json(
        { error: "Invalid symbol." },
        { status: 400 }
      );
    }

    const durations: Record<string, number> = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    if (!(range in durations)) {
      return NextResponse.json(
        { error: "Range must be 24h, 7d, or 30d." },
        { status: 400 }
      );
    }

    const since = new Date(
      Date.now() - durations[range]
    ).toISOString();

    const url = new URL(
      `${SUPABASE_URL}/rest/v1/market_price_history`
    );

    url.searchParams.set("select", "symbol,name,price,currency,captured_at");
    url.searchParams.set("symbol", `eq.${symbol}`);
    url.searchParams.set("captured_at", `gte.${since}`);
    url.searchParams.set("order", "captured_at.asc");
    url.searchParams.set("limit", "2000");

    const response = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Could not read market history." },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(
      {
        symbol,
        range,
        points: data,
        count: data.length,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Market history request failed." },
      { status: 500 }
    );
  }
}

