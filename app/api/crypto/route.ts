
export const revalidate = 300;

export async function GET() {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/iran-market/iran-market.github.io/main/data/latest-toman.json",
      { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      return Response.json(
        { error: "منبع قیمت‌ها در دسترس نیست" },
        { status: 502 }
      );
    }

    const json = await response.json();
    const groups = json?.data?.categories ?? {};
    const crypto = groups.crypto ?? [];
    const currencies = groups.currency ?? [];

    const usdToman = currencies.find(
      (item: any) =>
        item.symbol === "USD_IRR_FREE" && !item.stale
    )?.price;

    const wanted = [
      ["BTC", "بیت‌کوین"],
      ["ETH", "اتریوم"],
      ["BNB", "بایننس کوین"],
      ["SOL", "سولانا"],
      ["XRP", "ریپل"],
      ["DOGE", "دوج‌کوین"],
      ["ADA", "کاردانو"],
      ["TRX", "ترون"],
      ["TON", "تون‌کوین"],
      ["BCH", "بیت‌کوین کش"],
    ];

    const items = wanted.map(([symbol, name]) => {
      const usd = crypto.find(
        (item: any) =>
          item.symbol === `${symbol}_USD` &&
          !item.stale &&
          item.price > 0
      );

      const toman = crypto.find(
        (item: any) =>
          item.symbol === `${symbol}_IRR` &&
          !item.stale &&
          item.price > 0
      );

      return {
        symbol,
        name,
        usd: usd?.price ?? null,
        toman:
          toman?.price ??
          (usd?.price && usdToman
            ? usd.price * usdToman
            : null),
        change24h:
          usd?.change_pct ?? toman?.change_pct ?? null,
        updatedAt: usd?.timestamp ?? toman?.timestamp ?? null,
      };
    }).filter((item) => item.usd !== null || item.toman !== null);

    return Response.json({
      source: "Iran Market Data",
      updatedAt: json?.data?.generated_at ?? null,
      usdToman: usdToman ?? null,
      items,
    });
  } catch {
    return Response.json(
      { error: "دریافت قیمت‌ها ناموفق بود" },
      { status: 502 }
    );
  }
}
