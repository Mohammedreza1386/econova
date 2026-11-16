
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type MarketItem = {
  symbol: string;
  name?: string;
  exchange?: string;
  currency?: string;
  datetime?: string;
  price?: number | string;
  change?: number | string;
  changePercent?: number | string;
  previousClose?: number | string;
  open?: number | string;
  high?: number | string;
  low?: number | string;
  volume?: number | string;
  isMarketOpen?: boolean;
};

type ApiResponse = {
  configured?: boolean;
  error?: string;
  items?: MarketItem[];
};

const indices = [
  { symbol: "SPX", name: "S&P 500", country: "آمریکا" },
  { symbol: "DJI", name: "Dow Jones", country: "آمریکا" },
  { symbol: "IXIC", name: "Nasdaq Composite", country: "آمریکا" },
  { symbol: "DAX", name: "DAX", country: "آلمان" },
  { symbol: "FTSE", name: "FTSE 100", country: "بریتانیا" },
  { symbol: "CAC", name: "CAC 40", country: "فرانسه" },
  { symbol: "N225", name: "Nikkei 225", country: "ژاپن" },
  { symbol: "HSI", name: "Hang Seng", country: "هنگ‌کنگ" },
];

const stocks = [
  { symbol: "AAPL", name: "Apple", country: "آمریکا" },
  { symbol: "MSFT", name: "Microsoft", country: "آمریکا" },
  { symbol: "NVDA", name: "NVIDIA", country: "آمریکا" },
  { symbol: "AMZN", name: "Amazon", country: "آمریکا" },
  { symbol: "GOOGL", name: "Alphabet", country: "آمریکا" },
  { symbol: "META", name: "Meta Platforms", country: "آمریکا" },
  { symbol: "TSLA", name: "Tesla", country: "آمریکا" },
];

const tabs = [
  { id: "indices", label: "شاخص‌های جهانی" },
  { id: "stocks", label: "سهام شرکت‌ها" },
  { id: "iran", label: "بورس ایران" },
] as const;

type Tab = (typeof tabs)[number]["id"];

function numberValue(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function money(value: unknown, currency = "USD") {
  const number = numberValue(value);
  if (number === null) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(number) + (currency === "USD" ? " $" : ` ${currency}`);
}

function percent(value: unknown) {
  const number = numberValue(value);
  if (number === null) return "—";
  return `${number > 0 ? "+" : ""}${number.toFixed(2)}%`;
}

function MarketCard({
  item,
  fallback,
}: {
  item: MarketItem;
  fallback: string;
}) {
  const change = numberValue(item.changePercent);
  const positive = change !== null && change >= 0;
  const name = item.name || fallback;

  return (
    <article className="market-card">
      <div className="card-top">
        <div>
          <div className="symbol">{item.symbol}</div>
          <div className="asset-name">{name}</div>
        </div>
        <span className="market-dot" title="اطلاعات دریافت‌شده از API" />
      </div>

      <div className="price">
        {money(item.price, item.currency || "USD")}
      </div>

      <div className="change-row">
        <span className={positive ? "positive" : "negative"}>
          {percent(item.changePercent)}
        </span>
        <span className="muted">تغییر روزانه</span>
      </div>

      <div className="card-details">
        <div>
          <span>بیشترین</span>
          <b>{money(item.high, item.currency || "USD")}</b>
        </div>
        <div>
          <span>کمترین</span>
          <b>{money(item.low, item.currency || "USD")}</b>
        </div>
        <div>
          <span>حجم</span>
          <b>{item.volume || "—"}</b>
        </div>
        <div>
          <span>بازار</span>
          <b>{item.isMarketOpen ? "باز" : "بسته / نامشخص"}</b>
        </div>
      </div>

      <div className="exchange">
        {item.exchange || "اطلاعات بازار"}
        {item.datetime ? ` · ${item.datetime}` : ""}
      </div>
    </article>
  );
}

export default function MarketsPage() {
  const [tab, setTab] = useState<Tab>("indices");
  const [indicesData, setIndicesData] = useState<MarketItem[]>([]);
  const [stocksData, setStocksData] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  const loadData = useCallback(async (group: "indices" | "stocks") => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/markets?group=${group}`, {
        cache: "no-store",
      });

      const result: ApiResponse = await response.json();

      setConfigured(result.configured ?? false);

      if (!response.ok) {
        throw new Error(result.error || "دریافت اطلاعات بازار ناموفق بود.");
      }

      if (group === "indices") {
        setIndicesData(result.items || []);
      } else {
        setStocksData(result.items || []);
      }

      setUpdatedAt(new Date().toLocaleTimeString("fa-IR"));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "خطا در ارتباط با سرور"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "iran") return;

    loadData(tab);

    const timer = window.setInterval(() => {
      loadData(tab);
    }, 180000);

    return () => window.clearInterval(timer);
  }, [tab, loadData]);

  const source = tab === "indices" ? indices : stocks;
  const data = tab === "indices" ? indicesData : stocksData;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return data.filter((item) => {
      const fallback = source.find((x) => x.symbol === item.symbol);
      const name = item.name || fallback?.name || "";

      return (
        item.symbol.toLowerCase().includes(term) ||
        name.toLowerCase().includes(term) ||
        (fallback?.country || "").toLowerCase().includes(term)
      );
    });
  }, [data, search, source]);

  const ranked = [...data]
    .filter((item) => numberValue(item.changePercent) !== null)
    .sort(
      (a, b) =>
        (numberValue(b.changePercent) || 0) -
        (numberValue(a.changePercent) || 0)
    );

  const gainers = ranked.slice(0, 3);
  const losers = [...ranked].reverse().slice(0, 3);

  return (
    <main dir="rtl" className="markets-page">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #080b09;
          color: #f2f5ef;
          font-family: Tahoma, Arial, sans-serif;
        }

        .markets-page {
          min-height: 100vh;
          padding: 28px 5%;
          background:
            radial-gradient(ellipse at 85% 0%, #18301d 0%, transparent 35%),
            #080b09;
          color: #f2f5ef;
        }

        .markets-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 35px;
        }

        .brand {
          font-size: 27px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #b9f27c;
        }

        .brand span {
          color: white;
        }

        .header-tag {
          color: #9aa59a;
          font-size: 12px;
          margin-top: 8px;
        }

        .live-label {
          border: 1px solid #34552b;
          background: #142116;
          color: #b9f27c;
          padding: 10px 16px;
          border-radius: 30px;
          font-size: 12px;
        }

        .hero {
          border: 1px solid #263a27;
          background: linear-gradient(120deg, #17271a, #101712);
          border-radius: 22px;
          padding: 30px;
          margin-bottom: 25px;
        }

        .hero h1 {
          font-size: clamp(27px, 5vw, 43px);
          margin: 0 0 12px;
        }

        .hero h1 span {
          color: #b9f27c;
        }

        .hero p {
          color: #a5b0a4;
          line-height: 2;
          margin: 0;
          font-size: 13px;
        }

        .tabs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin: 25px 0;
        }

        .tab {
          border: 1px solid #29352b;
          background: #111713;
          color: #aab5a9;
          border-radius: 12px;
          padding: 13px 20px;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
        }

        .tab.active {
          background: #b9f27c;
          color: #10180e;
          border-color: #b9f27c;
          font-weight: bold;
        }

        .toolbar {
          display: flex;
          gap: 12px;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .search {
          background: #111713;
          border: 1px solid #29352b;
          border-radius: 12px;
          padding: 14px 17px;
          color: white;
          width: min(100%, 350px);
          outline: none;
          font-family: inherit;
        }

        .search:focus {
          border-color: #b9f27c;
        }

        .refresh {
          background: #b9f27c;
          color: #10180e;
          border: none;
          border-radius: 10px;
          padding: 13px 19px;
          cursor: pointer;
          font-weight: bold;
          font-family: inherit;
        }

        .market-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(245px, 1fr));
          gap: 15px;
        }

        .market-card {
          background: #111713;
          border: 1px solid #26352a;
          border-radius: 17px;
          padding: 20px;
          transition: .2s;
        }

        .market-card:hover {
          border-color: #8ab85c;
          transform: translateY(-3px);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .symbol {
          color: #b9f27c;
          font-weight: bold;
          font-size: 16px;
          direction: ltr;
          text-align: right;
        }

        .asset-name {
          color: #a0aba0;
          font-size: 12px;
          margin-top: 7px;
        }

        .market-dot {
          width: 9px;
          height: 9px;
          background: #b9f27c;
          border-radius: 50%;
          box-shadow: 0 0 12px #b9f27c;
        }

        .price {
          font-size: 25px;
          font-weight: bold;
          margin: 24px 0 12px;
          direction: ltr;
          text-align: right;
          overflow-wrap: anywhere;
        }

        .change-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          margin-bottom: 20px;
        }

        .positive {
          color: #9be875;
          direction: ltr;
        }

        .negative {
          color: #ff7777;
          direction: ltr;
        }

        .muted {
          color: #899589;
        }

        .card-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 13px;
          border-top: 1px solid #263229;
          padding-top: 15px;
        }

        .card-details div {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        .card-details span {
          color: #879287;
          font-size: 11px;
        }

        .card-details b {
          font-size: 12px;
          direction: ltr;
          text-align: right;
          overflow-wrap: anywhere;
        }

        .exchange {
          color: #788477;
          font-size: 10px;
          margin-top: 18px;
          direction: ltr;
          text-align: right;
        }

        .section-title {
          font-size: 19px;
          margin: 35px 0 17px;
        }

        .ranking-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .ranking-box {
          background: #111713;
          border: 1px solid #26352a;
          border-radius: 16px;
          padding: 18px;
        }

        .ranking-box h3 {
          font-size: 14px;
          margin: 0 0 15px;
        }

        .ranking-item {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 11px 0;
          border-top: 1px solid #273229;
          font-size: 12px;
        }

        .ranking-item b {
          direction: ltr;
        }

        .notice {
          border: 1px solid #53452a;
          background: #211d12;
          color: #e8d49a;
          padding: 18px;
          border-radius: 13px;
          margin: 20px 0;
          line-height: 2;
          font-size: 12px;
        }

        .error {
          border: 1px solid #633737;
          background: #241515;
          color: #ffaaaa;
          padding: 16px;
          border-radius: 12px;
          margin: 18px 0;
          line-height: 2;
          font-size: 12px;
        }

        .empty {
          padding: 40px 20px;
          text-align: center;
          color: #9ca99b;
          background: #111713;
          border: 1px dashed #354438;
          border-radius: 15px;
          line-height: 2;
        }

        .footer {
          text-align: center;
          color: #697569;
          font-size: 11px;
          padding: 40px 0 15px;
        }

        @media (max-width: 600px) {
          .markets-page {
            padding: 20px 15px;
          }

          .hero {
            padding: 22px;
          }

          .ranking-grid {
            grid-template-columns: 1fr;
          }

          .price {
            font-size: 22px;
          }
        }
      `}</style>

      <header className="markets-header">
        <div>
          <div className="brand">
            ECONOVA <span>MARKETS</span>
          </div>
          <div className="header-tag">
            مرکز اطلاعات بازارهای مالی جهان
          </div>
        </div>

        <div className="live-label">● اتصال به داده‌های بازار</div>
      </header>

      <section className="hero">
        <h1>
          جهان بازارهای مالی در <span>یک نگاه</span>
        </h1>
        <p>
          بررسی شاخص‌های جهانی، سهام شرکت‌های بزرگ و بازارهای مالی.
          اطلاعات فقط در صورت دریافت موفق از منبع داده نمایش داده می‌شوند.
        </p>
      </section>

      <nav className="tabs">
        {tabs.map((item) => (
          <button
            key={item.id}
            className={`tab ${tab === item.id ? "active" : ""}`}
            onClick={() => {
              setTab(item.id);
              setSearch("");
              setError("");
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "iran" ? (
        <div className="notice">
          <strong>بورس ایران</strong>
          <br />
          بخش بورس ایران در حال آماده‌سازی اتصال به منبع داده معتبر است.
          تا زمان اتصال، هیچ قیمت یا شاخص ساختگی نمایش داده نمی‌شود.
        </div>
      ) : (
        <>
          <div className="toolbar">
            <input
              className="search"
              placeholder="جستجوی نماد یا نام شرکت..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <button
              className="refresh"
              onClick={() => loadData(tab)}
              disabled={loading}
            >
              {loading ? "در حال دریافت..." : "↻ بروزرسانی"}
            </button>
          </div>

          {configured === false && (
            <div className="notice">
              کلید API هنوز در تنظیمات Vercel ثبت نشده است.
              <br />
              نام متغیر موردنیاز: TWELVE_DATA_API_KEY
            </div>
          )}

          {error && <div className="error">{error}</div>}

          <div className="muted" style={{ marginBottom: 15, fontSize: 11 }}>
            {updatedAt ? `آخرین دریافت موفق: ${updatedAt}` : "در انتظار دریافت اطلاعات"}
            {" · "}
            بروزرسانی خودکار هر ۳ دقیقه
          </div>

          {loading && data.length === 0 ? (
            <div className="empty">در حال دریافت اطلاعات بازار...</div>
          ) : filtered.length > 0 ? (
            <div className="market-grid">
              {filtered.map((item) => {
                const fallback = source.find(
                  (x) => x.symbol === item.symbol
                );

                return (
                  <MarketCard
                    key={item.symbol}
                    item={item}
                    fallback={fallback?.name || item.symbol}
                  />
                );
              })}
            </div>
          ) : (
            <div className="empty">
              {error
                ? "در حال حاضر اطلاعات قابل نمایش نیست."
                : "اطلاعاتی برای این جستجو پیدا نشد."}
            </div>
          )}

          {data.length > 0 && (
            <>
              <h2 className="section-title">برترین تغییرات بازار</h2>

              <div className="ranking-grid">
                <div className="ranking-box">
                  <h3 className="positive">بیشترین رشد</h3>
                  {gainers.length ? (
                    gainers.map((item) => (
                      <div className="ranking-item" key={item.symbol}>
                        <span>{item.symbol}</span>
                        <b className="positive">
                          {percent(item.changePercent)}
                        </b>
                      </div>
                    ))
                  ) : (
                    <div className="muted">اطلاعات کافی نیست.</div>
                  )}
                </div>

                <div className="ranking-box">
                  <h3 className="negative">بیشترین افت</h3>
                  {losers.length ? (
                    losers.map((item) => (
                      <div className="ranking-item" key={item.symbol}>
                        <span>{item.symbol}</span>
                        <b className="negative">
                          {percent(item.changePercent)}
                        </b>
                      </div>
                    ))
                  ) : (
                    <div className="muted">اطلاعات کافی نیست.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      <footer className="footer">
        ECONOVA MARKETS · Financial Market Intelligence
      </footer>
    </main>
  );
        }
