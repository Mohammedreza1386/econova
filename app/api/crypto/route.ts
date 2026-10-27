
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
      (item: any) =>
        item.symbol === "USD_IRR_FREE" &&
        !item.stale &&
        item.price > 0
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

    type CryptoItem = {
      symbol: string;
      name: string;
      usd: number | null;
      toman: number | null;
      change24h: number | null;
      updatedAt: string | number | null;
    };

    const items: CryptoItem[] = wanted.map(([symbol, name]) => {
      const usd = crypto.find(
        (item: any) =>
          item.symbol === `${symbol}_USD` &&
          !item.stale &&
          typeof item.price === "number" &&
          item.price > 0
      );

      const toman = crypto.find(
        (item: any) =>
          item.symbol === `${symbol}_IRR` &&
          !item.stale &&
          typeof item.price === "number" &&
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
    });

    // منبع جایگزین قیمت رمزارزها
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

    try {
      const missing = items.filter(
        (item) => item.usd === null || item.toman === null
      );

      if (missing.length > 0) {
        const ids = missing
          .map((item) => coinIds[item.symbol])
          .filter(Boolean)
          .join(",");

        if (ids) {
          const fallbackResponse = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`,
            { cache: "no-store" }
          );

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();

            for (const item of missing) {
              const data = fallbackData[coinIds[item.symbol]];

              if (!data || typeof data.usd !== "number" || data.usd <= 0) {
                continue;
              }

              item.usd ??= data.usd;

              if (usdToman && usdToman > 0) {
                item.toman ??= data.usd * usdToman;
              }

              item.change24h ??=
                typeof data.usd_24h_change === "number"
                  ? data.usd_24h_change
                  : null;

              item.updatedAt ??=
                typeof data.last_updated_at === "number"
                  ? new Date(data.last_updated_at * 1000).toISOString()
                  : null;
            }
          }
        }
      }
    } catch {
      // اگر منبع جایگزین در دسترس نباشد، سایر بخش‌های سایت کار می‌کنند.
    }

    const availableItems = items.filter(
      (item) => item.usd !== null || item.toman !== null
    );

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

    const currencyItems = currencyWanted
      .map(([symbol, code, name]) => {
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
      })
      .filter((item) => item.toman !== null);

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

    const goldAndCoinWanted = [
      { category: "gold", symbol: "GOLD_18K_IRR", code: "GOLD18", name: "طلای ۱۸ عیار (هر گرم)" },
      { category: "gold", symbol: "GOLD_18K_740_IRR", code: "GOLD740", name: "طلای ۱۸ عیار ۷۴۰ (هر گرم)" },
      { category: "gold", symbol: "GOLD_MESGHAL_IRR", code: "MESGHAL", name: "مثقال طلا" },
      { category: "coin", symbol: "COIN_EMAMI_IRR", code: "EMAMI", name: "سکه امامی" },
      { category: "coin", symbol: "COIN_BAHAR_IRR", code: "BAHAR", name: "سکه بهار آزادی" },
      { category: "coin", symbol: "COIN_HALF_IRR", code: "HALF", name: "نیم سکه" },
      { category: "coin", symbol: "COIN_QUARTER_IRR", code: "QUARTER", name: "ربع سکه" },
      { category: "coin", symbol: "COIN_GRAMI_IRR", code: "GRAMI", name: "سکه گرمی" },
    ];

    const goldAndCoins = goldAndCoinWanted
      .map((wanted) => {
        const sourceItems = groups[wanted.category] ?? [];
        const item = sourceItems.find(
          (entry: any) =>
            entry.symbol === wanted.symbol &&
            !entry.stale &&
            entry.price > 0
        );

        return {
          code: wanted.code,
          name: wanted.name,
          toman: item?.price ?? null,
          updatedAt: item?.timestamp ?? null,
        };
      })
      .filter((item) => item.toman !== null);

    const trendWanted = [
      { category: "crypto", symbol: "BTC_IRR", code: "BTC", name: "بیت‌کوین" },
      { category: "currency", symbol: "USD_IRR_FREE", code: "USD", name: "دلار آمریکا" },
      { category: "gold", symbol: "GOLD_18K_IRR", code: "GOLD18", name: "طلای ۱۸ عیار" },
      { category: "coin", symbol: "COIN_EMAMI_IRR", code: "EMAMI", name: "سکه امامی" },
    ];

    const marketTrend = trendWanted
      .map((wanted) => {
        const sourceItems = groups[wanted.category] ?? [];
        const item = sourceItems.find(
          (entry: any) =>
            entry.symbol === wanted.symbol &&
            !entry.stale &&
            entry.price > 0
        );

        return {
          code: wanted.code,
          name: wanted.name,
          price: item?.price ?? null,
          high: item?.high ?? null,
          low: item?.low ?? null,
          previousClose: item?.prev_close ?? null,
          changePct: item?.change_pct ?? null,
          updatedAt: item?.timestamp ?? null,
        };
      })
      .filter((item) => item.price !== null);

    // قیمت برنت از منبع اصلی
    const energy = groups.energy ?? [];

    const oilPrices = [
      {
        code: "WTI",
        name: "نفت خام آمریکا (WTI)",
        usd: null as number | null,
        unit: "دلار به‌ازای هر بشکه",
        changePct: null as number | null,
        updatedAt: null as string | null,
      },
      {
        code: "BRENT",
        name: "نفت برنت",
        usd: null as number | null,
        unit: "دلار به‌ازای هر بشکه",
        changePct: null as number | null,
        updatedAt: null as string | null,
      },
    ];

    const brent = energy.find(
      (item: any) =>
        item.symbol === "BRENT_USD" &&
        !item.stale &&
        typeof item.price === "number" &&
        item.price > 0
    );

    if (brent) {
      oilPrices[1] = {
        ...oilPrices[1],
        usd: brent.price,
        changePct: brent.change_pct ?? null,
        updatedAt: brent.timestamp ?? null,
      };
    }

    // منبع جایگزین WTI
    try {
      const wtiResponse = await fetch(
        "https://americasoilwatch.com/api/v1/wti",
        { cache: "no-store" }
      );

      if (wtiResponse.ok) {
        const wtiData = await wtiResponse.json();

        if (
          wtiData.quoteStatus === "current" &&
          typeof wtiData.priceUsd === "number" &&
          wtiData.priceUsd > 0
        ) {
          oilPrices[0] = {
            ...oilPrices[0],
            usd: wtiData.priceUsd,
            changePct:
              typeof wtiData.changePct === "number"
                ? wtiData.changePct
                : null,
            updatedAt:
              wtiData.observedAt ??
              wtiData.lastUpdated ??
              null,
          };
        }
      }
    } catch {
      // قطع منبع WTI نباید بقیه قیمت‌ها را متوقف کند.
    }

    // تاریخچه روزانه دلار آزاد: آخرین ۹۰ رکورد
    let dollarHistory: {
      date: string;
      timestamp: string;
      price: number;
    }[] = [];

    try {
      const historyResponse = await fetch(
        "https://raw.githubusercontent.com/iran-market/iran-market.github.io/main/data/history/USD_IRR_FREE.json",
        { cache: "no-store" }
      );

      if (historyResponse.ok) {
        const historyJson = await historyResponse.json();
        const rows = Array.isArray(historyJson?.data)
          ? historyJson.data
          : [];

        dollarHistory = rows
          .filter(
            (row: any) =>
              typeof row.close === "number" &&
              row.close > 0 &&
              typeof row.t === "string"
          )
          .slice(-90)
          .map((row: any) => ({
            date: row.date_jalali ?? row.t.slice(0, 10),
            timestamp: row.t,
            price: row.close,
          }));
      }
    } catch {
      // اگر تاریخچه در دسترس نباشد، سایر اطلاعات همچنان برمی‌گردند.
    }
    
    // تاریخچه روزانه طلای ۱۸ عیار: آخرین ۹۰ رکورد
    let goldHistory: {
      date: string;
      timestamp: string;
      price: number;
    }[] = [];

    try {
      const goldHistoryResponse = await fetch(
        "https://raw.githubusercontent.com/iran-market/iran-market.github.io/main/data/history/GOLD_18K_IRR.json",
        { cache: "no-store" }
      );

      if (goldHistoryResponse.ok) {
        const goldHistoryJson = await goldHistoryResponse.json();

        const rows = Array.isArray(goldHistoryJson?.data)
          ? goldHistoryJson.data
          : [];

        goldHistory = rows
          .filter(
            (row: any) =>
              typeof row.close === "number" &&
              row.close > 0 &&
              typeof row.t === "string"
          )
          .slice(-90)
          .map((row: any) => ({
            date: row.date_jalali ?? row.t.slice(0, 10),
            timestamp: row.t,
            price: row.close,
          }));
      }
    } catch {
      // در صورت قطع تاریخچه طلا، سایر اطلاعات سایت فعال می‌مانند.
    }
    

    return Response.json({
      source: "Iran Market Data",
      updatedAt: json?.data?.generated_at ?? null,
      usdToman: usdToman ?? null,
      items: availableItems,
      currencies: currencyItems,
      goldAndCoins,
      marketTrend,
      oilPrices,
      dollarHistory,
      goldHistory,
    });
  } catch {
    return Response.json(
      { error: "دریافت قیمت‌ها ناموفق بود" },
      { status: 502 }
    );
  }
          }
