
export const revalidate = 300;

export async function GET() {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/iran-market/iran-market.github.io/main/data/latest-toman.json",
      { cache: "no-store" }
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
      (item: any) => item.symbol === "USD_IRR_FREE" && !item.stale
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
          (usd?.price && usdToman ? usd.price * usdToman : null),
        change24h: usd?.change_pct ?? toman?.change_pct ?? null,
        updatedAt: usd?.timestamp ?? toman?.timestamp ?? null,
      };
    }).filter((item) => item.usd !== null || item.toman !== null);

    const currencyWanted = [
      ["USD_IRR_FREE", "USD", "دلار آمریکا"],
      ["EUR_IRR_FREE", "EUR", "یورو"],
      ["GBP_IRR_FREE", "GBP", "پوند انگلیس"],
      ["AED_IRR_FREE", "AED", "درهم امارات"],
      ["KWD_IRR_FREE", "KWD", "دینار کویت"],
      ["AFN_IRR_FREE", "AFN", "افغانی افغانستان"],
      ["IQD_IRR_FREE", "IQD", "دینار عراق"],
      ["TRY_IRR_FREE", "TRY", "لیر ترکیه"],
      ["RUB_IRR_FREE", "RUB", "روبل روسیه"],
      ["JPY_IRR_FREE", "JPY", "ین ژاپن (۱۰۰ ین)"],
      ["KRW_IRR_FREE", "KRW", "وون کره جنوبی"],
      ["CNY_IRR_FREE", "CNY", "یوان چین"],
    ];

    const currencyItems = currencyWanted.map(
      ([symbol, code, name]) => {
        const item = currencies.find(
          (entry: any) =>
            entry.symbol === symbol &&
            !entry.stale &&
            entry.price > 0
        );

        return {
          code,
          name,
          toman: item?.price ?? null,
          updatedAt: item?.timestamp ?? null,
        };
      }
    ).filter((item) => item.toman !== null);

    const tether = crypto.find(
      (item: any) =>
        item.symbol === "USDT_IRR" &&
        !item.stale &&
        item.price > 0
    );

    if (tether) {
      currencyItems.push({
        code: "USDT",
        name: "تتر",
        toman: tether.price,
        updatedAt: tether.timestamp ?? null,
      });
    }

    return Response.json({
      source: "Iran Market Data",
      updatedAt: json?.data?.generated_at ?? null,
      usdToman: usdToman ?? null,
      items,
      currencies: currencyItems,
    });
  } catch {
    return Response.json(
      { error: "دریافت قیمت‌ها ناموفق بود" },
      { status: 502 }
    );
  }
        }
