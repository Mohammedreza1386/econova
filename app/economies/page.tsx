"use client";

import { useEffect, useState } from "react";

type Economy = {
  country: string;
  code: string;
  gdp: number | null;
  gdpYear: string | null;
  growth: number | null;
  growthYear: string | null;
  gdpPerCapita: number | null;
  gdpPerCapitaYear: string | null;
  population: number | null;
  populationYear: string | null;
};

type IndicatorRow = {
  country?: { id?: string; value?: string; region?: { value?: string } };
  countryiso3code?: string;
  date?: string;
  value?: number | string | null;
};

const INDICATORS = {
  gdp: "NY.GDP.MKTP.CD",
  growth: "NY.GDP.MKTP.KD.ZG",
  gdpPerCapita: "NY.GDP.PCAP.CD",
  population: "SP.POP.TOTL",
};

const styles = `
* { box-sizing: border-box; }
.economies-page {
  min-height:100vh;
  background:radial-gradient(ellipse at 85% 0%,rgba(44,90,65,.19),transparent 38%),#070b12;
  color:#f4f2ec;font-family:Tahoma,Arial,sans-serif;direction:rtl;
}
.economies-page a {color:inherit;text-decoration:none}
.eco-wrap {width:min(1160px,calc(100% - 36px));margin:auto}
.eco-topline {height:3px;background:linear-gradient(90deg,#947039,#d9bd77,#b9f27c,#947039)}
.eco-header {padding:25px 0 38px;border-bottom:1px solid rgba(217,189,119,.16);background:rgba(7,11,18,.65)}
.eco-back {color:#d9bd77!important;font-size:12px}
.eco-eyebrow {margin:30px 0 10px;color:#b9f27c;font-size:10px;font-weight:800;letter-spacing:2px;direction:ltr;text-align:right}
.eco-title {margin:0;font-size:clamp(32px,5vw,54px);line-height:1.5}
.eco-description {max-width:700px;color:#9ba7b5;font-size:13px;line-height:2.2}
.eco-main {padding:30px 0 55px}
.eco-toolbar {display:flex;gap:12px;margin-bottom:28px}
.eco-search {min-width:0;flex:1;padding:14px 16px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:#101823;color:#fff;outline:none;font:inherit;font-size:12px}
.eco-search:focus {border-color:#b9f27c}
.eco-button {padding:12px 17px;border:1px solid rgba(217,189,119,.4);border-radius:10px;background:rgba(217,189,119,.06);color:#e2c77f;font:inherit;font-size:12px;cursor:pointer}
.eco-button:hover {background:rgba(217,189,119,.13)}
.eco-section-head {display:flex;align-items:end;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:18px}
.eco-section-head h2 {margin:0;font-size:22px}
.eco-muted {color:#8794a4;font-size:11px;line-height:2}
.eco-source {padding:8px 12px;border:1px solid rgba(255,255,255,.1);border-radius:30px;color:#b8c1ca;font-size:10px}
.eco-panel {margin-bottom:28px;padding:24px;border:1px solid rgba(185,242,124,.19);border-radius:18px;background:linear-gradient(140deg,#111b20,#0b1119 65%,#17150e);box-shadow:0 20px 55px rgba(0,0,0,.2)}
.eco-panel-title {margin:0 0 8px;font-size:20px}
.eco-bars {display:grid;gap:13px;margin-top:25px}
.eco-bar-card {padding:15px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(255,255,255,.018)}
.eco-bar-card.first {border-color:rgba(217,189,119,.4);background:rgba(217,189,119,.06)}
.eco-bar-card.second {border-color:rgba(210,220,230,.2)}
.eco-bar-card.third {border-color:rgba(185,120,69,.3)}
.eco-bar-label {display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:11px;font-size:12px}
.eco-country {font-weight:700;overflow-wrap:anywhere}
.eco-money {color:#b9f27c;font-weight:800;direction:ltr;text-align:left;white-space:nowrap}
.eco-track {height:9px;overflow:hidden;border-radius:30px;background:#05080d;border:1px solid rgba(255,255,255,.06)}
.eco-fill {height:100%;border-radius:inherit;background:linear-gradient(90deg,#8bbd54,#b9f27c,#e0d59a);transition:width .7s ease}
.eco-table-wrap {overflow-x:auto;border:1px solid rgba(255,255,255,.1);border-radius:14px}
.eco-table {width:100%;min-width:1040px;border-collapse:collapse;text-align:right;font-size:12px}
.eco-table th {padding:15px 12px;background:rgba(255,255,255,.04);color:#9ba7b5;font-weight:500;white-space:nowrap}
.eco-table td {padding:14px 12px;border-top:1px solid rgba(255,255,255,.07);vertical-align:middle}
.eco-table tbody tr:hover {background:rgba(255,255,255,.035)}
.eco-rank {color:#b9f27c;font-weight:800}
.eco-country-cell {display:flex;align-items:center;gap:9px;font-weight:700;min-width:130px}
.eco-flag {font-size:21px}
.eco-code {margin-top:5px;color:#738091;font-size:10px;direction:ltr;text-align:right}
.eco-status {padding:18px;border:1px solid rgba(255,255,255,.1);border-radius:12px;color:#c4cbd2;font-size:12px;line-height:2}
.eco-error {border-color:rgba(240,100,100,.35);background:rgba(120,20,20,.13)}
.eco-metric {direction:ltr;text-align:right;white-space:nowrap;color:#e5e9ed}
.eco-footer {margin-top:35px;padding-top:20px;border-top:1px solid rgba(255,255,255,.1);color:#7e8b99;font-size:10px;line-height:2.4}
.eco-footer a {color:#d9bd77;text-decoration:underline}
@media(max-width:600px) {
 .eco-wrap {width:calc(100% - 26px)}
 .eco-header {padding-bottom:28px}
 .eco-toolbar {flex-direction:column}
 .eco-button {width:100%}
 .eco-panel {padding:15px}
 .eco-bar-label {font-size:11px}
 .eco-section-head h2 {font-size:19px}
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

function formatNumber(value: number | null) {
  if (value === null) return "داده موجود نیست";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatGrowth(value: number | null) {
  if (value === null) return "داده موجود نیست";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}٪`;
}

function getFlag(code: string) {
  const flags: Record<string, string> = {
    USA:"🇺🇸",CHN:"🇨🇳",JPN:"🇯🇵",DEU:"🇩🇪",IND:"🇮🇳",
    GBR:"🇬🇧",FRA:"🇫🇷",ITA:"🇮🇹",RUS:"🇷🇺",BRA:"🇧🇷",
    CAN:"🇨🇦",KOR:"🇰🇷",AUS:"🇦🇺",ESP:"🇪🇸",MEX:"🇲🇽",
    IDN:"🇮🇩",TUR:"🇹🇷",SAU:"🇸🇦",NLD:"🇳🇱",CHE:"🇨🇭",
    IRN:"🇮🇷",PAK:"🇵🇰",POL:"🇵🇱",SWE:"🇸🇪",BEL:"🇧🇪",
    ARG:"🇦🇷",NOR:"🇳🇴",AUT:"🇦🇹",THA:"🇹🇭",VNM:"🇻🇳",
    EGY:"🇪🇬",NGA:"🇳🇬",ZAF:"🇿🇦",ARE:"🇦🇪",ISR:"🇮🇱",
    IRQ:"🇮🇶",AFG:"🇦🇫",UKR:"🇺🇦",SGP:"🇸🇬",MYS:"🇲🇾",
    PHL:"🇵🇭",BGD:"🇧🇩",CHL:"🇨🇱",COL:"🇨🇴",NZL:"🇳🇿",
    PRT:"🇵🇹",GRC:"🇬🇷",CZE:"🇨🇿",ROU:"🇷🇴",HUN:"🇭🇺",
  };
  return flags[code] ?? "🌐";
}

function latestValues(rows: IndicatorRow[]) {
  const values = new Map<string, { value: number; year: string }>();

  for (const row of rows) {
    const code = row.countryiso3code;
    const year = row.date;
    const value = row.value === null || row.value === undefined
      ? NaN
      : Number(row.value);

    if (!code || !year || !Number.isFinite(value)) continue;

    const previous = values.get(code);
    if (!previous || Number(year) > Number(previous.year)) {
      values.set(code, { value, year });
    }
  }

  return values;
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

        const api = "https://api.worldbank.org/v2";
        const query = "format=json&per_page=20000&date=2018:2026";

        // دریافت فهرست رسمی کشورها برای حذف قاره‌ها و گروه‌ها
        const countriesResponse = await fetch(
          `${api}/country?format=json&per_page=400`
        );

        if (!countriesResponse.ok) {
          throw new Error("دریافت فهرست کشورها ناموفق بود.");
        }

        const countriesResult = await countriesResponse.json();
        const countryRows = countriesResult?.[1];

        if (!Array.isArray(countryRows)) {
          throw new Error("فهرست رسمی کشورها معتبر نیست.");
        }

        const countryNames = new Map<string, string>();

        for (const country of countryRows) {
          const code = country?.id;
          const name = country?.name;
          const region = country?.region?.value;

          if (
            !code ||
            !name ||
            !region ||
            region === "Aggregates" ||
            !/^[A-Z]{3}$/.test(code)
          ) {
            continue;
          }

          countryNames.set(code, name);
        }

        if (countryNames.size === 0) {
          throw new Error("فهرست کشورهای معتبر خالی است.");
        }

        // دریافت چهار شاخص اقتصادی از API واقعی بانک جهانی
        const indicatorEntries = Object.entries(INDICATORS);

        const indicatorResults = await Promise.all(
          indicatorEntries.map(async ([key, indicator]) => {
            const response = await fetch(
              `${api}/country/all/indicator/${indicator}?${query}`
            );

            if (!response.ok) {
              throw new Error(
                `دریافت شاخص ${indicator} ناموفق بود.`
              );
            }

            const result = await response.json();

            if (!Array.isArray(result?.[1])) {
              throw new Error(
                `داده شاخص ${indicator} معتبر نیست.`
              );
            }

            return [
              key,
              latestValues(result[1] as IndicatorRow[]),
            ] as const;
          })
        );

        const data = new Map(indicatorResults);

        const gdpData = data.get("gdp");
        const growthData = data.get("growth");
        const perCapitaData = data.get("gdpPerCapita");
        const populationData = data.get("population");

        const merged: Economy[] = Array.from(
          countryNames.entries()
        ).map(([code, country]) => {
          const gdp = gdpData?.get(code);
          const growth = growthData?.get(code);
          const perCapita = perCapitaData?.get(code);
          const population = populationData?.get(code);

          return {
            country,
            code,
            gdp: gdp?.value ?? null,
            gdpYear: gdp?.year ?? null,
            growth: growth?.value ?? null,
            growthYear: growth?.year ?? null,
            gdpPerCapita: perCapita?.value ?? null,
            gdpPerCapitaYear: perCapita?.year ?? null,
            population: population?.value ?? null,
            populationYear: population?.year ?? null,
          };
        });

        // رتبه‌بندی فقط کشورهایی که داده GDP دارند
        const sorted = merged
          .filter((item) => item.gdp !== null)
          .sort((a, b) => (b.gdp ?? 0) - (a.gdp ?? 0));

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
          <a href="/" className="eco-back">
            ← بازگشت به Econova
          </a>

          <p className="eco-eyebrow">ECONOVA • WORLD ECONOMIES</p>
          <h1 className="eco-title">اقتصادهای جهان</h1>
          <p className="eco-description">
            رتبه‌بندی کشورها بر اساس تولید ناخالص داخلی اسمی،
            همراه با رشد اقتصادی، GDP سرانه و جمعیت؛ با داده‌های
            واقعی بانک جهانی. قاره‌ها و گروه‌های اقتصادی در
            فهرست کشورها نمایش داده نمی‌شوند.
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
            {showAll
              ? "نمایش ۲۰ اقتصاد برتر"
              : "نمایش فهرست کامل کشورها"}
          </button>
        </div>

        <div className="eco-section-head">
          <div>
            <h2>۲۰ اقتصاد بزرگ جهان</h2>
            <p className="eco-muted">
              معیار رتبه‌بندی: GDP اسمی به دلار آمریکا
            </p>
          </div>
          <span className="eco-source">منبع: World Bank</span>
        </div>

        {loading && (
          <p className="eco-status">
            در حال دریافت فهرست کشورها و شاخص‌های اقتصادی واقعی...
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
              نمودار بر اساس آخرین GDP موجود برای هر کشور
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
                        <span
                          style={{ color: "#8794a4", marginLeft: 8 }}
                        >
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
              سال آخرین داده ممکن است بین کشورها متفاوت باشد.
            </p>
          </section>
        )}

        {!loading && !error && economies.length > 0 && (
          <>
            <div className="eco-section-head">
              <div>
                <h2>
                  {showAll
                    ? "فهرست کشورها"
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
                      <th>کشور</th>
                      <th>GDP اسمی</th>
                      <th>رشد سالانه GDP</th>
                      <th>GDP سرانه</th>
                      <th>جمعیت</th>
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

                        <td>
                          <div className="eco-metric">
                            {formatMoney(economy.gdp)}
                          </div>
                          <div className="eco-muted">
                            سال: {economy.gdpYear ?? "نامشخص"}
                          </div>
                        </td>

                        <td>
                          <div
                            className="eco-metric"
                            style={{
                              color:
                                economy.growth === null
                                  ? "#8794a4"
                                  : economy.growth >= 0
                                    ? "#b9f27c"
                                    : "#ff9292",
                            }}
                          >
                            {formatGrowth(economy.growth)}
                          </div>
                          <div className="eco-muted">
                            سال: {economy.growthYear ?? "نامشخص"}
                          </div>
                        </td>

                        <td>
                          <div className="eco-metric">
                            {formatMoney(economy.gdpPerCapita)}
                          </div>
                          <div className="eco-muted">
                            سال: {economy.gdpPerCapitaYear ?? "نامشخص"}
                          </div>
                        </td>

                        <td>
                          <div className="eco-metric">
                            {formatNumber(economy.population)}
                          </div>
                          <div className="eco-muted">
                            سال: {economy.populationYear ?? "نامشخص"}
                          </div>
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
          منبع: World Bank Open Data
          <br />
          GDP: NY.GDP.MKTP.CD
          <br />
          رشد سالانه GDP: NY.GDP.MKTP.KD.ZG
          <br />
          GDP سرانه: NY.GDP.PCAP.CD
          <br />
          جمعیت: SP.POP.TOTL
          <br />
          فهرست کشورها از اطلاعات رسمی بانک جهانی ساخته می‌شود؛
          مناطق و گروه‌های تجمیعی در رتبه‌بندی کشورها قرار نمی‌گیرند.
          <br />
          آخرین سال موجود برای هر شاخص نمایش داده می‌شود؛ ممکن است
          سال داده‌ها بین کشورها و شاخص‌ها متفاوت باشد.
          <br />
          <a
            href="https://data.worldbank.org/indicator/NY.GDP.MKTP.CD"
            target="_blank"
            rel="noreferrer"
          >
            مشاهده منبع رسمی GDP
          </a>
          {" · "}
          <a
            href="https://data.worldbank.org/"
            target="_blank"
            rel="noreferrer"
          >
            بانک جهانی
          </a>
        </footer>
      </section>
    </main>
  );
            }
