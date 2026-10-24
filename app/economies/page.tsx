
"use client";

import { useEffect, useState } from "react";

type Economy = {
  country: string;
  code: string;
  gdp: number | null;
  year: string | null;
};

const GDP_INDICATOR = "NY.GDP.MKTP.CD";

const styles = `
  * { box-sizing: border-box; }
  .economies-page {
    min-height: 100vh;
    background:
      radial-gradient(ellipse at 85% 0%, rgba(44,90,65,.19), transparent 38%),
      #070b12;
    color: #f4f2ec;
    font-family: Tahoma, Arial, sans-serif;
    direction: rtl;
  }
  .economies-page a { color: inherit; text-decoration: none; }
  .eco-wrap { width: min(1160px, calc(100% - 36px)); margin: auto; }
  .eco-header {
    padding: 25px 0 45px;
    border-bottom: 1px solid rgba(217,189,119,.16);
    background: rgba(7,11,18,.65);
  }
  .eco-topline {
    height: 3px;
    background: linear-gradient(90deg,#947039,#d9bd77,#b9f27c,#947039);
  }
  .eco-back { color: #d9bd77 !important; font-size: 12px; }
  .eco-eyebrow {
    margin: 34px 0 10px;
    color: #b9f27c;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 2px;
    direction: ltr;
    text-align: right;
  }
  .eco-title { margin: 0; font-size: clamp(32px,5vw,54px); line-height: 1.5; }
  .eco-description {
    max-width: 680px;
    color: #9ba7b5;
    font-size: 13px;
    line-height: 2.2;
  }
  .eco-main { padding: 30px 0 55px; }
  .eco-toolbar { display: flex; gap: 12px; margin-bottom: 30px; }
  .eco-search {
    min-width: 0; flex: 1; padding: 14px 16px;
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 10px; background: #101823; color: #fff;
    outline: none; font: inherit; font-size: 12px;
  }
  .eco-search:focus { border-color: #b9f27c; }
  .eco-button {
    padding: 12px 17px; border: 1px solid rgba(217,189,119,.4);
    border-radius: 10px; background: rgba(217,189,119,.06);
    color: #e2c77f; font: inherit; font-size: 12px; cursor: pointer;
  }
  .eco-button:hover { background: rgba(217,189,119,.13); }
  .eco-section-head {
    display: flex; align-items: end; justify-content: space-between;
    flex-wrap: wrap; gap: 14px; margin-bottom: 20px;
  }
  .eco-section-head h2 { margin: 0; font-size: 23px; }
  .eco-muted { color: #8794a4; font-size: 11px; line-height: 2; }
  .eco-source {
    padding: 8px 12px; border: 1px solid rgba(255,255,255,.1);
    border-radius: 30px; color: #b8c1ca; font-size: 10px;
  }
  .eco-panel {
    margin-bottom: 28px; padding: 25px;
    border: 1px solid rgba(185,242,124,.19);
    border-radius: 18px;
    background: linear-gradient(140deg,#111b20,#0b1119 65%,#17150e);
    box-shadow: 0 20px 55px rgba(0,0,0,.2);
  }
  .eco-panel-title { margin: 0 0 8px; font-size: 20px; }
  .eco-bars { display: grid; gap: 13px; margin-top: 25px; }
  .eco-bar-card {
    padding: 15px; border: 1px solid rgba(255,255,255,.07);
    border-radius: 12px; background: rgba(255,255,255,.018);
  }
  .eco-bar-card.first { border-color: rgba(217,189,119,.4); background: rgba(217,189,119,.06); }
  .eco-bar-card.second { border-color: rgba(210,220,230,.2); }
  .eco-bar-card.third { border-color: rgba(185,120,69,.3); }
  .eco-bar-label {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; margin-bottom: 11px; font-size: 12px;
  }
  .eco-country { font-weight: 700; overflow-wrap: anywhere; }
  .eco-money { color: #b9f27c; font-weight: 800; direction: ltr; text-align: left; }
  .eco-track {
    height: 9px; overflow: hidden; border-radius: 30px;
    background: #05080d; border: 1px solid rgba(255,255,255,.06);
  }
  .eco-fill {
    height: 100%; border-radius: inherit;
    background: linear-gradient(90deg,#8bbd54,#b9f27c,#e0d59a);
    box-shadow: 0 0 12px rgba(185,242,124,.2);
    transition: width .7s ease;
  }
  .eco-table-wrap { overflow-x: auto; border: 1px solid rgba(255,255,255,.1); border-radius: 14px; }
  .eco-table { width: 100%; min-width: 600px; border-collapse: collapse; text-align: right; font-size: 12px; }
  .eco-table th { padding: 16px; background: rgba(255,255,255,.04); color: #9ba7b5; font-weight: 500; }
  .eco-table td { padding: 15px 16px; border-top: 1px solid rgba(255,255,255,.07); }
  .eco-table tbody tr:hover { background: rgba(255,255,255,.035); }
  .eco-rank { color: #b9f27c; font-weight: 800; }
  .eco-country-cell { display: flex; align-items: center; gap: 9px; font-weight: 700; }
  .eco-flag { font-size: 21px; }
  .eco-code { margin-top: 5px; color: #738091; font-size: 10px; direction: ltr; text-align: right; }
  .eco-status {
    padding: 18px; border: 1px solid rgba(255,255,255,.1);
    border-radius: 12px; color: #c4cbd2; font-size: 12px; line-height: 2;
  }
  .eco-error { border-color: rgba(240,100,100,.35); background: rgba(120,20,20,.13); }
  .eco-footer {
    margin-top: 35px; padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,.1);
    color: #7e8b99; font-size: 10px; line-height: 2.4;
  }
  .eco-footer a { color: #d9bd77; text-decoration: underline; }
  @media (max-width: 600px) {
    .eco-wrap { width: calc(100% - 26px); }
    .eco-header { padding-bottom: 30px; }
    .eco-toolbar { flex-direction: column; }
    .eco-button { width: 100%; }
    .eco-panel { padding: 15px; }
    .eco-bar-label { font-size: 11px; }
    .eco-section-head h2 { font-size: 20px; }
  }
`;

function formatMoney(value: number | null) {
  if (value === null) return "داده موجود نیست";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function getFlag(code: string) {
  const flags: Record<string, string> = {
    USA: "🇺🇸", CHN: "🇨🇳", JPN: "🇯🇵", DEU: "🇩🇪",
    IND: "🇮🇳", GBR: "🇬🇧", FRA: "🇫🇷", ITA: "🇮🇹",
    RUS: "🇷🇺", BRA: "🇧🇷", CAN: "🇨🇦", KOR: "🇰🇷",
    AUS: "🇦🇺", ESP: "🇪🇸", MEX: "🇲🇽", IDN: "🇮🇩",
    TUR: "🇹🇷", SAU: "🇸🇦", NLD: "🇳🇱", CHE: "🇨🇭",
    IRN: "🇮🇷", PAK: "🇵🇰", POL: "🇵🇱", SWE: "🇸🇪",
    BEL: "🇧🇪", ARG: "🇦🇷", NOR: "🇳🇴", AUT: "🇦🇹",
    THA: "🇹🇭", VNM: "🇻🇳", EGY: "🇪🇬", NGA: "🇳🇬",
    ZAF: "🇿🇦", ARE: "🇦🇪", ISR: "🇮🇱", IRQ: "🇮🇶",
    AFG: "🇦🇫",
  };

  return flags[code] ?? "🌐";
}

export default function EconomiesPage() {
  const [economies, setEconomies] = useState<Economy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadEconomies() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `https://api.worldbank.org/v2/country/all/indicator/${GDP_INDICATOR}?format=json&per_page=20000&date=2020:2026`
        );

        if (!response.ok) {
          throw new Error("دریافت اطلاعات بانک جهانی ناموفق بود.");
        }

        const result = await response.json();
        const rows = result?.[1];

        if (!Array.isArray(rows)) {
          throw new Error("داده‌های GDP معتبر نیستند.");
        }

        const latestByCountry = new Map<string, Economy>();

        for (const row of rows) {
          if (
            !row?.country?.id ||
            !row?.country?.value ||
            !row?.countryiso3code ||
            row?.country?.region?.value === "Aggregates" ||
            row.value === null ||
            !Number.isFinite(Number(row.value))
          ) {
            continue;
          }

          const code = row.countryiso3code;
          const previous = latestByCountry.get(code);

          if (!previous || Number(row.date) > Number(previous.year)) {
            latestByCountry.set(code, {
              country: row.country.value,
              code,
              gdp: Number(row.value),
              year: String(row.date),
            });
          }
        }

        const sorted = Array.from(latestByCountry.values()).sort(
          (a, b) => (b.gdp ?? 0) - (a.gdp ?? 0)
        );

        if (active) setEconomies(sorted);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "خطا در دریافت اطلاعات اقتصادی."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEconomies();

    return () => {
      active = false;
    };
  }, []);

  const top20 = economies.slice(0, 20);

  const visibleEconomies = (showAll ? economies : top20).filter(
    (economy) =>
      `${economy.country} ${economy.code}`
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase())
  );
  
  return (
    <main className="economies-page">
      <style>{styles}</style>
      <div className="eco-topline" />

      <header className="eco-header">
        <div className="eco-wrap">
          <a href="/" className="eco-back">← بازگشت به Econova</a>

          <p className="eco-eyebrow">ECONOVA • WORLD ECONOMIES</p>
          <h1 className="eco-title">اقتصادهای جهان</h1>
          <p className="eco-description">
            رتبه‌بندی اقتصاد کشورها بر اساس تولید ناخالص داخلی اسمی،
            با استفاده از داده‌های منتشرشده بانک جهانی.
          </p>
        </div>
      </header>

      <section className="eco-wrap eco-main">
        <div className="eco-toolbar">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="جست‌وجوی نام کشور یا کد آن..."
            className="eco-search"
            aria-label="جست‌وجوی کشور"
          />

          <button
            onClick={() => setShowAll((current) => !current)}
            className="eco-button"
          >
            {showAll ? "نمایش ۲۰ اقتصاد برتر" : "نمایش فهرست کامل"}
          </button>
        </div>

        <div className="eco-section-head">
          <div>
            <h2>۲۰ اقتصاد بزرگ</h2>
            <p className="eco-muted">معیار: GDP اسمی به دلار آمریکا</p>
          </div>
          <span className="eco-source">منبع: World Bank</span>
        </div>

        {loading && (
          <p className="eco-status">
            در حال دریافت آمار اقتصادی واقعی...
          </p>
        )}

        {!loading && error && (
          <div className="eco-status eco-error">
            <strong>دریافت اطلاعات ناموفق بود</strong>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="eco-button"
            >
              تلاش دوباره
            </button>
          </div>
        )}

        {!loading && !error && economies.length === 0 && (
          <p className="eco-status">
            داده اقتصادی قابل نمایش دریافت نشد. کمی بعد دوباره تلاش کن.
          </p>
        )}

        {!loading && !error && top20.length > 0 && (
          <section className="eco-panel">
            <p className="eco-eyebrow" style={{ marginTop: 0 }}>
              ECONOVA • GDP COMPARISON
            </p>
            <h2 className="eco-panel-title">
              مقایسه ۱۰ اقتصاد بزرگ جهان
            </h2>
            <p className="eco-muted">
              تولید ناخالص داخلی اسمی به دلار آمریکا
            </p>

            <div className="eco-bars">
              {top20.slice(0, 10).map((economy, index) => {
                const maximum = top20[0]?.gdp ?? 1;
                const percentage = Math.max(
                  1,
                  ((economy.gdp ?? 0) / maximum) * 100
                );

                return (
                  <div
                    key={economy.code}
                    className={`eco-bar-card ${
                      index === 0
                        ? "first"
                        : index === 1
                          ? "second"
                          : index === 2
                            ? "third"
                            : ""
                    }`}
                  >
                    <div className="eco-bar-label">
                      <span className="eco-country">
                        <span style={{ color: "#8794a4", marginLeft: 8 }}>
                          {index + 1}.
                        </span>
                        {getFlag(economy.code)} {economy.country}
                      </span>
                      <span className="eco-money">
                        {formatMoney(economy.gdp)}
                      </span>
                    </div>

                    <div className="eco-track">
                      <div
                        className="eco-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="eco-muted" style={{ marginTop: 20 }}>
              سال آخرین داده موجود برای هر کشور ممکن است متفاوت باشد.
            </p>
          </section>
        )}

        {!loading && !error && economies.length > 0 && (
          <>
            <div className="eco-section-head">
              <div>
                <h2>
                  {showAll
                    ? "فهرست اقتصادهای جهان"
                    : "رتبه‌بندی ۲۰ اقتصاد برتر"}
                </h2>
                <p className="eco-muted">
                  تعداد نتایج: {visibleEconomies.length}
                </p>
              </div>
            </div>

            {visibleEconomies.length === 0 ? (
              <p className="eco-status">
                کشوری با این نام یا کد پیدا نشد.
              </p>
            ) : (
              <div className="eco-table-wrap">
                <table className="eco-table">
                  <thead>
                    <tr>
                      <th>رتبه</th>
                      <th>کشور / اقتصاد</th>
                      <th>GDP اسمی</th>
                      <th>سال داده</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEconomies.map((economy) => (
                      <tr key={economy.code}>
                        <td className="eco-rank">
                          {economies.findIndex(
                            (item) => item.code === economy.code
                          ) + 1}
                        </td>
                        <td>
                          <div className="eco-country-cell">
                            <span className="eco-flag">
                              {getFlag(economy.code)}
                            </span>
                            <span>{economy.country}</span>
                          </div>
                          <div className="eco-code">{economy.code}</div>
                        </td>
                        <td className="eco-money">
                          {formatMoney(economy.gdp)}
                        </td>
                        <td className="eco-muted">
                          {economy.year ?? "نامشخص"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <footer className="eco-footer">
          منبع: World Bank Open Data · شاخص GDP اسمی
          <br />
          کد شاخص: NY.GDP.MKTP.CD
          <br />
          رتبه‌بندی بر اساس جدیدترین سال موجود برای هر کشور انجام می‌شود؛
          بنابراین سال داده‌ها ممکن است بین کشورها متفاوت باشد.
          <br />
          <a
            href="https://data.worldbank.org/indicator/NY.GDP.MKTP.CD"
            target="_blank"
            rel="noreferrer"
          >
            مشاهده منبع رسمی داده‌ها
          </a>
        </footer>
      </section>
    </main>
  );
}
