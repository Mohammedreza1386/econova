
"use client";

import { useEffect, useState } from "react";

type Coin = {
  symbol: string;
  name: string;
  usd: number | null;
  toman: number | null;
  change24h: number | null;
  updatedAt: string | null;
};

type Currency = {
  code: string;
  name: string;
  toman: number | null;
  updatedAt: string | null;
};

type GoldCoin = {
  code: string;
  name: string;
  toman: number | null;
  updatedAt: string | null;
};

type MarketTrend = {
  code: string;
  name: string;
  price: number;
  high: number | null;
  low: number | null;
  previousClose: number | null;
  changePct: number | null;
  updatedAt: string | null;
};

type ApiData = {
  items: Coin[];
  currencies: Currency[];
  goldAndCoins: GoldCoin[];
  updatedAt: string | null;
  marketTrend?: MarketTrend[];
  error?: string;
};

const number = (value: number, digits = 2) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);

export default function Home() {
  const [data, setData] = useState<ApiData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadPrices() {
      try {
        const response = await fetch("/api/crypto", {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "دریافت قیمت‌ها ناموفق بود");
        }

        if (active) {
          setData(result);
          setError("");
        }
      } catch {
        if (active) {
          setError("قیمت‌ها فعلاً دریافت نشدند. دوباره تلاش کن.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPrices();
    const timer = window.setInterval(loadPrices, 300000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const styles = `
    * { box-sizing: border-box; }
    body { margin: 0; background: #08111f; color: #edf5ff; font-family: Arial, sans-serif; }
    a { color: inherit; text-decoration: none; }
    .wrap { max-width: 1120px; margin: auto; padding: 0 22px; }
    header { border-bottom: 1px solid #233044; }
    .nav { min-height: 76px; display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap; }
    .logo { font-size: 27px; font-weight: 900; color: #67e8f9; }
    nav { display: flex; gap: 20px; color: #c1cede; font-size: 14px; }
    .hero { padding-top: 65px; padding-bottom: 55px; }
    .eyebrow { color: #67e8f9; font-size: 12px; letter-spacing: 2px; }
    h1 { font-size: clamp(36px, 7vw, 60px); line-height: 1.4; margin: 18px 0; }
    h2 { font-size: 26px; }
    .accent { color: #67e8f9; }
    .intro { color: #aab9cd; line-height: 2; max-width: 650px; }
    .section { padding-bottom: 60px; }
    .head { display: flex; justify-content: space-between; align-items: end; gap: 12px; flex-wrap: wrap; }
    .muted { color: #8494aa; font-size: 12px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; }
    .card { border: 1px solid #263448; background: #101c2d; border-radius: 16px; padding: 20px; min-width: 0; }
    .name { font-size: 17px; font-weight: bold; }
    .symbol { color: #8494aa; font-size: 12px; margin-top: 7px; }
    .price { font-size: 22px; font-weight: bold; overflow-wrap: anywhere; margin-top: 20px; }
    .toman { color: #a5f3fc; font-size: 16px; margin-top: 12px; overflow-wrap: anywhere; }
    .change { font-size: 13px; margin-top: 14px; }
    .currency-section { padding-bottom: 60px; }
    .up { color: #6ee7b7; } .down { color: #fda4af; }
    .panel { border: 1px solid #263448; border-radius: 16px; background: #101c2d; padding: 24px; margin-bottom: 50px; }
    footer { border-top: 1px solid #233044; color: #8494aa; text-align: center; padding: 25px 12px; font-size: 12px; line-height: 2; }
    @media(max-width: 390px) { .grid { grid-template-columns: 1fr; } nav { gap: 10px; } }
  `;

  return (
    <main dir="rtl">
      <style>{styles}</style>

      <header>
        <div className="wrap nav">
          <a href="#" className="logo">
            ECO<span style={{ color: "#fff" }}>NOVA</span>
          </a>
          <nav>
            <a href="#markets">بازارها</a>
            <a href="#news">اخبار</a>
            <a href="#about">درباره ما</a>
          </nav>
        </div>
      </header>

      <section className="wrap hero">
        <p className="eyebrow">ECONOMIC INTELLIGENCE</p>
        <h1>
          نبض بازارها،
          <br />
          <span className="accent">در یک نگاه</span>
        </h1>
        <p className="intro">
          قیمت ارزهای دیجیتال را به دلار و تومان دنبال کن.
          اطلاعات از منبع دادهٔ بازار دریافت می‌شوند و ممکن است با تأخیر باشند.
        </p>
      </section>

      <section className="wrap section" id="markets">
        <div className="head">
          <div>
            <p className="eyebrow">CRYPTO MARKET</p>
            <h2>قیمت ارزهای دیجیتال</h2>
          </div>
          <span className="muted">به‌روزرسانی خودکار هر ۵ دقیقه</span>
        </div>

        {loading && <p>در حال دریافت قیمت‌ها...</p>}
        {error && <p style={{ color: "#fda4af" }}>{error}</p>}

        {data && data.items.length === 0 && (
          <p>در حال حاضر قیمتی برای نمایش موجود نیست.</p>
        )}

        {data && data.items.length > 0 && (
          <div className="grid">
            {data.items.map((coin) => (
              <article className="card" key={coin.symbol}>
                <div className="name">{coin.name}</div>
                <div className="symbol">{coin.symbol}</div>

                <div className="price">
                  {coin.usd !== null
                    ? "$" + number(coin.usd, 8)
                    : "قیمت دلاری موجود نیست"}
                </div>

                <div className="toman">
                  {coin.toman !== null
                    ? number(coin.toman, 0) + " تومان"
                    : "قیمت تومانی موجود نیست"}
                </div>

                {coin.change24h !== null && (
                  <div className={
                    "change " + (coin.change24h >= 0 ? "up" : "down")
                  }>
                    تغییر گزارش‌شده: {number(coin.change24h)}٪
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

  {data?.marketTrend && data.marketTrend.length > 0 && (
    <div className="card" style={{ marginTop: 20 }}>
      <h2>نمودار تغییرات و روند بازار</h2>
      <p className="muted">
        محدوده قیمت روز و درصد تغییر نسبت به قیمت پایانی قبلی
      </p>

      {data.marketTrend.map((item) => {
        const low = item.low ?? item.price;
        const high = item.high ?? item.price;
        const range = high - low;
        const position =
          range > 0
            ? Math.max(0, Math.min(100, ((item.price - low) / range) * 100))
            : 50;

        return (
          <div key={item.code} style={{ marginTop: 22 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <strong>{item.name}</strong>
              
<span
  style={{
    color:
      item.changePct === null
        ? "#94a3b8"
        : item.changePct > 0
          ? "#22c55e"
          : item.changePct < 0
            ? "#ef4444"
            : "#94a3b8",
    fontWeight: 700,
  }}
>
  {item.changePct !== null
    ? `${item.changePct > 0 ? "+" : ""}${item.changePct}%`
    : "درصد تغییر ناموجود"}
</span>

            </div>

            <div className="muted" style={{ marginTop: 8 }}>
              قیمت فعلی: {number(item.price, 0)} تومان
            </div>

            <div
              style={{
                height: 10,
                background: "#263447",
                borderRadius: 10,
                marginTop: 12,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${position}%`,
                  height: "100%",
                  background: "#22d3ee",
                  borderRadius: 10,
                }}
              />
            </div>

            <div
              className="muted"
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 6,
                fontSize: 12,
              }}
            >
              <span>کمینه: {number(low, 0)}</span>
              <span>بیشینه: {number(high, 0)}</span>
            </div>
          </div>
        );
      })}
    </div>
  )}
        
        <p className="muted" style={{ marginTop: 20, lineHeight: 2 }}>
          منبع داده:{" "}
          <a href="https://iran-market.github.io/" target="_blank" rel="noreferrer">
            Iran Market Data
          </a>
          <br />
          قیمت‌ها ممکن است تأخیر داشته باشند و برای تصمیم‌گیری مالی تضمین‌شده نیستند.
        </p>
      </section>

<section className="wrap currency-section" id="currencies">
  <div className="head">
    <div>
      <p className="eyebrow">CURRENCY MARKET</p>
      <h2>قیمت ارزهای رایج</h2>
    </div>
    <span className="muted">قیمت به تومان</span>
  </div>

  {!data?.currencies?.length && !loading && (
    <p>قیمت ارزها در حال حاضر در دسترس نیست.</p>
  )}

  {data?.currencies && data.currencies.length > 0 && (
    <div className="grid">
      {data.currencies.map((currency) => (
        <article className="card" key={currency.code}>
          <div className="name">{currency.name}</div>
          <div className="symbol">{currency.code}</div>
          <div className="toman">
            {currency.toman !== null
              ? number(currency.toman, 2) + " تومان"
              : "قیمت موجود نیست"}
          </div>
        </article>
      ))}
    </div>
  )}

  <p className="muted" style={{ marginTop: 20, lineHeight: 2 }}>
    منبع قیمت‌ها: Iran Market Data
  </p>
</section>
      
<section className="wrap section" id="gold">
  <div className="head">
    <div>
      <p className="eyebrow">GOLD & COIN MARKET</p>
      <h2>قیمت طلا و سکه</h2>
    </div>
    <span className="muted">قیمت به تومان</span>
  </div>

  {!loading && !data?.goldAndCoins?.length && (
    <p>قیمت طلا و سکه فعلاً در دسترس نیست.</p>
  )}

  {data?.goldAndCoins && data.goldAndCoins.length > 0 && (
    <div className="grid">
      {data.goldAndCoins.map((item) => (
        <article className="card" key={item.code}>
          <div className="name">{item.name}</div>
          <div className="symbol">{item.code}</div>
          <div className="toman">
            {item.toman !== null
              ? number(item.toman, 0) + " تومان"
              : "قیمت موجود نیست"}
          </div>
        </article>
      ))}
    </div>
  )}

  <p className="muted" style={{ marginTop: 20, lineHeight: 2 }}>
    منبع داده: Iran Market Data. قیمت‌ها ممکن است با تأخیر باشند.
  </p>
</section>
      
      <section className="wrap" id="news">
        <div className="panel">
          <p className="eyebrow">ECONOMIC BRIEFING</p>
          <h2>اخبار اقتصادی</h2>
          <p className="intro">
            بخش اخبار در مرحلهٔ بعد به منبع خبری متصل خواهد شد.
          </p>
        </div>
      </section>

      <footer id="about">
        <div>© Econova</div>
        داشبورد بازارها و اطلاعات اقتصادی
      </footer>
    </main>
  );
}
