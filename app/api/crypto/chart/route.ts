
export const revalidate = 300;

const coinIds: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
  DOGE: "dogecoin",
  ADA: "cardano",
  TRX: "tron",
  TON: "the-open-network",
  BCH: "bitcoin-cash",
};

const allowedDays = ["1", "7", "30", "90", "365"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const symbol = (searchParams.get("symbol") ?? "BTC").toUpperCase();
  const days = searchParams.get("days") ?? "7";

  if (!coinIds[symbol]) {
    return Response.json(
      { error: "رمزارز پشتیبانی نمی‌شود" },
      { status: 400 }
    );
  }

  if (!allowedDays.includes(days)) {
    return Response.json(
      { error: "بازه زمانی نامعتبر است" },
      { status: 400 }
    );
  }

  try {
    const url = new URL(
      `https://api.coingecko.com/api/v3/coins/${coinIds[symbol]}/market_chart`
    );

    url.searchParams.set("vs_currency", "usd");
    url.searchParams.set("days", days);

    const response = await fetch(url.toString(), {
      headers: { accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return Response.json(
        {
          error:
            response.status === 429
              ? "درخواست‌های نمودار موقتاً به محدودیت رسیده‌اند؛ کمی بعد دوباره تلاش کن."
              : "منبع تاریخچه قیمت فعلاً در دسترس نیست.",
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    const rows = Array.isArray(data?.prices) ? data.prices : [];

    const points = rows
      .filter(
        (row: unknown) =>
          Array.isArray(row) &&
          typeof row[0] === "number" &&
          typeof row[1] === "number" &&
          row[1] > 0
      )
      .map((row: [number, number]) => ({
        timestamp: row[0],
        price: row[1],
      }));

    if (points.length < 2) {
      return Response.json(
        { error: "داده تاریخی کافی دریافت نشد." },
        { status: 502 }
      );
    }

    return Response.json(
      {
        symbol,
        days: Number(days),
        currency: "USD",
        currentPrice: points[points.length - 1].price,
        points,
        source: "CoinGecko",
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch {
    return Response.json(
      { error: "خطا در دریافت تاریخچه قیمت رمزارز" },
      { status: 502 }
    );
  }
}

