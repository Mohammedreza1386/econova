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

type OilPrice = {
  code: string;
  name: string;
  usd: number | null;
  unit: string;
  changePct: number | null;
  updatedAt: string | null;
};

type ApiData = {
  items: Coin[];
  currencies: Currency[];
  oilPrices?: OilPrice[];
  goldAndCoins: GoldCoin[];
  updatedAt: string | null;
  marketTrend?: MarketTrend[];
  error?: string;
};

const number = (value: number, digits = 2) =>
  new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: digits,
  }).format(value);

const normalizeDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) =>
      String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
    )
    .replace(/[٠-٩]/g, (digit) =>
      String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))
    );

const parsianWeights = [100, 200, 300, 400, 500, 600, 700];

const money = (value: number | null, digits = 0) =>
  value === null
    ? "قیمت موجود نیست"
    : `${number(value, digits)} تومان`;

export default function Home() {
  const [data, setData] = useState<ApiData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPrices() {
      try {
        const response = await fetch("/api/crypto", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "دریافت قیمت‌ها ناموفق بود"
          );
        }

        if (active) {
          setData(result);
          setError("");
          setLastUpdated(
            new Date().toLocaleTimeString("fa-IR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        }
      } catch {
        if (active) {
          setError(
            "دریافت اطلاعات بازار ناموفق بود. اتصال API را بررسی کن و دوباره تلاش کن."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPrices();

    const timer = window.setInterval(loadPrices, 300000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const gold18k = data?.goldAndCoins.find((item) => {
    const label = normalizeDigits(
      `${item.code} ${item.name}`
    ).toLowerCase();

    const isGold =
      label.includes("طلا") || label.includes("gold");

    const is18K =
      label.includes("18") ||
      label.includes("عیار 18") ||
      label.includes("18k");

    return isGold && is18K;
  });

  const gold18kPrice = gold18k?.toman ?? null;

  const styles = `
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; scroll-padding-top: 90px; }
    body {
      margin: 0;
      background: #070b12;
      color: #f4f2ec;
      font-family: Tahoma, Arial, sans-serif;
    }
    a { color: inherit; text-decoration: none; }
    button { font: inherit; }
    .site {
      min-height: 100vh;
      overflow: hidden;
      background:
        radial-gradient(ellipse at 80% 0%, rgba(28,78,62,.22), transparent 38%),
        #070b12;
    }
    .wrap {
      width: min(1160px, calc(100% - 40px));
      margin: 0 auto;
    }
    .topline {
      height: 3px;
      background: linear-gradient(90deg, #9f7b37, #d9bd77, #275b49, #9f7b37);
    }
    .header {
      position: sticky;
      top: 0;
      z-index: 20;
      border-bottom: 1px solid rgba(210,190,133,.16);
      background: rgba(7,11,18,.9);
      backdrop-filter: blur(16px);
    }
    .nav {
      min-height: 78px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 22px;
    }
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 11px;
      font-size: 25px;
      font-weight: 900;
      letter-spacing: 1.5px;
      white-space: nowrap;
    }
    .logo-mark {
      display: grid;
      place-items: center;
      width: 37px;
      height: 37px;
      border: 1px solid #b99a55;
      border-radius: 12px 4px 12px 4px;
      color: #e4c779;
      font-size: 18px;
    }
    .logo span:last-child { color: #d9bd77; }
    .navlinks {
      display: flex;
      flex-wrap: wrap;
      gap: 19px;
      align-items: center;
      color: #aab4c0;
      font-size: 12px;
    }
    .navlinks a:hover { color: #e2c77f; }
    .nav-cta {
      padding: 10px 14px;
      border: 1px solid rgba(217,189,119,.5);
      border-radius: 8px;
      color: #e8d59d !important;
    }
    .hero {
      position: relative;
      padding-top: 86px;
      padding-bottom: 64px;
    }
    .hero:after {
      content: "";
      position: absolute;
      z-index: 0;
      left: -90px;
      top: 50px;
      width: 340px;
      height: 340px;
      border: 1px solid rgba(217,189,119,.09);
      border-radius: 50%;
      box-shadow:
        0 0 0 35px rgba(217,189,119,.018),
        0 0 0 75px rgba(217,189,119,.014);
      pointer-events: none;
    }
    .hero-content { position: relative; z-index: 1; max-width: 800px; }
    .eyebrow {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 0 14px;
      color: #d6b96d;
      font-size: 10px;
      letter-spacing: 2.7px;
      font-weight: 800;
    }
    .eyebrow:before {
      content: "";
      width: 25px;
      height: 1px;
      background: #b99a55;
    }
    h1 {
      max-width: 790px;
      margin: 0;
      font-size: clamp(36px, 6.4vw, 70px);
      line-height: 1.45;
      letter-spacing: -.8px;
    }
    .gold-text { color: #e2c77f; }
    .hero-desc {
      max-width: 650px;
      margin: 20px 0 0;
      color: #9ba7b5;
      line-height: 2.2;
      font-size: 14px;
    }
    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 28px;
    }
    .btn {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      padding: 12px 18px;
      border-radius: 9px;
      border: 1px solid rgba(217,189,119,.45);
      font-size: 12px;
      font-weight: 700;
    }
    .btn-primary {
      background: linear-gradient(135deg, #d9bd77, #a8843e);
      color: #11140f;
      border-color: transparent;
    }
    .btn-secondary {
      color: #e4d5ac;
      background: rgba(255,255,255,.025);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0,1fr));
      gap: 12px;
      margin-top: 44px;
      max-width: 760px;
    }
    .stat {
      padding: 17px 18px;
      border: 1px solid rgba(210,190,133,.15);
      background: rgba(17,24,33,.72);
      border-radius: 12px;
    }
    .stat-label { color: #8f9ba9; font-size: 11px; }
    .stat-value {
      margin-top: 9px;
      color: #ead8a4;
      font-size: 19px;
      font-weight: 800;
    }
    .section { padding: 34px 0 54px; }
    .section-head {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 18px;
      flex-wrap: wrap;
      margin-bottom: 23px;
    }
    h2 {
      margin: 0;
      font-size: clamp(22px, 3vw, 30px);
      line-height: 1.7;
    }
    .section-sub {
      margin: 7px 0 0;
      color: #8794a4;
      font-size: 12px;
      line-height: 1.9;
    }
    .tiny-label { color: #8794a4; font-size: 11px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0,1fr));
      gap: 15px;
    }
    .card {
      position: relative;
      min-width: 0;
      padding: 20px;
      border: 1px solid rgba(180,190,199,.13);
      border-radius: 14px;
      background: linear-gradient(145deg, rgba(21,30,41,.96), rgba(12,18,27,.98));
      box-shadow: 0 12px 32px rgba(0,0,0,.13);
      transition: transform .2s ease, border-color .2s ease;
    }
    .card:hover {
      transform: translateY(-3px);
      border-color: rgba(217,189,119,.38);
    }
    .card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .name {
      font-size: 15px;
      font-weight: 800;
      line-height: 1.8;
      overflow-wrap: anywhere;
    }
    .symbol {
      color: #8290a0;
      font-size: 10px;
      margin-top: 4px;
      direction: ltr;
      text-align: right;
    }
    .coin-mark {
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      width: 38px;
      height: 38px;
      border-radius: 12px;
      color: #e2c77f;
      background: rgba(217,189,119,.09);
      border: 1px solid rgba(217,189,119,.17);
      font-weight: 900;
    }
    .price {
      margin-top: 20px;
      font-size: clamp(18px, 2vw, 23px);
      font-weight: 800;
      overflow-wrap: anywhere;
      direction: ltr;
      text-align: right;
    }
    .price-label { margin-top: 6px; color: #8794a4; font-size: 10px; }
    .toman {
      color: #e2c77f;
      font-size: 15px;
      margin-top: 12px;
      overflow-wrap: anywhere;
      font-weight: 700;
    }
    .change {
      display: inline-flex;
      margin-top: 14px;
      padding: 6px 9px;
      border-radius: 7px;
      font-size: 11px;
    }
    .up { color: #7dd8b1; background: rgba(45,148,105,.11); }
    .down { color: #f3a3a3; background: rgba(190,67,67,.11); }
    .muted { color: #8290a0; font-size: 11px; line-height: 1.9; }
    .status {
      padding: 14px 16px;
      border: 1px solid rgba(217,189,119,.16);
      border-radius: 10px;
      color: #aab4c0;
      background: rgba(255,255,255,.025);
      font-size: 12px;
      line-height: 2;
    }
    .trend-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0,1fr));
      gap: 14px;
      margin-top: 18px;
    }
    .trend-card {
      padding: 18px;
      border: 1px solid rgba(180,190,199,.13);
      border-radius: 13px;
      background: #0e1621;
    }
    .trend-line {
      height: 7px;
      overflow: hidden;
      border-radius: 99px;
      background: #25303d;
      margin-top: 14px;
    }
    .trend-fill {
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #547c62, #d9bd77);
    }
    .trend-range {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 8px;
      color: #8492a2;
      font-size: 10px;
    }
    .gold-panel {
      border: 1px solid rgba(217,189,119,.24);
      border-radius: 18px;
      padding: 23px;
      background:
        radial-gradient(ellipse at 100% 0%, rgba(153,119,50,.13), transparent 45%),
        linear-gradient(140deg, #121a23, #0b1119);
    }
    .gold-panel .grid { margin-top: 22px; }
    .parsian-card { border-color: rgba(217,189,119,.24); }
    .parsian-weight { color: #e2c77f; font-size: 11px; margin-top: 8px; }
    .trend-positive { color: #7dd8b1; }
    .trend-negative { color: #f3a3a3; }
    .news-panel {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      flex-wrap: wrap;
      border: 1px solid rgba(180,190,199,.13);
      border-radius: 16px;
      padding: 25px;
      background: linear-gradient(110deg, rgba(30,47,42,.45), rgba(14,21,30,.95));
    }
    .news-symbol {
      display: grid;
      place-items: center;
      width: 58px;
      height: 58px;
      border-radius: 16px;
      border: 1px solid rgba(217,189,119,.28);
      color: #d9bd77;
      font-size: 24px;
    }
    footer {
      border-top: 1px solid rgba(210,190,133,.14);
      padding: 28px 0;
      color: #7e8b99;
      font-size: 11px;
      line-height: 2.1;
    }
    .footer-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
      flex-wrap: wrap;
    }
    .footer-brand { color: #d9bd77; font-weight: 900; letter-spacing: 1px; }
    @media (max-width: 850px) {
      .nav { padding: 15px 0; align-items: flex-start; flex-direction: column; }
      .navlinks { gap: 14px; }
      .grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
      .hero { padding-top: 60px; }
    }
    @media (max-width: 560px) {
      .wrap { width: min(100% - 28px, 1160px); }
      .navlinks { font-size: 11px; gap: 11px; }
      .nav-cta { padding: 7px 9px; }
      .hero { padding-top: 44px; padding-bottom: 40px; }
      .stats { grid-template-columns: 1fr; margin-top: 28px; }
      .grid, .trend-list { grid-template-columns: 1fr; }
      .section { padding: 25px 0 38px; }
      .card { padding: 17px; }
      .gold-panel { padding: 16px; }
    }
  `;

  return (
    <main className="site" dir="rtl">
      <style>{styles}</style>
      <div className="topline" />

      <header className="header">
        <div className="wrap nav">
          <a href="#top" className="logo" aria-label="Econova home">
            <span className="logo-mark">E</span>
            <span>ECO<span>NOVA</span></span>
          </a>
          <nav className="navlinks" aria-label="ناوبری اصلی">
            <a href="#markets">بازارها</a>
            <a href="#currencies">ارزها</a>
            <a href="#oil">نفت</a>
            <a href="#gold">طلا و سکه</a>
            <a href="#parsian">پارسیان</a>
            <a href="/billionaires" className="nav-cta">میلیاردرها ↗</a>
            <a href="#news">اخبار</a>
          </nav>
        </div>
      </header>

      <section className="wrap hero" id="top">
        <div className="hero-content">
          <p className="eyebrow">ECONOMIC INTELLIGENCE · EST. ECONOVA</p>
          <h1>
            نبض بازارها،
            <br />
            <span className="gold-text">با نگاهی دقیق‌تر.</span>
          </h1>
          <p className="hero-desc">
            داشبورد اقتصادی Econova برای دنبال‌کردن قیمت ارزهای دیجیتال،
            ارزهای رایج، طلا و سکه؛ اطلاعات بازار را یک‌جا ببین و
            تغییرات را ساده‌تر دنبال کن.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#markets">
              مشاهده بازارها <span>↘</span>
            </a>
            <a className="btn btn-secondary" href="#parsian">
              قیمت سکه پارسیان
            </a>
          </div>
          <div className="stats">
            <div className="stat">
              <div className="stat-label">وضعیت دریافت داده</div>
              <div className="stat-value">
                {loading ? "در حال اتصال…" : error ? "نیازمند بررسی" : data ? "متصل" : "آماده"}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">آخرین بررسی در این صفحه</div>
              <div className="stat-value">{lastUpdated ?? "—"}</div>
            </div>
            <div className="stat">
              <div className="stat-label">بازهٔ به‌روزرسانی</div>
              <div className="stat-value">۵ دقیقه</div>
            </div>
          </div>
        </div>
      </section>
            <section className="wrap section" id="markets">
        <div className="section-head">
          <div>
            <p className="eyebrow">01 / CRYPTO MARKET</p>
            <h2>بازار ارزهای دیجیتال</h2>
            <p className="section-sub">قیمت دارایی‌های دیجیتال به دلار و تومان</p>
          </div>
          <span className="tiny-label">به‌روزرسانی خودکار هر ۵ دقیقه</span>
        </div>

        {loading && (
          <p className="status">در حال دریافت قیمت‌ها از منبع داده…</p>
        )}

        {error && (
          <p className="status" role="alert">{error}</p>
        )}

        {data && data.items.length === 0 && (
          <p className="status">در حال حاضر قیمتی برای نمایش موجود نیست.</p>
        )}

        {data && data.items.length > 0 && (
          <div className="grid">
            {data.items.map((coin) => (
              <article className="card" key={coin.symbol}>
                <div className="card-top">
                  <div>
                    <div className="name">{coin.name}</div>
                    <div className="symbol">{coin.symbol}</div>
                  </div>
                  <div className="coin-mark">₿</div>
                </div>

                <div className="price">
                  {coin.usd !== null ? `$${number(coin.usd, 8)}` : "—"}
                </div>
                <div className="price-label">قیمت دلاری</div>
                <div className="toman">{money(coin.toman)}</div>

                {coin.change24h !== null && (
                  <div className={`change ${coin.change24h >= 0 ? "up" : "down"}`}>
                    {coin.change24h > 0 ? "+" : ""}
                    {number(coin.change24h)}٪ در ۲۴ ساعت
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {data?.marketTrend && data.marketTrend.length > 0 && (
          <>
            <div
              className="section-head"
              style={{ marginTop: 36, marginBottom: 14 }}
            >
              <div>
                <p className="eyebrow">MARKET PULSE</p>
                <h2>روند و دامنهٔ روزانه</h2>
              </div>
            </div>

            <div className="trend-list">
              {data.marketTrend.map((item) => {
                const low = item.low ?? item.price;
                const high = item.high ?? item.price;
                const range = high - low;
                const position =
                  range > 0
                    ? Math.max(
                        0,
                        Math.min(100, ((item.price - low) / range) * 100)
                      )
                    : 50;

                return (
                  <div className="trend-card" key={item.code}>
                    <div className="card-top">
                      <strong>{item.name}</strong>
                      <strong
                        className={
                          item.changePct === null
                            ? "muted"
                            : item.changePct >= 0
                              ? "trend-positive"
                              : "trend-negative"
                        }
                      >
                        {item.changePct === null
                          ? "—"
                          : `${item.changePct > 0 ? "+" : ""}${number(item.changePct)}٪`}
                      </strong>
                    </div>

                    <div className="toman">{money(item.price)}</div>

                    <div className="trend-line">
                      <div
                        className="trend-fill"
                        style={{ width: `${position}%` }}
                      />
                    </div>

                    <div className="trend-range">
                      <span>کمینه: {number(low, 0)}</span>
                      <span>بیشینه: {number(high, 0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <p className="muted" style={{ marginTop: 20 }}>
          منبع داده:{" "}
          <a
            href="https://iran-market.github.io/"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#d9bd77" }}
          >
            Iran Market Data
          </a>
          . قیمت‌ها ممکن است با تأخیر همراه باشند و تضمین‌شده نیستند.
        </p>
      </section>

      <section className="wrap section" id="currencies">
        <div className="section-head">
          <div>
            <p className="eyebrow">02 / CURRENCY MARKET</p>
            <h2>ارزهای رایج</h2>
            <p className="section-sub">نرخ‌های دریافت‌شده از منبع داده، به تومان</p>
          </div>
          <span className="tiny-label">CURRENCY WATCH</span>
        </div>

        {!data?.currencies?.length && !loading && (
          <p className="status">قیمت ارزها در حال حاضر در دسترس نیست.</p>
        )}

        {data?.currencies && data.currencies.length > 0 && (
          <div className="grid">
            {data.currencies.map((currency) => (
              <article className="card" key={currency.code}>
                <div className="card-top">
                  <div>
                    <div className="name">{currency.name}</div>
                    <div className="symbol">{currency.code}</div>
                  </div>
                  <div className="coin-mark">¤</div>
                </div>
                <div className="toman" style={{ fontSize: 20 }}>
                  {money(currency.toman, 2)}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="wrap section" id="oil">
        <div className="section-head">
          <div>
            <p className="eyebrow">OIL MARKET</p>
            <h2>قیمت جهانی نفت</h2>
            <p className="section-sub">قیمت هر بشکه به دلار آمریکا</p>
          </div>
          <span className="tiny-label">ENERGY WATCH</span>
        </div>

        {!data?.oilPrices?.length && !loading && (
          <p className="status">قیمت نفت در حال حاضر در دسترس نیست.</p>
        )}

        {data?.oilPrices && data.oilPrices.length > 0 && (
          <div className="grid">
            {data.oilPrices.map((oil) => (
              <article className="card" key={oil.code}>
                <div className="card-top">
                  <div>
                    <div className="name">{oil.name}</div>
                    <div className="symbol">{oil.code}</div>
                  </div>
                  <div className="coin-mark">OIL</div>
                </div>

                <div className="price">
                  {oil.usd !== null
                    ? `$${Number(oil.usd).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "قیمت در دسترس نیست"}
                </div>

                <div className="price-label">{oil.unit}</div>

                {oil.changePct !== null && (
                  <div className={`change ${oil.changePct >= 0 ? "up" : "down"}`}>
                    {oil.changePct > 0 ? "+" : ""}
                    {number(oil.changePct)}٪
                  </div>
                )}

                <div className="muted" style={{ marginTop: 12 }}>
                  آخرین داده:{" "}
                  {oil.updatedAt
                    ? new Date(oil.updatedAt).toLocaleString("fa-IR")
                    : "نامشخص"}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="wrap section" id="gold">
        <div className="section-head">
          <div>
            <p className="eyebrow">03 / GOLD & COIN MARKET</p>
            <h2>طلا و سکه</h2>
            <p className="section-sub">قیمت‌های اعلام‌شده توسط API بازار</p>
          </div>
          <span className="tiny-label">GOLD WATCH</span>
        </div>

        {!loading && !data?.goldAndCoins?.length && (
          <p className="status">قیمت طلا و سکه فعلاً در دسترس نیست.</p>
        )}

        {data?.goldAndCoins && data.goldAndCoins.length > 0 && (
          <div className="grid">
            {data.goldAndCoins.map((item) => (
              <article className="card" key={item.code}>
                <div className="card-top">
                  <div>
                    <div className="name">{item.name}</div>
                    <div className="symbol">{item.code}</div>
                  </div>
                  <div className="coin-mark">✦</div>
                </div>

                <div className="toman" style={{ fontSize: 19 }}>
                  {money(item.toman)}
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="muted" style={{ marginTop: 18 }}>
          منبع داده: Iran Market Data. نرخ‌ها ممکن است با تأخیر باشند.
        </p>
      </section>
            <section className="wrap section" id="parsian">
        <div className="gold-panel">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <div>
              <p className="eyebrow">04 / PARSIAN GOLD COINS</p>
              <h2>برآورد سکه‌های پارسیان</h2>
              <p className="section-sub">
                وزن‌های ۱۰۰ تا ۷۰۰ سوت، محاسبه‌شده بر پایهٔ نرخ هر گرم طلای ۱۸ عیار
              </p>
            </div>
            <span className="tiny-label">GOLD ESTIMATE</span>
          </div>

          <p className="muted" style={{ marginTop: 15 }}>
            این ارقام فقط برآورد ارزش طلای محتوی سکه‌اند و قیمت قطعی فروش نیستند؛
            اجرت، بسته‌بندی، سود فروشنده و اختلاف قیمت بازار در آن‌ها لحاظ نشده است.
          </p>

          {gold18kPrice === null ? (
            <div className="status" style={{ marginTop: 20 }}>
              برای محاسبهٔ برآورد، نرخ معتبر طلای ۱۸ عیار در پاسخ API پیدا نشد.
              نام و کد دقیق این نرخ باید در داده‌های /api/crypto بررسی شود.
            </div>
          ) : (
            <div className="grid">
              {parsianWeights.map((weight) => (
                <article className="card parsian-card" key={weight}>
                  <div className="card-top">
                    <div>
                      <div className="name">
                        سکه پارسیان {number(weight, 0)} سوت
                      </div>
                      <div className="parsian-weight">
                        وزن اسمی: {(weight / 1000).toFixed(1)} گرم
                      </div>
                    </div>
                    <div className="coin-mark">✦</div>
                  </div>

                  <div className="toman" style={{ fontSize: 20 }}>
                    {money(Math.round((gold18kPrice * weight) / 1000))}
                  </div>

                  <div className="muted" style={{ marginTop: 10 }}>
                    ارزش تقریبی طلا، بدون هزینه‌های فروش
                  </div>
                </article>
              ))}
            </div>
          )}

          <p className="muted" style={{ marginTop: 18 }}>
            فرمول: قیمت هر گرم طلای ۱۸ عیار × وزن سکه بر حسب گرم.
            نرخ پایه از API موجود در سایت خوانده می‌شود.
          </p>
        </div>
      </section>

      <section className="wrap section" id="billionaires">
        <div className="news-panel">
          <div style={{ display: "flex", alignItems: "center", gap: 17 }}>
            <div className="news-symbol">♛</div>
            <div>
              <p className="eyebrow">WEALTH & INFLUENCE</p>
              <h2>ثروتمندترین افراد جهان</h2>
              <p className="section-sub">
                مشاهدهٔ صفحهٔ جداگانهٔ میلیاردرها و رتبه‌بندی ثروت‌ها
              </p>
            </div>
          </div>

          <a href="/billionaires" className="btn btn-secondary">
            ورود به بخش میلیاردرها ↗
          </a>
        </div>
      </section>

      <section className="wrap section" id="news">
        <div className="news-panel">
          <div style={{ display: "flex", alignItems: "center", gap: 17 }}>
            <div className="news-symbol">⌁</div>
            <div>
              <p className="eyebrow">ECONOMIC BRIEFING</p>
              <h2>اخبار و تحلیل اقتصادی</h2>
              <p className="section-sub">
                بخش اتصال به منبع خبری در مرحلهٔ بعد تکمیل خواهد شد.
              </p>
            </div>
          </div>
          <span className="tiny-label">COMING SOON</span>
        </div>
      </section>

      <footer id="about">
        <div className="wrap footer-inner">
          <div>
            <div className="footer-brand">ECONOVA</div>
            <div>داشبورد بازارها و اطلاعات اقتصادی</div>
          </div>
          <div>© Econova · داده‌ها ممکن است با تأخیر همراه باشند.</div>
        </div>
      </footer>
    </main>
  );
}
